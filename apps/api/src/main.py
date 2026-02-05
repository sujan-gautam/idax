from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from .routes import eda, billing, uploads, projects, jobs, admin
from .database import engine, Base, SessionLocal
from .models import Tenant, User

# Create tables if they don't exist (basic auto-migration for dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project IDA API")

@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("Seeding database...")
            tenant = Tenant(name="Demo Tenant", plan="PRO")
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            
            # Create admin user with ADMIN role
            user = User(email="demo@antigravity.ai", name="Demo User", tenantId=tenant.id, role="ADMIN")
            db.add(user)
            db.commit()
            print("Database seeded with Demo Admin User.")
    except Exception as e:
        print(f"Seeding failed: {e}")
    finally:
        db.close()

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
api_router.include_router(uploads.router)
api_router.include_router(projects.router)
api_router.include_router(jobs.router)
api_router.include_router(admin.router)

app.include_router(api_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
