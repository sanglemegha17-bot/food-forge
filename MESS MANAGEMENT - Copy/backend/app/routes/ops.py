from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import date

router = APIRouter()

class MealOptIn(BaseModel):
    opt_date: date
    meal: str
    is_opted: bool

class ScanAttempt(BaseModel):
    user_id: str
    meal: str
    session_id: str | None = None  # Optional: links to meal_sessions if via QR

@router.post("/opt")
def opt_meal(payload: MealOptIn):
    # TODO: Upsert into meal_opt table
    return {"status": "success", "data": payload}

@router.post("/scan")
def scan_qr(payload: ScanAttempt):
    # TODO: Check eligibility and insert into meal_scans
    # Logical steps:
    # 1. Check if user has an active profile
    # 2. Check if already scanned today for this meal (unique constraint)
    # 3. Insert row: user_id, meal, scan_date, session_id (optional)
    return {"status": "served", "scan_time": "now"}
