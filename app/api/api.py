from fastapi import APIRouter
from app.api.routes import (
    analyze,
    compare,
    batch,
    metadata,
    provenance,
    robustness,
    evidence,
    providers,
    export,
    models,
    benchmark
)

api_router = APIRouter()
api_router.include_router(analyze.router, tags=["Analyze"])
api_router.include_router(compare.router, tags=["Compare"])
api_router.include_router(batch.router, tags=["Batch"])
api_router.include_router(metadata.router, tags=["Metadata"])
api_router.include_router(provenance.router, tags=["Provenance"])
api_router.include_router(robustness.router, tags=["Robustness"])
api_router.include_router(evidence.router, tags=["Evidence"])
api_router.include_router(providers.router, tags=["Providers"])
api_router.include_router(export.router, tags=["Export"])
api_router.include_router(models.router, tags=["Models"])
api_router.include_router(benchmark.router, tags=["Benchmark"])
