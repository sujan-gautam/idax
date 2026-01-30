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

    return correlations

@router.get("/{dataset_id}/eda/outliers")
async def get_eda_outliers(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = get_completed_results(db, dataset_id, current_user)
    return results.get("outliers", {})

@router.get("/{dataset_id}/eda/quality")
async def get_eda_quality(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = get_completed_results(db, dataset_id, current_user)
    return results.get("quality", {})

def get_local_path(s3_key: str) -> str:
    # Resolve relative to project root .local-storage
    # Current file: apps/api/src/routes/eda.py
    # Root: ../../../../.local-storage
    import sys
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.local-storage"))
    return os.path.join(base_dir, s3_key)

@router.get("/{dataset_id}/preview")
async def get_dataset_preview(
    dataset_id: str,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset or not dataset.activeVersionId:
        raise HTTPException(status_code=404, detail="Dataset not found or no active version")
    
    version = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.activeVersionId).first()
    if not version or not version.artifactS3Key:
        raise HTTPException(status_code=404, detail="Artifact not found")
        
    s3_key = version.artifactS3Key
    file_path = get_local_path(s3_key)
    
    if not os.path.exists(file_path):
        # Fallback: check if path is absolute or relative to where we are?
        # Maybe version.artifactS3Key IS absolute path from my uploads.py?
        if os.path.exists(s3_key):
            file_path = s3_key
        else:
             # Try simple local relative
             pass

    if not os.path.exists(file_path):
         raise HTTPException(status_code=404, detail=f"File not found on server: {file_path}")

    try:
        import pandas as pd
        import numpy as np
        
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path, nrows=limit)
        elif file_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path, nrows=limit)
        elif file_path.endswith('.parquet'):
             df = pd.read_parquet(file_path).head(limit)
        else:
             raise HTTPException(status_code=400, detail="Unsupported file format for preview")
             
        # Replacements for JSON safety
        df = df.replace({np.nan: None})
        
        return {
            "columns": [{"name": col, "type": str(df[col].dtype)} for col in df.columns],
            "rows": df.to_dict(orient='records')
        }
    except Exception as e:
        logger.error(f"Preview error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read preview: {str(e)}")

@router.get("/{dataset_id}/versions")
async def get_dataset_versions(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check access logic if needed (e.g. tenant check via join or relationship)
    # Simple check:
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.tenantId == current_user.tenantId
    ).first()
    
    if not dataset:
         raise HTTPException(status_code=404, detail="Dataset not found")

    versions = db.query(DatasetVersion)\
        .filter(DatasetVersion.datasetId == dataset_id)\
        .order_by(DatasetVersion.versionNumber.desc())\
        .all()
    return versions

@router.get("")
async def list_datasets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    datasets = db.query(Dataset)\
        .filter(Dataset.tenantId == current_user.tenantId)\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    # Enrich with version counts if possible, but basic list is fine for now
    return datasets

@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.tenantId == current_user.tenantId
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Cascade delete should be handled by DB foreign keys typically, 
    # but explicit cleanup is safer if cascade isn't set up perfectly or for S3 cleanup.
    
    # 1. Delete EDA Results
    # Find all versions
    versions = db.query(DatasetVersion).filter(DatasetVersion.datasetId == dataset.id).all()
    version_ids = [v.id for v in versions]
    
    db.query(EDAResult).filter(EDAResult.datasetVersionId.in_(version_ids)).delete(synchronize_session=False)
    
    # 2. Delete Versions
    db.query(DatasetVersion).filter(DatasetVersion.datasetId == dataset.id).delete(synchronize_session=False)
    
    # 3. Delete Dataset
    db.delete(dataset)
    
    db.commit()
    
    return {"message": "Dataset deleted successfully", "id": dataset_id}
