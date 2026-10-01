import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import motor.motor_asyncio
from pymongo import ASCENDING, DESCENDING
from app.core.config import settings
from app.core.security import get_password_hash

logger = logging.getLogger("h2s_monitor.db")

class Database:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    db: Any = None
    is_connected: bool = False
    
    # In-Memory Fallback Storage if MongoDB service is offline
    memory_db: Dict[str, List[Dict[str, Any]]] = {
        "users": [],
        "measurements": [],
        "alerts": [],
        "reference_colors": [],
        "expiry_calibration": [],
        "safety_mapping": []
    }

db = Database()

def clean_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if doc is None:
        return None
    d = dict(doc)
    d.pop("_id", None)
    return d

def clean_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [clean_doc(d) for d in docs if d is not None]

async def init_db():
    try:
        db.client = motor.motor_asyncio.AsyncIOMotorClient(
            settings.MONGODB_URL, 
            serverSelectionTimeoutMS=2000
        )
        # Test connection
        await db.client.admin.command('ping')
        db.db = db.client[settings.DATABASE_NAME]
        db.is_connected = True
        logger.info("Successfully connected to MongoDB.")
        
        # Create indexes
        await db.db.users.create_index("username", unique=True)
        await db.db.users.create_index("worker_id", unique=True)
        await db.db.measurements.create_index([("worker_id", ASCENDING), ("timestamp", DESCENDING)])
        await db.db.alerts.create_index([("worker_id", ASCENDING), ("timestamp", DESCENDING)])
        
    except Exception as e:
        logger.warning(f"MongoDB connection failed ({e}). Operating in High-Performance In-Memory DB Mode.")
        db.is_connected = False
        db.db = None

    # Seed Default Data
    await seed_default_data()

async def seed_default_data():
    now = datetime.now(timezone.utc).isoformat()

    # Remove the retired Alex demo account and its seeded records.
    if db.is_connected:
        await db.db.users.delete_many({"$or": [{"username": "worker1"}, {"worker_id": "W-101"}]})
        await db.db.measurements.delete_many({"id": "meas_001"})
    else:
        db.memory_db["users"] = [u for u in db.memory_db["users"] if u.get("username") != "worker1" and u.get("worker_id") != "W-101"]
        db.memory_db["measurements"] = [m for m in db.memory_db["measurements"] if m.get("id") != "meas_001"]
    
    # 1. Users Seed
    default_users = [
        {
            "id": "usr_m1",
            "worker_id": "M-001",
            "name": "Operations Manager",
            "username": "manager",
            "hashed_password": get_password_hash("manager123"),
            "role": "MANAGER",
            "department": "Operations Control",
            "created_at": now
        },
    ]
    
    for u in default_users:
        if db.is_connected:
            existing = await db.db.users.find_one({"username": u["username"]})
            if not existing:
                await db.db.users.insert_one(u.copy())
        else:
            if not any(x["username"] == u["username"] for x in db.memory_db["users"]):
                db.memory_db["users"].append(u.copy())

    # 2. Reference Colors Seed (6 Physical Color Stages)
    default_reference_colors = [
        {
            "stage": "WHITE",
            "display_name": "White",
            "rgb": [255, 255, 255],
            "hsv": [0, 0, 100],
            "lab": [100, 0, 0],
            "tolerance": 25.0,
            "description": "Baseline unexposed Bi+ filter paper"
        },
        {
            "stage": "PALE YELLOW",
            "display_name": "Pale Yellow",
            "rgb": [255, 249, 196],
            "hsv": [54, 23, 100],
            "lab": [97, -5, 28],
            "tolerance": 25.0,
            "description": "Initial trace reaction with Bi+ complex"
        },
        {
            "stage": "YELLOW",
            "display_name": "Yellow",
            "rgb": [255, 215, 0],
            "hsv": [51, 100, 100],
            "lab": [87, -6, 85],
            "tolerance": 25.0,
            "description": "Moderate exposure reaction level"
        },
        {
            "stage": "LIGHT BROWN",
            "display_name": "Light Brown",
            "rgb": [210, 180, 140],
            "hsv": [34, 33, 82],
            "lab": [75, 7, 24],
            "tolerance": 25.0,
            "description": "Significantly sulfide-bound Bi2S3 formation"
        },
        {
            "stage": "BROWN",
            "display_name": "Brown",
            "rgb": [139, 90, 43],
            "hsv": [29, 69, 55],
            "lab": [43, 17, 34],
            "tolerance": 25.0,
            "description": "High saturation bismuth sulfide complex"
        },
        {
            "stage": "BLACK",
            "display_name": "Black",
            "rgb": [0, 0, 0],
            "hsv": [0, 0, 0],
            "lab": [0, 0, 0],
            "tolerance": 25.0,
            "description": "Complete chemical conversion to Bi2S3"
        }
    ]

    for rc in default_reference_colors:
        if db.is_connected:
            await db.db.reference_colors.replace_one({"stage": rc["stage"]}, rc.copy(), upsert=True)
        else:
            db.memory_db["reference_colors"] = [x for x in db.memory_db["reference_colors"] if x["stage"] != rc["stage"]]
            db.memory_db["reference_colors"].append(rc.copy())

    # 3. Expiry Calibration Seed
    default_expiry_calibration = [
        {
            "state": "VALID",
            "rgb": [50, 180, 80],
            "hsv": [134, 72, 70],
            "lab": [65, -55, 40],
            "tolerance": 35.0,
            "notes": "Green indicator patch active and stable"
        },
        {
            "state": "WARNING",
            "rgb": [220, 190, 50],
            "hsv": [49, 77, 86],
            "lab": [76, -2, 65],
            "tolerance": 35.0,
            "notes": "Amber transition stage — approaching shelf-life limit"
        },
        {
            "state": "EXPIRED",
            "rgb": [200, 60, 50],
            "hsv": [4, 75, 78],
            "lab": [48, 55, 35],
            "tolerance": 35.0,
            "notes": "Red degraded state — strip chemically invalid"
        }
    ]

    for ec in default_expiry_calibration:
        if db.is_connected:
            await db.db.expiry_calibration.replace_one({"state": ec["state"]}, ec.copy(), upsert=True)
        else:
            db.memory_db["expiry_calibration"] = [x for x in db.memory_db["expiry_calibration"] if x["state"] != ec["state"]]
            db.memory_db["expiry_calibration"].append(ec.copy())

    # 4. Configurable Physical Color Stage -> 5 Safety Levels Mapping
    default_safety_mapping = {
        "WHITE": "VERY LOW",
        "PALE YELLOW": "LOW",
        "YELLOW": "MODERATE",
        "LIGHT BROWN": "RISK",
        "BROWN": "HIGH RISK",
        "BLACK": "HIGH RISK"
    }


    if db.is_connected:
        await db.db.safety_mapping.replace_one({"_id": "current_mapping"}, {"_id": "current_mapping", "mapping": default_safety_mapping}, upsert=True)
    else:
        db.memory_db["safety_mapping"] = [default_safety_mapping]

# Helper DB Accessors with strict clean_doc filtering
async def find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    if db.is_connected:
        res = await db.db.users.find_one({"username": username})
        return clean_doc(res)
    res = next((u for u in db.memory_db["users"] if u["username"] == username), None)
    return clean_doc(res)

async def find_user_by_worker_id(worker_id: str) -> Optional[Dict[str, Any]]:
    if db.is_connected:
        res = await db.db.users.find_one({"worker_id": worker_id})
        return clean_doc(res)
    res = next((u for u in db.memory_db["users"] if u["worker_id"] == worker_id), None)
    return clean_doc(res)

async def insert_user(user: Dict[str, Any]):
    if db.is_connected:
        await db.db.users.insert_one(user.copy())
    else:
        db.memory_db["users"].append(user.copy())

async def delete_worker(worker_id: str) -> Dict[str, int]:
    if db.is_connected:
        user_result = await db.db.users.delete_one({"worker_id": worker_id})
        measurement_result = await db.db.measurements.delete_many({"worker_id": worker_id})
        alert_result = await db.db.alerts.delete_many({"worker_id": worker_id})
        return {
            "users": user_result.deleted_count,
            "measurements": measurement_result.deleted_count,
            "alerts": alert_result.deleted_count
        }

    before_users = len(db.memory_db["users"])
    before_measurements = len(db.memory_db["measurements"])
    before_alerts = len(db.memory_db["alerts"])
    db.memory_db["users"] = [user for user in db.memory_db["users"] if user.get("worker_id") != worker_id]
    db.memory_db["measurements"] = [item for item in db.memory_db["measurements"] if item.get("worker_id") != worker_id]
    db.memory_db["alerts"] = [item for item in db.memory_db["alerts"] if item.get("worker_id") != worker_id]
    return {
        "users": before_users - len(db.memory_db["users"]),
        "measurements": before_measurements - len(db.memory_db["measurements"]),
        "alerts": before_alerts - len(db.memory_db["alerts"])
    }

async def find_all_users() -> List[Dict[str, Any]]:
    if db.is_connected:
        cursor = db.db.users.find({}, {"hashed_password": 0})
        res = await cursor.to_list(length=500)
        return clean_docs(res)
    return clean_docs([{k: v for k, v in u.items() if k != "hashed_password"} for u in db.memory_db["users"]])

async def insert_measurement(record: Dict[str, Any]):
    rec = record.copy()
    if db.is_connected:
        await db.db.measurements.insert_one(rec)
    else:
        db.memory_db["measurements"].append(rec)

async def get_measurements_by_worker(worker_id: str) -> List[Dict[str, Any]]:
    if db.is_connected:
        cursor = db.db.measurements.find({"worker_id": worker_id}).sort("timestamp", DESCENDING)
        res = await cursor.to_list(length=500)
        return clean_docs(res)
    res = [m for m in db.memory_db["measurements"] if m.get("worker_id") == worker_id]
    return clean_docs(sorted(res, key=lambda x: x.get("timestamp", ""), reverse=True))

async def get_all_measurements() -> List[Dict[str, Any]]:
    if db.is_connected:
        cursor = db.db.measurements.find({}).sort("timestamp", DESCENDING)
        res = await cursor.to_list(length=1000)
        return clean_docs(res)
    return clean_docs(sorted(db.memory_db["measurements"], key=lambda x: x.get("timestamp", ""), reverse=True))

async def insert_alert(alert: Dict[str, Any]):
    alt = alert.copy()
    if db.is_connected:
        await db.db.alerts.insert_one(alt)
    else:
        db.memory_db["alerts"].append(alt)

async def get_alerts_by_worker(worker_id: str) -> List[Dict[str, Any]]:
    if db.is_connected:
        cursor = db.db.alerts.find({"worker_id": worker_id}).sort("timestamp", DESCENDING)
        res = await cursor.to_list(length=200)
        return clean_docs(res)
    res = [a for a in db.memory_db["alerts"] if a.get("worker_id") == worker_id]
    return clean_docs(sorted(res, key=lambda x: x.get("timestamp", ""), reverse=True))

async def get_all_alerts() -> List[Dict[str, Any]]:
    if db.is_connected:
        cursor = db.db.alerts.find({}).sort("timestamp", DESCENDING)
        res = await cursor.to_list(length=500)
        return clean_docs(res)
    return clean_docs(sorted(db.memory_db["alerts"], key=lambda x: x.get("timestamp", ""), reverse=True))

async def get_reference_colors() -> List[Dict[str, Any]]:
    if db.is_connected:
        cursor = db.db.reference_colors.find({})
        res = await cursor.to_list(length=20)
        return clean_docs(res)
    return clean_docs(db.memory_db["reference_colors"])

async def update_reference_color(stage: str, data: Dict[str, Any]):
    d = data.copy()
    if db.is_connected:
        await db.db.reference_colors.replace_one({"stage": stage}, d, upsert=True)
    else:
        db.memory_db["reference_colors"] = [x for x in db.memory_db["reference_colors"] if x["stage"] != stage]
        db.memory_db["reference_colors"].append(d)

async def get_expiry_calibration() -> List[Dict[str, Any]]:
    if db.is_connected:
        cursor = db.db.expiry_calibration.find({})
        res = await cursor.to_list(length=20)
        return clean_docs(res)
    return clean_docs(db.memory_db["expiry_calibration"])

async def update_expiry_calibration(state: str, data: Dict[str, Any]):
    d = data.copy()
    if db.is_connected:
        await db.db.expiry_calibration.replace_one({"state": state}, d, upsert=True)
    else:
        db.memory_db["expiry_calibration"] = [x for x in db.memory_db["expiry_calibration"] if x["state"] != state]
        db.memory_db["expiry_calibration"].append(d)

async def get_safety_mapping() -> Dict[str, str]:
    if db.is_connected:
        res = await db.db.safety_mapping.find_one({"_id": "current_mapping"})
        if res and "mapping" in res:
            return res["mapping"]
    if db.memory_db["safety_mapping"]:
        return db.memory_db["safety_mapping"][0]
    return {
        "WHITE": "VERY LOW",
        "PALE YELLOW": "LOW",
        "DARK YELLOW": "MODERATE",
        "LIGHT BROWN": "RISK",
        "DARK BROWN": "HIGH RISK",
        "BLACK": "HIGH RISK"
    }

async def update_safety_mapping(mapping: Dict[str, str]):
    if db.is_connected:
        await db.db.safety_mapping.replace_one({"_id": "current_mapping"}, {"_id": "current_mapping", "mapping": mapping}, upsert=True)
    else:
        db.memory_db["safety_mapping"] = [mapping]
