from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models import EDAResult, Dataset, DatasetVersion, User
from ..auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

class JobResponse(BaseModel):
    id: str
    type: str
    dataset_name: str
    dataset_id: str
    status: str
    created_at: datetime
    duration: Optional[str] = None

def determine_eda_status(eda: EDAResult) -> str:
    if not eda:
        return "not_started"
    if eda.summaryJson and eda.summaryJson.get("error"):
        return "failed"
    if eda.resultS3Key == "pending":
        return "pending"
    if eda.resultS3Key == "running":
        return "running"
    if eda.summaryJson:
        return "completed"
    return "pending"

@router.get("", response_model=List[JobResponse])
async def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Query EDA Results joined with Dataset info
    # We join EDAResult -> DatasetVersion -> Dataset
    query = db.query(EDAResult, Dataset)\
        .join(DatasetVersion, EDAResult.datasetVersionId == DatasetVersion.id)\
        .join(Dataset, DatasetVersion.datasetId == Dataset.id)\
        .filter(Dataset.tenantId == current_user.tenantId)\
        .order_by(EDAResult.createdAt.desc())
        
    results = query.all()
    
    jobs = []
    for eda, dataset in results:
        status = determine_eda_status(eda)
        jobs.append({
            "id": eda.id,
            "type": "EDA Analysis",
            "dataset_name": dataset.name,
            "dataset_id": dataset.id,
            "status": status,
            "created_at": eda.createdAt,
            "duration": "N/A" # Could calculate if we had finishedAt
        })
        
    return jobs
