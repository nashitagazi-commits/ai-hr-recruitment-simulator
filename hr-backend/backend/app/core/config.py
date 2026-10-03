from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./hr.db"
    SECRET_KEY: str = "dev-secret-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 5
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
