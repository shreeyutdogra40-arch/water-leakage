import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Water Leakage Detection & Community Monitoring System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./water_system.db")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "aqua-flow-super-secret-production-key-2026-xyz-789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # IoT Simulator
    SIMULATION_ENABLED: bool = True
    SIMULATION_TICK_SECONDS: float = 2.0
    TESTING: bool = False
    
    # Intelligent Leakage Detection Parameters
    PERSISTENCE_MIN_TICKS: int = 3
    PRESSURE_DROP_THRESHOLD_BAR: float = 0.85
    FLOW_DISCREPANCY_PCT: float = 12.0
    NIGHT_HOURS_START: int = 1
    NIGHT_HOURS_END: int = 5
    NIGHT_MAX_FLOW_THRESHOLD_LPM: float = 8.0
    AUTO_ISOLATION_ENABLED: bool = True

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
