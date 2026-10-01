from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import base64
from app.api.auth import get_current_user
from app.vision.pipeline import vision_pipeline
from app.core.database import (
    get_reference_colors,
    get_safety_mapping,
    insert_measurement,
    insert_alert
)

router = APIRouter(prefix="/analysis", tags=["Analysis Engine"])

live_frame_buffer: Dict[str, List[Dict[str, Any]]] = {}

@router.post("/upload")
async def analyze_upload(
    file: UploadFile = File(...),
    is_demo: bool = Form(False),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Analyzes uploaded H2S sensing strip image via position-independent 15-step vision pipeline.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")
        
    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file size exceeds 15MB limit.")
        
    ref_colors = await get_reference_colors()
    safety_map = await get_safety_mapping()
    
    res = vision_pipeline.process_image(
        image_bytes=contents,
        reference_colors=ref_colors,
        safety_mapping=safety_map,
        input_type="UPLOAD"
    )
    
    timestamp = datetime.now(timezone.utc).isoformat()
    record_id = f"meas_{uuid.uuid4().hex[:8]}"
    
    record = {
        "id": record_id,
        "worker_id": current_user["worker_id"],
        "worker_name": current_user["name"],
        "timestamp": timestamp,
        "input_type": "UPLOAD",
        "is_demo": is_demo,
        "strip_valid": res["strip_valid"],
        "rejection_reason": res.get("rejection_reason"),
        "physical_color_stage": res.get("physical_color_stage", "UNKNOWN"),
        "ppm": res.get("ppm", "N/A"),
        "safety_level": res.get("safety_level", "UNKNOWN"),
        "confidence": res.get("confidence", 0.0),
        "image_quality": res.get("image_quality", "POOR"),
        "dust_status": res.get("dust_status", "UNKNOWN"),
        "sensing_rgb": res.get("sensing_rgb", [0, 0, 0]),
        "sensing_hsv": res.get("sensing_hsv", [0, 0, 0]),
        "validation": res.get("validation", {}),
        "pipeline_steps": res.get("pipeline_steps", []),
        "test_strip_bbox": res.get("test_strip_bbox"),
        "reference_scale_bbox": res.get("reference_scale_bbox"),
        "test_strip_conf": res.get("test_strip_conf", 0.94),
        "reference_scale_conf": res.get("reference_scale_conf", 0.92),
        "bbox": res.get("bbox")
    }
    
    if res["strip_valid"]:
        await insert_measurement(record)
        await evaluate_and_create_alert(record)

    return record

@router.post("/live")
async def analyze_live_frame(
    data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Analyzes live camera frame with temporal stability checking across consecutive valid frames.
    """
    image_b64 = data.get("image_base64", "")
    is_demo = data.get("is_demo", False)
    
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]
        
    try:
        contents = base64.b64decode(image_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image encoding.")
        
    ref_colors = await get_reference_colors()
    safety_map = await get_safety_mapping()
    
    res = vision_pipeline.process_image(
        image_bytes=contents,
        reference_colors=ref_colors,
        safety_mapping=safety_map,
        input_type="LIVE_CAMERA"
    )
    
    worker_id = current_user["worker_id"]
    if worker_id not in live_frame_buffer:
        live_frame_buffer[worker_id] = []
        
    buffer = live_frame_buffer[worker_id]
    
    if res["strip_valid"]:
        buffer.append(res)
        if len(buffer) > 4:
            buffer.pop(0)
            
        if len(buffer) >= 3:
            stages = [f.get("physical_color_stage") for f in buffer[-3:]]
            if len(set(stages)) == 1:
                stability = "STABLE"
                record_id = f"meas_{uuid.uuid4().hex[:8]}"
                timestamp = datetime.now(timezone.utc).isoformat()
                record = {
                    "id": record_id,
                    "worker_id": worker_id,
                    "worker_name": current_user["name"],
                    "timestamp": timestamp,
                    "input_type": "LIVE_CAMERA",
                    "is_demo": is_demo,
                    "strip_valid": True,
                    "physical_color_stage": res["physical_color_stage"],
                    "ppm": res.get("ppm", "N/A"),
                    "safety_level": res["safety_level"],
                    "confidence": res["confidence"],
                    "image_quality": res["image_quality"],
                    "dust_status": res["dust_status"],
                    "sensing_rgb": res["sensing_rgb"],
                    "sensing_hsv": res["sensing_hsv"],
                    "validation": res["validation"],
                    "pipeline_steps": res["pipeline_steps"],
                    "test_strip_bbox": res.get("test_strip_bbox"),
                    "reference_scale_bbox": res.get("reference_scale_bbox"),
                    "test_strip_conf": res.get("test_strip_conf", 0.94),
                    "reference_scale_conf": res.get("reference_scale_conf", 0.92)
                }
                
                await insert_measurement(record)
                await evaluate_and_create_alert(record)
                
                live_frame_buffer[worker_id] = []
                
                res["temporal_stability"] = "STABLE"
                res["measurement_saved"] = True
                res["record_id"] = record_id
                return res
            else:
                res["temporal_stability"] = "Measurement unstable — recapture."
                res["measurement_saved"] = False
                return res
        else:
            res["temporal_stability"] = f"Locking alignment ({len(buffer)}/3 frames)..."
            res["measurement_saved"] = False
            return res
    else:
        live_frame_buffer[worker_id] = []
        res["temporal_stability"] = "NO_LOCK"
        res["measurement_saved"] = False
        return res

async def evaluate_and_create_alert(record: Dict[str, Any]):
    safety_level = record.get("safety_level")
    stage = record.get("physical_color_stage")
    worker_id = record.get("worker_id")
    worker_name = record.get("worker_name")
    
    severity_map = {
        "MODERATE": "WARNING",
        "RISK": "ALERT",
        "HIGH RISK": "CRITICAL ALERT"
    }
    
    if safety_level in severity_map:
        severity = severity_map[safety_level]
        msg = f"{severity}: {safety_level} H₂S exposure detected ({stage} stage reaction)."
        
        await insert_alert({
            "id": f"alt_{uuid.uuid4().hex[:8]}",
            "worker_id": worker_id,
            "worker_name": worker_name,
            "timestamp": record.get("timestamp"),
            "severity": severity,
            "safety_level": safety_level,
            "physical_color_stage": stage,
            "message": msg,
            "acknowledged": False
        })
