from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Use the service role key for admin operations
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def get_admin_client() -> Client:
    """Get a Supabase client with admin/service-role privileges."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# --- Request Models ---

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"

class UpdatePasswordRequest(BaseModel):
    user_id: str
    new_password: str

class UpdateUserRequest(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

class DeleteUserRequest(BaseModel):
    user_id: str


# --- Endpoints ---

@router.get("/users")
def list_users():
    """List all users from the profiles table with their email from auth."""
    try:
        client = get_admin_client()
        # Fetch profiles
        profiles_res = client.table("profiles").select("*").order("created_at", desc=True).execute()
        
        # Fetch auth users to get emails
        auth_res = client.auth.admin.list_users()
        email_map = {}
        if auth_res:
            for u in auth_res:
                email_map[u.id] = u.email
        
        users = []
        for p in (profiles_res.data or []):
            users.append({
                "id": p["id"],
                "full_name": p.get("full_name", ""),
                "phone": p.get("phone", ""),
                "role": p.get("role", "student"),
                "email": email_map.get(p["id"], "N/A"),
                "created_at": p.get("created_at", ""),
            })
        
        return {"users": users}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users")
def create_user(req: CreateUserRequest):
    """Create a new user via Supabase Auth + profile."""
    try:
        client = get_admin_client()
        
        # Create auth user
        res = client.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": req.full_name,
                "role": req.role,
            }
        })
        
        if not res.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        user_id = res.user.id

        # Insert profile row
        client.table("profiles").upsert({
            "id": user_id,
            "full_name": req.full_name,
            "role": req.role,
        }).execute()

        return {"status": "created", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/password")
def update_password(req: UpdatePasswordRequest):
    """Reset a user's password (admin action)."""
    try:
        if len(req.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        client = get_admin_client()
        client.auth.admin.update_user_by_id(
            req.user_id,
            {"password": req.new_password}
        )
        return {"status": "password_updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/profile")
def update_profile(req: UpdateUserRequest):
    """Update a user's profile info."""
    try:
        client = get_admin_client()
        update_data = {}
        if req.full_name is not None:
            update_data["full_name"] = req.full_name
        if req.phone is not None:
            update_data["phone"] = req.phone
        if req.role is not None:
            update_data["role"] = req.role
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        client.table("profiles").update(update_data).eq("id", req.user_id).execute()
        return {"status": "profile_updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users")
def delete_user(req: DeleteUserRequest):
    """Delete a user from auth and profiles (cascade)."""
    try:
        client = get_admin_client()
        
        # Delete from Supabase Auth (profile row will cascade-delete)
        client.auth.admin.delete_user(req.user_id)
        
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
