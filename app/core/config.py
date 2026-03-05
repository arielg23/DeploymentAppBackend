from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/smartlock"
    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    admin_email: str = "admin@example.com"
    admin_password: str = "changeme123"
    allowed_origins: str = "*"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
