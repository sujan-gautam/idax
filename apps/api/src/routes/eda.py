"""
EDA API Routes - Endpoints for exploratory data analysis
Adapted for existing database schema
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
import logging
import uuid
import os
import json

from ..database import get_db
from ..models import Dataset, DatasetVersion, EDAResult, User
from ..auth import get_current_user
from ..jobs.eda_processor import EDAProcessor

router = APIRouter(prefix="/datasets", tags=["EDA"])
logger = logging.getLogger(__name__)

def determine_status(eda: EDAResult) -> str:
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

@router.post("/{dataset_id}/analyze")
async def trigger_eda_analysis(
    dataset_id: str,
    background_tasks: BackgroundTasks,
    force_reanalyze: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.tenantId == current_user.tenantId
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    if not dataset.activeVersionId:
        raise HTTPException(status_code=400, detail="Dataset has no active version")

    existing_eda = db.query(EDAResult).filter(
        EDAResult.datasetVersionId == dataset.activeVersionId
    ).first()
    
    status = determine_status(existing_eda)
    if existing_eda and status != "failed" and not force_reanalyze:
        return {
            "message": "EDA already exists",
            "eda_id": existing_eda.id,
            "status": status
        }
    
    version = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.activeVersionId).first()
    if not version:
        raise HTTPException(status_code=404, detail="Active dataset version not found")
        
    if existing_eda:
        # Reset existing
        existing_eda.resultS3Key = "pending"
        existing_eda.summaryJson = None
        db.commit()
        eda_id = existing_eda.id
    else:
        eda_result = EDAResult(
            id=str(uuid.uuid4()),
            tenantId=current_user.tenantId,
            datasetVersionId=version.id,
            resultS3Key="pending", 
            summaryJson=None
        )
        db.add(eda_result)
        db.commit()
        db.refresh(eda_result)
        eda_id = eda_result.id
    
    background_tasks.add_task(
        run_eda_analysis,
        eda_id,
        version.artifactS3Key
    )
    
    logger.info(f"EDA analysis queued for dataset {dataset_id}")
    
    return {
        "message": "EDA analysis started",
        "eda_id": eda_id,
        "status": "pending"
    }


async def run_eda_analysis(eda_id: str, file_path: str):
    from ..database import SessionLocal
    db = SessionLocal()
    
    try:
        eda_result = db.query(EDAResult).filter(EDAResult.id == eda_id).first()
        if not eda_result:
            return

        eda_result.resultS3Key = "running"
        db.commit()
        
        # NOTE: file_path here assumes local path. S3 handling needs S3 client.
        # For now, we simulate success or failure if file doesn't exist
        
        if not os.path.exists(file_path):
             # Just a fallback for demo
             pass

        processor = EDAProcessor(
            dataset_id=eda_result.datasetVersionId,
            file_path=file_path
        )
        results = processor.run_full_analysis()
        
        if 'error' in results:
            eda_result.summaryJson = {"error": results['error']}
            # Keep key as running or something else? "failed"
            # schema constraint: resultS3Key is string.
            eda_result.resultS3Key = "failed"
        else:
            eda_result.summaryJson = results # Store full result in summaryJson for now
            eda_result.resultS3Key = f"s3://results/{eda_result.id}.json" # Mock path
        
        db.commit()
        
    except Exception as e:
        logger.error(f"EDA analysis failed: {e}", exc_info=True)
        eda_result = db.query(EDAResult).filter(EDAResult.id == eda_id).first()
        if eda_result:
            eda_result.summaryJson = {"error": str(e)}
            eda_result.resultS3Key = "failed"
            db.commit()
    finally:
        db.close()


@router.get("/{dataset_id}/eda/status")
async def get_eda_status(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset or not dataset.activeVersionId:
        return {"status": "not_started"}

    eda_result = db.query(EDAResult).filter(
        EDAResult.datasetVersionId == dataset.activeVersionId
    ).first()
    
    if not eda_result:
        return {"status": "not_started"}
    
    status = determine_status(eda_result)
    error = eda_result.summaryJson.get("error") if eda_result.summaryJson else None
    
    return {
        "status": status,
        "eda_id": eda_result.id,
        "created_at": eda_result.createdAt,
        "error_message": error
    }

# Helper to get completed results
def get_completed_results(db: Session, dataset_id: str, user: User):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset or not dataset.activeVersionId:
        raise HTTPException(status_code=404, detail="Dataset not found")

    eda_result = db.query(EDAResult).filter(
        EDAResult.datasetVersionId == dataset.activeVersionId
    ).first()
    
    if not eda_result or determine_status(eda_result) != "completed":
        raise HTTPException(status_code=404, detail="EDA results not found")
        
    return eda_result.summaryJson

@router.get("/{dataset_id}/eda/overview")
async def get_eda_overview(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = get_completed_results(db, dataset_id, current_user)
    
    return {
        "dataset_id": dataset_id,
        "shape": results.get("shape"),
        "column_types": results.get("column_types"),
        "quality_score": results.get("quality", {}).get("quality_score"),
        "completeness": results.get("quality", {}).get("completeness"),
        "columns": [
            {
                "name": col,
                "type": results["column_types"].get(col),
                "missing": results["statistics"].get(col, {}).get("missing", 0),
                "unique": results["statistics"].get(col, {}).get("unique", 0)
            }
            for col in results.get("column_types", {}).keys()
        ]
    }

@router.get("/{dataset_id}/eda/distributions")
async def get_eda_distributions(
    dataset_id: str,
    column: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = get_completed_results(db, dataset_id, current_user)
    statistics = results.get("statistics", {})
    
    if column:
        if column not in statistics:
            raise HTTPException(status_code=404, detail="Column not found")
        return {
            "column": column,
            "type": results["column_types"].get(column),
            "statistics": statistics[column]
        }
    else:
        return {
            "distributions": {
                col: stats
                for col, stats in statistics.items()
                if results["column_types"].get(col) in ["numeric", "categorical"]
            }
        }

@router.get("/{dataset_id}/eda/correlations")
async def get_eda_correlations(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = get_completed_results(db, dataset_id, current_user)
    correlations = results.get("correlations", {})
    return correlations
