# app/routes/auth_test_routes.py
from fastapi import APIRouter, Depends, Request
from app.auth.supabase_middleware import verify_token

router = APIRouter(prefix="/auth-test", tags=["Auth Test"])

@router.get("/protected")
async def protected_route(request: Request, payload=Depends(verify_token)):
    return {
        "success": True,
        "user_id": request.state.user_id,
        "role": request.state.role
    }
