import os

class Settings:
    PROJECT_NAME: str = "H₂S Safety Monitor"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih-2026-h2s-safety-monitor-super-secret-key-321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "h2s_safety_monitor")
    
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "models/best.pt")

settings = Settings()
