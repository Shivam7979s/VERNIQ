import os
from pydantic import BaseModel, Field

class JudgeConfig(BaseModel):
    supabase_url: str = Field(
        default_factory=lambda: os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
    )
    supabase_service_role_key: str = Field(
        default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    )
    supabase_anon_key: str = Field(
        default_factory=lambda: os.getenv("SUPABASE_ANON_KEY", "")
    )
    poll_interval_seconds: float = Field(
        default_factory=lambda: float(os.getenv("POLL_INTERVAL_SECONDS", "1.0"))
    )
    max_cpu_time_seconds: float = Field(
        default_factory=lambda: float(os.getenv("MAX_CPU_TIME_SECONDS", "2.0"))
    )
    max_memory_mb: int = Field(
        default_factory=lambda: int(os.getenv("MAX_MEMORY_MB", "256"))
    )
    worker_id: str = Field(
        default_factory=lambda: os.getenv("WORKER_ID", "judge-worker-1")
    )

config = JudgeConfig()
