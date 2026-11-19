import json
import logging
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.api import analysis, auth, experiments, export, me, models, oauth, system, upload, versions
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db.session import run_migrations
from app.services.model_loader import ModelLoader
from mlops.ab_testing import ABTestManager
from mlops.cache_manager import CacheManager
from mlops.model_versioning import ModelVersionRegistry
from mlops.monitoring import MonitoringManager, http_request_duration, http_requests_total

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


def register_baseline_version(registry: ModelVersionRegistry):
    """Register the bundled model as the current version on first start"""
    model_path = Path(settings.MODEL_DIR) / settings.DEFAULT_MODEL
    config_file = model_path / "model_config.json"
    if not config_file.exists():
        return
    config = json.loads(config_file.read_text())
    registry.register_version(
        version_name=config.get("model_version", "v1"),
        model_path=str(model_path),
        description="Bundled baseline model",
        metrics={"accuracy": config["best_accuracy"]} if "best_accuracy" in config else {},
        training_info={
            "dataset": config.get("training_dataset"),
            "best_epoch": config.get("best_epoch"),
            "num_classes": config.get("num_classes"),
        },
        tags=["baseline", settings.DEFAULT_MODEL],
        set_as_current=True,
    )
    logger.info("Registered bundled model as baseline version")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} ({settings.ENVIRONMENT})")
    settings.validate_for_runtime()
    if not settings.admin_emails:
        logger.warning("ADMIN_EMAILS is empty: no account will be granted the admin role")

    run_migrations()

    # Model registry & experiments persist in STATE_DIR (a volume in Docker)
    state_dir = Path(settings.STATE_DIR)
    state_dir.mkdir(parents=True, exist_ok=True)

    app.state.monitoring_manager = MonitoringManager()

    version_registry = ModelVersionRegistry(registry_path=str(state_dir / "registry.json"))
    if not version_registry.versions:
        register_baseline_version(version_registry)
    app.state.version_registry = version_registry

    app.state.ab_test_manager = ABTestManager(experiments_path=str(state_dir / "experiments.json"))

    model_loader = ModelLoader()
    await model_loader.load_default_model()
    app.state.model_loader = model_loader
    app.state.monitoring_manager.set_model_status(settings.DEFAULT_MODEL, model_loader.is_loaded())

    app.state.cache_manager = CacheManager()
    logger.info(f"Cache backend: {app.state.cache_manager.backend}")
    logger.info("Application startup complete")

    yield

    logger.info("Shutting down application...")
    model_loader.cleanup()
    app.state.cache_manager.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Driven Deep-Sea eDNA Analysis Pipeline with Deep Learning",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)


@app.middleware("http")
async def observe_requests(request: Request, call_next):
    """Request/error counters, Prometheus latency metrics and security headers"""
    started = time.perf_counter()
    response = await call_next(request)
    # Label by handler name (not raw path) so IDs in URLs don't explode metric cardinality
    endpoint = getattr(request.scope.get("endpoint"), "__name__", "unmatched")
    http_requests_total.labels(request.method, endpoint, str(response.status_code)).inc()
    http_request_duration.labels(request.method, endpoint).observe(time.perf_counter() - started)

    monitoring = getattr(request.app.state, "monitoring_manager", None)
    if monitoring and not request.url.path.startswith("/metrics"):
        monitoring.increment_request_count()
        if response.status_code >= 500:
            monitoring.increment_error_count()
    for header, value in SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],  # lets the browser read export filenames
)

app.mount("/metrics", make_asgi_app())
app.include_router(system.router)
app.include_router(auth.router)
app.include_router(oauth.router)
app.include_router(me.router)
app.include_router(versions.router)
app.include_router(experiments.router)
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(models.router, prefix="/api", tags=["Models"])


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/api/docs",
    }


if __name__ == "__main__":
    import uvicorn
    # Run from the backend/ folder: python -m app.main
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.WORKERS,
    )
