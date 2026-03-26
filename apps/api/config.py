"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuration for the Impact API."""

    # Database
    database_url: str = "postgresql+asyncpg://impact:impact@localhost:5432/impact"

    # Auth - Entra ID
    entra_tenant_id: str = ""
    entra_client_id: str = ""
    entra_authority: str = ""

    # Dev mode: when True, accept X-Dev-Engineer-OID header instead of JWT
    dev_mode: bool = True

    # General
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_prefix": "IMPACT_", "env_file": ".env"}


settings = Settings()
