from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid
from datetime import datetime
from .database import Base

class Tenant(Base):
    __tablename__ = "Tenant"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    plan = Column(String, default="FREE")
    status = Column(String, default="ACTIVE")
    createdAt = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "User"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    role = Column(String, default="MEMBER")
    status = Column(String, default="ACTIVE")
    tenantId = Column(String, ForeignKey("Tenant.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    tenant = relationship("Tenant")

class Project(Base):
    __tablename__ = "Project"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenantId = Column(String, ForeignKey("Tenant.id"))
    name = Column(String)
    description = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    tenant = relationship("Tenant")

class Dataset(Base):
    __tablename__ = "Dataset"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenantId = Column(String, ForeignKey("Tenant.id"))
    projectId = Column(String) 
    name = Column(String)
    sourceType = Column(String)
    activeVersionId = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    tenant = relationship("Tenant")
    versions = relationship("DatasetVersion", back_populates="dataset")

class DatasetVersion(Base):
    __tablename__ = "DatasetVersion"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    datasetId = Column(String, ForeignKey("Dataset.id"))
    versionNumber = Column(Integer)
    artifactS3Key = Column(String)
    schemaJson = Column(JSONB, nullable=True)
    statsSummaryJson = Column(JSONB, nullable=True)
    rowCount = Column(Integer, nullable=True)
    columnCount = Column(Integer, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    dataset = relationship("Dataset", back_populates="versions")
    eda_results = relationship("EDAResult", back_populates="dataset_version")

class EDAResult(Base):
    __tablename__ = "EDAResult"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenantId = Column(String, ForeignKey("Tenant.id"))
    datasetVersionId = Column(String, ForeignKey("DatasetVersion.id"))
    resultS3Key = Column(String)
    summaryJson = Column(JSONB, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    dataset_version = relationship("DatasetVersion", back_populates="eda_results")
