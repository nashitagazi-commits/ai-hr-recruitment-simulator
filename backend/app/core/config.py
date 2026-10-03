from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./hr.db"
    SECRET_KEY: str = "dev-secret-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 5
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ---- AI layer (everything has a fallback, so all of this is optional) ----
    OPENAI_API_KEY: str = ""                 # GPT, TTS and (optionally) Whisper API
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_TTS_MODEL: str = "tts-1"
    OPENAI_TTS_VOICE: str = "alloy"
    WHISPER_MODE: str = "auto"               # auto | api | local
    WHISPER_LOCAL_MODEL: str = "base"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    USE_EMBEDDINGS: bool = True
    CHROMA_DIR: str = "chroma_db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
