from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.system import router as system_router

app = FastAPI(
    title="AI Job Hunter API",
    version="1.0.0",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(system_router, prefix="/api/v1")

# Also mount /health directly in root for ease of container checking
@app.get("/health", tags=["System"])
def root_health():
    return {"status": "ok"}
