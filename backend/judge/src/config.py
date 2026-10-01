import os
from pathlib import Path
from pydantic import BaseModel, Field

# Ensure root .env variables are loaded into environment
_root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if _root_env.exists():
    try:
        with open(_root_env, "r", encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    _k = _k.strip()
                    _v = _v.strip().strip("'").strip('"')
                    if _k and _k not in os.environ:
                        os.environ[_k] = _v
    except Exception:
        pass

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
    worker_concurrency: int = Field(
        default_factory=lambda: int(os.getenv("WORKER_CONCURRENCY", "8"))
    )
    cache_enabled: bool = Field(
        default_factory=lambda: os.getenv("COMPILATION_CACHE_ENABLED", "true").lower() in ("true", "1")
    )
    cache_dir: str = Field(
        default_factory=lambda: os.getenv(
            "COMPILATION_CACHE_DIR",
            str(Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) / ".cache")
        )
    )
    cache_max_entries: int = Field(
        default_factory=lambda: int(os.getenv("COMPILATION_CACHE_MAX_ENTRIES", "500"))
    )
    http_host: str = Field(
        default_factory=lambda: os.getenv("JUDGE_HTTP_HOST", "127.0.0.1")
    )
    http_port: int = Field(
        default_factory=lambda: int(os.getenv("JUDGE_HTTP_PORT", "8080"))
    )

config = JudgeConfig()

