"""Authentication middleware for Entra ID JWT validation and API key auth.

Supports three auth methods (checked in order):
1. API key: Bearer token starting with "wyre_ak_"
2. Entra ID JWT: Any other Bearer token
3. Dev mode: X-Dev-Engineer-OID header (when IMPACT_DEV_MODE=true)
"""

import hashlib

from fastapi import Depends, Header, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func
import httpx

from apps.api.config import settings
from apps.api.db import get_session
from apps.api.models.schema import ApiKey, Engineer

# Cache for Entra ID JWKS keys
_jwks_cache: dict | None = None

API_KEY_PREFIX = "wyre_ak_"


def _hash_api_key(raw_key: str) -> str:
    """SHA-256 hash of a raw API key."""
    return hashlib.sha256(raw_key.encode()).hexdigest()


async def _get_jwks() -> dict:
    """Fetch and cache Entra ID JSON Web Key Set."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    jwks_url = (
        f"https://login.microsoftonline.com/{settings.entra_tenant_id}"
        "/discovery/v2.0/keys"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


async def _resolve_api_key(token: str, db: AsyncSession) -> str | None:
    """If token is a wyre_ak_ API key, validate it and return the engineer's entra_oid.

    Returns None if the token is not an API key (so caller falls through to JWT).
    Raises HTTPException if the key is invalid or inactive.
    """
    if not token.startswith(API_KEY_PREFIX):
        return None

    key_hash = _hash_api_key(token)
    result = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == key_hash)
    )
    api_key = result.scalar_one_or_none()

    if api_key is None:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if not api_key.active:
        raise HTTPException(status_code=401, detail="API key has been revoked")

    # Update last_used_at timestamp
    await db.execute(
        update(ApiKey)
        .where(ApiKey.id == api_key.id)
        .values(last_used_at=func.now())
    )
    await db.commit()

    # Resolve engineer entra_oid
    engineer = await db.get(Engineer, api_key.engineer_id)
    if engineer is None:
        raise HTTPException(status_code=401, detail="Engineer not found for API key")

    return engineer.entra_oid


async def get_current_engineer_oid(
    request: Request,
    x_dev_engineer_oid: str | None = Header(None),
    db: AsyncSession = Depends(get_session),
) -> str:
    """Extract and validate the engineer's Entra OID from the request.

    Auth methods checked in order:
    1. API key (Bearer wyre_ak_...)
    2. Entra ID JWT (any other Bearer token)
    3. Dev mode bypass (X-Dev-Engineer-OID header)
    """
    # Dev mode bypass
    if settings.dev_mode and x_dev_engineer_oid:
        return x_dev_engineer_oid

    # Extract bearer token
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.removeprefix("Bearer ")

    # Try API key auth first
    oid = await _resolve_api_key(token, db)
    if oid is not None:
        return oid

    # Fall through to Entra JWT validation
    try:
        jwks = await _get_jwks()
        unverified_header = jwt.get_unverified_header(token)

        # Find the signing key
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header.get("kid"):
                rsa_key = key
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find signing key")

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.entra_client_id,
            issuer=f"https://login.microsoftonline.com/{settings.entra_tenant_id}/v2.0",
        )

        oid = payload.get("oid")
        if not oid:
            raise HTTPException(status_code=401, detail="Token missing OID claim")

        return oid

    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {exc}")


async def get_optional_engineer_oid(
    request: Request,
    x_dev_engineer_oid: str | None = Header(None),
    db: AsyncSession = Depends(get_session),
) -> str | None:
    """Like get_current_engineer_oid but returns None instead of 401.

    Use for read-only endpoints that should work without auth (dashboard).
    """
    try:
        return await get_current_engineer_oid(request, x_dev_engineer_oid, db)
    except HTTPException:
        return None
