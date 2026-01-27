# URGENT: Backend EDA Integration Required

## ❌ CURRENT PROBLEM

The frontend tabs are calling backend API endpoints that **don't exist yet**:
- `GET /datasets/{id}/eda/status` → 404
- `POST /datasets/{id}/analyze` → 404  
- `GET /datasets/{id}/eda/overview` → 404
- `GET /datasets/{id}/eda/distributions` → 404
- `GET /datasets/{id}/eda/correlations` → 404

**Result**: All tabs show "no information"

---

## ✅ SOLUTION: Integrate Backend EDA

### Step 1: Install Python Dependencies

```bash
cd apps/api
pip install scipy scikit-learn pandas numpy
```

---

### Step 2: Add EDA Routes to FastAPI

In `apps/api/src/main.py`, add:

```python
from .routes import eda

app.include_router(eda.router)
```

---

### Step 3: Create Database Models

Add to `apps/api/src/models.py`:

```python
from sqlalchemy import Column, String, DateTime, JSON, Enum
from sqlalchemy.dialects.postgresql import JSONB
import enum

class EDAStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class EDAResult(Base):
    __tablename__ = "eda_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    status = Column(Enum(EDAStatus), default=EDAStatus.PENDING)
    results = Column(JSONB)  # Store full EDA results as JSON
    error_message = Column(String)
    triggered_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    dataset = relationship("Dataset", back_populates="eda_results")
```

---

### Step 4: Run Database Migration

```bash
cd packages/db
npx prisma migrate dev --name add_eda_results
```

---

### Step 5: Test Backend

```bash
# Start backend
cd apps/api
uvicorn src.main:app --reload --port 8000

# Test in another terminal
curl http://localhost:8000/health
```

---

## 🔧 QUICK FIX (Temporary)

If you want to see the tabs working **immediately** without backend:

### Option 1: Mock Data in Frontend

Update `OverviewTab.tsx`:

```tsx
// Add mock data for testing
const MOCK_OVERVIEW = {
  dataset_id: "test",
  shape: { rows: 1000, columns: 10 },
  quality_score: 85.5,
  completeness: 92.3,
  columns: [
    { name: "age", type: "numeric", missing: 5, unique: 50 },
    { name: "name", type: "text", missing: 0, unique: 1000 },
    { name: "category", type: "categorical", missing: 10, unique: 5 },
  ]
};

// In the component
const { data: overview } = useQuery(
  ['eda-overview', datasetId],
  async () => {
    try {
      const response = await api.get(`/datasets/${datasetId}/eda/overview`);
      return response.data;
    } catch (error) {
      // Return mock data if API fails
      console.warn('Using mock data');
      return MOCK_OVERVIEW;
    }
  }
);
```

---

### Option 2: Use JSON Server (Quick Mock Backend)

```bash
# Install json-server
npm install -g json-server

# Create db.json
cat > db.json << 'EOF'
{
  "eda-status": {
    "status": "completed"
  },
  "eda-overview": {
    "dataset_id": "test",
    "shape": { "rows": 1000, "columns": 10 },
    "quality_score": 85.5,
    "completeness": 92.3,
    "columns": [
      { "name": "age", "type": "numeric", "missing": 5, "unique": 50 },
      { "name": "name", "type": "text", "missing": 0, "unique": 1000 }
    ]
  }
}
EOF

# Run mock server
json-server --watch db.json --port 8000
```

---

## 🎯 RECOMMENDED APPROACH

**For Production**: Integrate the real backend (Steps 1-5 above)

**For Demo/Testing**: Use mock data (Option 1)

---

## 📋 BACKEND INTEGRATION CHECKLIST

- [ ] Install Python dependencies (scipy, sklearn, pandas)
- [ ] Add EDA routes to FastAPI (`app.include_router(eda.router)`)
- [ ] Create `EDAResult` database model
- [ ] Run Prisma migration
- [ ] Test `/datasets/{id}/analyze` endpoint
- [ ] Test `/datasets/{id}/eda/status` endpoint
- [ ] Test `/datasets/{id}/eda/overview` endpoint
- [ ] Verify frontend tabs load data

---

## 🚨 CRITICAL FILES NEEDED

These files I created need to be in your backend:

1. `apps/api/src/jobs/eda_processor.py` ✅ Created
2. `apps/api/src/routes/eda.py` ✅ Created
3. `apps/api/src/models.py` ❌ Need to add EDAResult model
4. `apps/api/src/main.py` ❌ Need to include router

---

## 🔍 DEBUGGING

If tabs still show no data after backend integration:

1. **Check browser console** for API errors
2. **Check backend logs** for Python errors
3. **Verify CORS** is configured correctly
4. **Test API directly** with curl:
   ```bash
   curl http://localhost:8000/datasets/test-id/eda/status
   ```

---

**Status**: Frontend ✅ Ready | Backend ❌ Not Integrated
**Action Required**: Integrate backend EDA system OR use mock data
**Estimated Time**: 30 minutes (backend) OR 5 minutes (mock)
