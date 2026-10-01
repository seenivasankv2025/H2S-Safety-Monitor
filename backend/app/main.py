from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging
from app.core.config import settings
from app.core.database import init_db
from app.api import auth, worker, analysis, manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("h2s_monitor.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing H₂S Safety Monitor Backend Engine...")
    await init_db()
    yield
    logger.info("Shutting down backend engine.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(worker.router, prefix=settings.API_V1_STR)
app.include_router(manager.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "ONLINE",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs"
    }
