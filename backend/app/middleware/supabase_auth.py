# File: app/middleware/supabase_auth.py
from fastapi import Request, HTTPException, Depends, WebSocket
import jwt
import os

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# ---------------------------------------------------------
# 1️⃣ HTTP endpoint authentication dependency
# ---------------------------------------------------------
async def verify_token(request: Request):
    """
    Extract and verify JWT from Authorization header.
    Attaches user_id and role to request.state.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split(" ")[1]
    try:
        # --- THIS IS THE FIX ---
        # We must explicitly tell PyJWT what 'audience' to accept.
        # For Supabase, this is 'authenticated'.
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256"], 
            audience="authenticated"  # <-- ADD THIS LINE
        )
        # --- END OF FIX ---
    except jwt.PyJWTError as e:
        # This will now correctly show "Invalid token: Invalid audience"
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    # Attach user info to request.state
    request.state.user_id = payload.get("sub")
    request.state.role = payload.get("role", "spectator") # This 'role' is from the token, not your DB

    return payload


# ---------------------------------------------------------
# 2️⃣ WebSocket authentication helper
# ---------------------------------------------------------
async def verify_ws_token(websocket: WebSocket) -> dict:
    """
    Extract and verify token from WebSocket query parameters.
    e.g. ws://.../ws/race/{id}?token=xxxxx
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        raise ValueError("Missing token")

    try:
        # --- ADD THE FIX HERE AS WELL ---
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256"], 
            audience="authenticated"  # <-- ADD THIS LINE
        )
        # --- END OF FIX ---
        user_id = payload.get("sub")
        role = payload.get("role", "spectator")
        return {"user_id": user_id, "role": role}
    except jwt.PyJWTError:
        await websocket.close(code=4002)
        raise ValueError("Invalid or expired token")