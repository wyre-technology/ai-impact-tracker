"""Authentication middleware for Entra ID JWT validation.

In dev mode (IMPACT_DEV_MODE=true), accepts an X-Dev-Engineer-OID header
as a bypass for local development without Entra ID.
"""

from fastapi import Depends, Header, HTTPException, Request
from jose import JWTError, jwt
import httpx

from apps.api.config import settings

# Cache for Entra ID JWKS keys
_jwks_cache: dict | None = None


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


async def get_current_engineer_oid(
    request: Request,
    x_dev_engineer_oid: str | None = Header(None),
) -> str:
    """Extract and validate the engineer's Entra OID from the request.

    In dev mode, accepts X-Dev-Engineer-OID header directly.
    In production, validates the Entra ID JWT bearer token.
    """
    # Dev mode bypass
    if settings.dev_mode and x_dev_engineer_oid:
        return x_dev_engineer_oid

    # Extract bearer token
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.removeprefix("Bearer ")

    try:
        # Get JWKS and decode token
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
