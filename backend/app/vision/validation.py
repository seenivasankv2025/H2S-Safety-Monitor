import numpy as np
from typing import Dict, Any, Optional

def validate_strip_and_image(
    yolo_result: Dict[str, Any],
    image_shape: tuple,
    quality_result: Dict[str, Any],
    contamination_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validates dynamic YOLO11 object detections (test_strip and reference_scale).
    Excludes all expiry patch logic.
    """
    img_h, img_w = image_shape[:2]
    
    test_strip_detected = yolo_result.get("test_strip_detected", False)
    ref_scale_detected = yolo_result.get("reference_scale_detected", False)
    
    test_strip_bbox = yolo_result.get("test_strip_bbox")
    ref_scale_bbox = yolo_result.get("reference_scale_bbox")
    
    quality_valid = quality_result.get("quality_valid", True)
    contamination_usable = contamination_result.get("usable", True)
    
    rejection_reason = None
    
    if not test_strip_detected or not test_strip_bbox:
        rejection_reason = "TEST STRIP NOT DETECTED — Please capture the complete wristband."
    elif not ref_scale_detected or not ref_scale_bbox:
        rejection_reason = "REFERENCE SCALE NOT DETECTED — Please capture the complete reference scale."
    elif not quality_valid:
        rejection_reason = quality_result.get("issues", ["Poor image quality"])[0]
    elif not contamination_usable:
        rejection_reason = "Severe dust contamination / surface obstruction."
        
    strip_valid = (rejection_reason is None)
    
    return {
        "strip_detected": test_strip_detected,
        "reference_detected": ref_scale_detected,
        "test_strip_bbox": test_strip_bbox,
        "reference_scale_bbox": ref_scale_bbox,
        "test_strip_conf": yolo_result.get("test_strip_conf", 0.0),
        "reference_scale_conf": yolo_result.get("reference_scale_conf", 0.0),
        "image_quality": quality_result.get("status", "GOOD"),
        "dust_status": contamination_result.get("status", "CLEAN"),
        "strip_valid": strip_valid,
        "rejection_reason": rejection_reason
    }
