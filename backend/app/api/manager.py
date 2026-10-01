from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.api.auth import require_role
from app.core.database import get_all_measurements, get_all_alerts, find_all_users, get_measurements_by_worker, find_user_by_worker_id, delete_worker

router = APIRouter(prefix="/manager", tags=["Manager API"])

@router.get("/dashboard")
async def get_manager_dashboard(current_user: Dict[str, Any] = Depends(require_role("MANAGER"))):
    measurements = await get_all_measurements()
    alerts = await get_all_alerts()
    workers = await find_all_users()
    latest_by_worker = {}
    for measurement in measurements:
        latest_by_worker.setdefault(measurement.get("worker_id"), measurement)
    high_risk_count = sum(
        1 for measurement in latest_by_worker.values()
        if str(measurement.get("safety_level", "")).upper() in {"HIGH RISK", "CRITICAL"}
        or "DARK BROWN" in str(measurement.get("physical_color_stage", "")).upper()
    )
    danger_count = sum(
        1 for measurement in latest_by_worker.values()
        if str(measurement.get("safety_level", "")).upper() == "DANGER"
        or str(measurement.get("physical_color_stage", "")).upper() == "BLACK"
    )
    classification_map = {
        "WHITE": "VERY LOW",
        "PALE YELLOW": "LOW",
        "DISTINCT YELLOW": "MODERATE",
        "YELLOW": "MODERATE",
        "BROWN": "RISK",
        "DARK BROWN": "HIGH RISK",
        "BLACK": "DANGER"
    }
    classification_counts = {level: 0 for level in ["VERY LOW", "LOW", "MODERATE", "RISK", "HIGH RISK", "DANGER"]}
    for measurement in measurements:
        classification = classification_map.get(str(measurement.get("physical_color_stage", "")).upper().strip())
        if classification:
            classification_counts[classification] += 1

    return {
        "manager_info": current_user,
        "total_workers": len([w for w in workers if w.get("role", "").upper() == "WORKER"]),
        "total_measurements": len(measurements),
        "total_alerts": len(alerts),
        "active_alerts": high_risk_count + danger_count,
        "active_alert_counts": {"HIGH RISK": high_risk_count, "DANGER": danger_count},
        "classification_counts": classification_counts,
        "all_recorded_tests": measurements,
        "latest_measurements": measurements[:5],
        "recent_alerts": alerts[:5],
        "workers": workers
    }

@router.get("/workers")
async def get_manager_workers(current_user: Dict[str, Any] = Depends(require_role("MANAGER"))):
    workers = await find_all_users()
    measurements = await get_all_measurements()
    test_counts = {}
    latest_tests = {}
    for measurement in measurements:
        worker_id = measurement.get("worker_id")
        if worker_id:
            test_counts[worker_id] = test_counts.get(worker_id, 0) + 1
            latest_tests.setdefault(worker_id, measurement)

    return [
        {
            **worker,
            "total_tests": test_counts.get(worker.get("worker_id"), 0),
            "latest_test": latest_tests.get(worker.get("worker_id")),
            "status": "ACTIVE"
        }
        for worker in workers
        if worker.get("role", "").upper() == "WORKER"
    ]

@router.get("/workers/{worker_id}")
async def get_manager_worker_profile(worker_id: str, current_user: Dict[str, Any] = Depends(require_role("MANAGER"))):
    worker = await find_user_by_worker_id(worker_id)
    if not worker or worker.get("role", "").upper() != "WORKER":
        raise HTTPException(status_code=404, detail="Worker not found")

    history = await get_measurements_by_worker(worker_id)
    return {
        "worker": worker,
        "latest_test": history[0] if history else None,
        "history": history
    }

@router.delete("/workers/{worker_id}")
async def remove_manager_worker(worker_id: str, current_user: Dict[str, Any] = Depends(require_role("MANAGER"))):
    worker = await find_user_by_worker_id(worker_id)
    if not worker or worker.get("role", "").upper() != "WORKER":
        raise HTTPException(status_code=404, detail="Worker not found")
    deleted = await delete_worker(worker_id)
    return {"message": "Worker removed", "worker_id": worker_id, "deleted": deleted}

@router.get("/alerts")
async def get_manager_alerts(current_user: Dict[str, Any] = Depends(require_role("MANAGER"))):
    workers = {
        worker.get("worker_id"): worker
        for worker in await find_all_users()
        if worker.get("role", "").upper() == "WORKER"
    }
    latest_by_worker = {}
    for measurement in await get_all_measurements():
        worker_id = measurement.get("worker_id")
        if worker_id and worker_id in workers and worker_id not in latest_by_worker:
            latest_by_worker[worker_id] = measurement

    risk_workers = []
    high_risk_workers = []
    danger_workers = []
    for worker_id, measurement in latest_by_worker.items():
        safety_level = measurement.get("safety_level", "").upper()
        stage = str(measurement.get("physical_color_stage", "")).upper()
        if safety_level not in {"RISK", "HIGH RISK", "CRITICAL", "DANGER"} and stage not in {"DARK BROWN", "BLACK"}:
            continue
        worker = workers[worker_id]
        item = {
            "worker_id": worker_id,
            "name": worker.get("name") or worker.get("username"),
            "department": worker.get("department", "Plant Operational Safety"),
            "safety_level": (
                "DANGER" if safety_level == "DANGER" or stage == "BLACK"
                else "HIGH RISK" if safety_level == "CRITICAL" or safety_level == "HIGH RISK" or stage == "DARK BROWN"
                else "RISK"
            ),
            "timestamp": measurement.get("timestamp"),
            "physical_color_stage": measurement.get("physical_color_stage", "UNKNOWN")
        }
        (danger_workers if item["safety_level"] == "DANGER" else high_risk_workers if item["safety_level"] == "HIGH RISK" else risk_workers).append(item)

    return {"risk_workers": risk_workers, "high_risk_workers": high_risk_workers, "danger_workers": danger_workers}

@router.get("/reports")
async def get_manager_reports(current_user: Dict[str, Any] = Depends(require_role("MANAGER"))):
    measurements = await get_all_measurements()
    alerts = await get_all_alerts()
    workers = await find_all_users()
    classification_map = {
        "WHITE": "VERY LOW",
        "PALE YELLOW": "LOW",
        "DISTINCT YELLOW": "MODERATE",
        "YELLOW": "MODERATE",
        "BROWN": "RISK",
        "DARK BROWN": "HIGH RISK",
        "BLACK": "DANGER"
    }
    classification_counts = {
        "VERY LOW": 0,
        "LOW": 0,
        "MODERATE": 0,
        "RISK": 0,
        "HIGH RISK": 0,
        "DANGER": 0
    }
    classification_tests = {classification: [] for classification in classification_counts}
    for measurement in measurements:
        stage = str(measurement.get("physical_color_stage", "")).upper().strip()
        classification = classification_map.get(stage)
        if classification:
            classification_counts[classification] += 1
            classification_tests[classification].append(measurement)

    return {
        "summary": {
            "total_tests": len(measurements),
            "total_workers": len([w for w in workers if w.get("role", "").upper() == "WORKER"]),
            "latest_test": measurements[0] if measurements else None,
            "classification_counts": classification_counts
        },
        "measurements": measurements,
        "classification_tests": classification_tests,
        "alerts": alerts[:10]
    }
