from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
# from app.main import supabase, get_user_id 

router = APIRouter()

# Schemas
class MenuItem(BaseModel):
    meal: str  # breakfast, lunch, dinner
    item_name: str
    is_special: bool = False

class MenuDay(BaseModel):
    menu_date: date
    items: list[MenuItem]

@router.get("/")
def get_menu(date: date):
    # TODO: Fetch from Supabase / Neon for the given date
    return {
        "date": date,
        "items": [
            {"meal": "breakfast", "item_name": "Idli Sambar", "is_special": False},
            {"meal": "lunch", "item_name": "Rice & Dal", "is_special": False},
            {"meal": "dinner", "item_name": "Chapati & Curry", "is_special": True},
        ]
    }

@router.post("/")
def create_menu(menu: MenuDay):
    # TODO: Insert into Supabase (Admin only)
    return {"status": "created", "date": menu.menu_date}
