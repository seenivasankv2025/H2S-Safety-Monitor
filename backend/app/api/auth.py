from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from uuid import uuid4
from app.core.security import verify_password, create_access_token, decode_access_token, get_password_hash
from app.core.database import find_user_by_username, find_user_by_worker_id, insert_user, db

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    access_id: str
    password: str
    role: Optional[str] = "WORKER"
    department: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    user = await find_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.get("role", "").upper() not in {"WORKER", "MANAGER"}:
        raise HTTPException(status_code=403, detail="Only worker and manager accounts are supported")
        
    user_clean = {k: v for k, v in user.items() if k != "hashed_password" and k != "_id"}
    return user_clean

def require_role(allowed_role: str):
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get("role", "").upper()
        if user_role != allowed_role.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires {allowed_role} authorization."
            )
        return current_user
    return role_checker

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    username = req.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username or Access ID is required")

    user = await find_user_by_username(username)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    if user.get("role", "").upper() not in {"WORKER", "MANAGER"}:
        raise HTTPException(status_code=400, detail="Only worker and manager accounts are supported")
        
    if not verify_password(req.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    access_token = create_access_token(data={"sub": user["username"], "role": user["role"], "worker_id": user["worker_id"]})
    
    user_clean = {k: v for k, v in user.items() if k != "hashed_password" and k != "_id"}
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_clean
    }

@router.post("/register")
async def register(req: RegisterRequest):
    access_id = req.access_id.strip()
    role = (req.role or "WORKER").upper()
    department = (req.department or "").strip()
    if role not in {"WORKER", "MANAGER"}:
        raise HTTPException(status_code=400, detail="Role must be either WORKER or MANAGER")
    if len(access_id) < 3:
        raise HTTPException(status_code=400, detail="Access ID must be at least 3 characters")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if role == "WORKER" and not department:
        raise HTTPException(status_code=400, detail="Department is required for worker accounts")
    if await find_user_by_username(access_id):
        raise HTTPException(status_code=409, detail="That Access ID is already registered")

    worker = {
        "id": f"usr_{uuid4().hex[:10]}",
        "worker_id": f"{'M' if role == 'MANAGER' else 'W'}-{uuid4().hex[:8].upper()}",
        "name": access_id,
        "username": access_id,
        "hashed_password": get_password_hash(req.password),
        "role": role,
        "department": "Operations Control" if role == "MANAGER" else department,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await insert_user(worker)
    return {"message": "The account was created", "role": role}

@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user
