from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from .routes import eda, billing
from .database import engine, Base

# Create tables if they don't exist (basic auto-migration for dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project IDA API")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Router
api_router = APIRouter(prefix="/api/v1")
api_router.include_router(eda.router)
api_router.include_router(billing.router)

app.include_router(api_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
