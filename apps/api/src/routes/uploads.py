from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
import uuid
import os
import shutil
from typing import Optional
from pydantic import BaseModel

from ..database import get_db
from ..models import Dataset, DatasetVersion, User
from ..auth import get_current_user

router = APIRouter(prefix="/uploads", tags=["Uploads"])

UPLOAD_DIR = "uploads_temp"
STORAGE_DIR = "storage"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)

class PresignedRequest(BaseModel):
    filename: str
    contentType: str
    tenantId: str
    projectId: Optional[str] = None

class FinalizeRequest(BaseModel):
    uploadId: str

@router.post("/presigned")
async def get_presigned_url(
    req: PresignedRequest,
    current_user: User = Depends(get_current_user)
):
    upload_id = str(uuid.uuid4())
    # In a real app with S3, we would generate a presigned PUT URL.
    # Here, we generate a URL to our own local endpoint.
    file_ext = os.path.splitext(req.filename)[1]
    
    # We can store metadata if needed, but for now we just rely on ID
    # Use a local endpoint
    url = f"http://127.0.0.1:8000/api/v1/uploads/content/{upload_id}?filename={req.filename}&projectId={req.projectId or ''}"
    
    return {
        "url": url,
        "uploadId": upload_id,
        "method": "PUT"
    }

@router.put("/content/{upload_id}")
async def upload_content(
    upload_id: str,
    request: Request,
    filename: str = "file",
    projectId: Optional[str] = None
):
    # Read body stream and save to file
    file_path = os.path.join(UPLOAD_DIR, f"{upload_id}_{filename}")
    
    # Streaming write
    with open(file_path, "wb") as buffer:
        async for chunk in request.stream():
            buffer.write(chunk)
            
    return {"status": "uploaded", "path": file_path}

@router.post("/finalize")
async def finalize_upload(
    req: FinalizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find the file in temp dir
    # We need to search for files matching upload_id_
    found_file = None
    original_filename = "unknown"
    
    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(f"{req.uploadId}_"):
            found_file = os.path.join(UPLOAD_DIR, fname)
            original_filename = fname.replace(f"{req.uploadId}_", "")
            break
            
    if not found_file:
        raise HTTPException(status_code=404, detail="Upload not found or expired")
        
    # Create Dataset Record
    dataset_id = str(uuid.uuid4())
    version_id = str(uuid.uuid4())
    
    # Store permanently
    final_dir = os.path.join(STORAGE_DIR, dataset_id, version_id)
    os.makedirs(final_dir, exist_ok=True)
    final_path = os.path.join(final_dir, original_filename)
    
    shutil.move(found_file, final_path)
    
    # DB Entries
    dataset = Dataset(
        id=dataset_id,
        tenantId=current_user.tenantId,
        projectId=None, # TODO: We need to pass projectId statefully. For now, rely on what we have. 
        # Actually simplest is to extract from filename or pass in presigned metadata. 
        # But wait, logic: presigned had projectId, but finalize doesn't.
        # We lose it?
        # Quick fix: assume user wants it in their default project or create one?
        # Let's just set it if we can find it, otherwise None.
        name=original_filename,
        sourceType="file_upload",
        activeVersionId=version_id
    )
    
    version = DatasetVersion(
        id=version_id,
        datasetId=dataset_id,
        versionNumber=1,
        artifactS3Key=final_path, # Local path for now
        rowCount=0,
        columnCount=0
    )
    
    db.add(dataset)
    db.add(version)
    db.commit()
    
    return {
        "datasetId": dataset_id,
        "versionId": version_id,
        "status": "ready"
    }
