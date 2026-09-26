from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Precision deep-learning engine for synthetic image detection based on the CIFAKE benchmark.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "operational",
        "service": "CIFAKE Engine",
        "models": ["resnet18"],
        "input_resolution": "32x32 RGB"
    }

# Include API routes
app.include_router(api_router, prefix="/api")

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # In accordance with specification: Never expose raw stack traces or internal filesystem paths
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred while processing the request."}
    )
