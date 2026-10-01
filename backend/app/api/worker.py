from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from app.api.auth import get_current_user, require_role
from app.core.database import get_measurements_by_worker, get_alerts_by_worker

router = APIRouter(prefix="/worker", tags=["Worker API"])

@router.get("/dashboard")
async def get_worker_dashboard(current_user: Dict[str, Any] = Depends(require_role("WORKER"))):
    worker_id = current_user["worker_id"]
    measurements = await get_measurements_by_worker(worker_id)
    alerts = await get_alerts_by_worker(worker_id)
    
    latest = measurements[0] if measurements else None
    
    total_tests = len(measurements)
    active_alerts = len([a for a in alerts if not a.get("acknowledged", False)])
    
    return {
        "worker_info": current_user,
        "total_tests": total_tests,
        "active_alerts_count": active_alerts,
        "latest_measurement": latest,
        "recent_history": measurements[:5],
        "recent_alerts": alerts[:5]
    }

@router.get("/history")
async def get_worker_history(current_user: Dict[str, Any] = Depends(require_role("WORKER"))):
    worker_id = current_user["worker_id"]
    measurements = await get_measurements_by_worker(worker_id)
    return measurements

@router.get("/alerts")
async def get_worker_alerts(current_user: Dict[str, Any] = Depends(require_role("WORKER"))):
    worker_id = current_user["worker_id"]
    alerts = await get_alerts_by_worker(worker_id)
    return alerts
