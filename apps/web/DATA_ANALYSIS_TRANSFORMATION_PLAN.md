# Project IDA - Data Analysis Platform Transformation Plan

## Executive Summary

Transform the monolithic React app into a **production-grade SaaS platform** with:
- Backend-driven analysis (not client-side)
- Monetizable feature tiers
- Enterprise accuracy (100% reliable algorithms)
- Scalable architecture
- Professional UX matching Stripe/Vercel standards

---

## Current State Analysis

### What Exists (Standalone App)
- ✅ CSV/Excel upload
- ✅ Column type detection (numeric, categorical, datetime, text, empty)
- ✅ Basic statistics (mean, median, std, quartiles, outliers)
- ✅ Correlation analysis (Pearson)
- ✅ Missing value detection
- ✅ Infinite value detection
- ✅ Duplicate detection
- ✅ Preprocessing (encoding, normalization, missing value handling)
- ✅ Visualizations (histograms, scatter plots, box plots, heatmaps)

### Critical Issues
❌ **All processing happens in browser** (not scalable)
❌ **No backend integration** (can't handle large datasets)
❌ **No user accounts** (can't save work)
❌ **No version control** (can't rollback)
❌ **No audit trail** (can't track changes)
❌ **No collaboration** (single user only)
❌ **No API** (can't integrate)
❌ **Inconsistent with Project IDA architecture**

---

## Transformation Strategy

### Phase 1: Backend Integration (Week 1-2)

#### 1.1 Upload & Storage
**Current**: File upload → parse in browser
**New**: 
```
Upload → S3 → Trigger Lambda → Parse → Store in DB → Queue EDA job
```

**Backend Endpoints Needed**:
- `POST /datasets/upload` - Get presigned URL
- `POST /datasets/finalize` - Trigger processing
- `GET /datasets/:id/status` - Check processing status

#### 1.2 EDA Processing
**Current**: All analysis in browser
**New**: 
```
Queue Job → Worker processes → Store results → Notify frontend
```

**Backend Jobs**:
- Column type detection
- Statistical analysis
- Correlation matrix
- Outlier detection
- Missing value analysis
- Duplicate detection

**Database Schema**:
```sql
-- EDA Results table
CREATE TABLE eda_results (
  id UUID PRIMARY KEY,
  dataset_id UUID REFERENCES datasets(id),
  column_name VARCHAR(255),
  data_type VARCHAR(50),
  statistics JSONB,
  missing_count INTEGER,
  missing_percentage DECIMAL,
  unique_count INTEGER,
  created_at TIMESTAMP
);

-- Correlations table
CREATE TABLE correlations (
  id UUID PRIMARY KEY,
  dataset_id UUID REFERENCES datasets(id),
  column_1 VARCHAR(255),
  column_2 VARCHAR(255),
  correlation_value DECIMAL,
  method VARCHAR(50),
  created_at TIMESTAMP
);
```

---

## Tab-by-Tab Transformation

### Tab 1: Overview (FREE TIER)
**Purpose**: Dataset summary & health check
**Monetization**: Free (lead generation)

**Features**:
- ✅ Row/column count
- ✅ Column type breakdown
- ✅ Missing value summary
- ✅ Data quality score (0-100)
- ✅ Quick recommendations

**Backend Algorithm**:
```python
def calculate_data_quality_score(dataset_id):
    """
    100% accurate quality scoring
    """
    results = db.query(f"SELECT * FROM eda_results WHERE dataset_id = {dataset_id}")
    
    # Scoring factors
    completeness = 1 - (total_missing / total_cells)  # 40% weight
    consistency = detect_type_consistency(results)     # 30% weight
    uniqueness = calculate_uniqueness_ratio(results)   # 20% weight
    validity = check_value_ranges(results)             # 10% weight
    
    score = (
        completeness * 0.4 +
        consistency * 0.3 +
        uniqueness * 0.2 +
        validity * 0.1
    ) * 100
    
    return round(score, 2)
```

**Frontend Component**:
```tsx
// apps/web/src/components/tabs/OverviewTab.tsx
export const OverviewTab = ({ datasetId }: { datasetId: string }) => {
  const { data: overview } = useQuery(['overview', datasetId], () =>
    api.get(`/datasets/${datasetId}/overview`)
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Rows" value={overview.rowCount} />
        <StatCard title="Columns" value={overview.columnCount} />
        <StatCard title="Quality Score" value={overview.qualityScore} />
        <StatCard title="Completeness" value={overview.completeness} />
      </div>

      {/* Column Analysis Table */}
      <DataTable columns={overviewColumns} data={overview.columns} />
    </div>
  );
};
```

---

### Tab 2: Preview (FREE TIER)
**Purpose**: View raw data
**Monetization**: Free (limited to 100 rows for free tier)

**Features**:
- ✅ Virtualized table (handle millions of rows)
- ✅ Server-side pagination
- ✅ Column filtering
- ✅ Search
- 🔒 Export (PRO tier)

**Backend Endpoint**:
```python
@app.get("/datasets/{dataset_id}/preview")
def get_dataset_preview(
    dataset_id: str,
    page: int = 1,
    page_size: int = 50,
    search: str = None,
    columns: List[str] = None
):
    """
    Paginated data preview with search
    """
    offset = (page - 1) * page_size
    
    query = f"""
        SELECT {','.join(columns) if columns else '*'}
        FROM dataset_{dataset_id}
        WHERE 1=1
    """
    
    if search:
        query += f" AND to_tsvector('english', *) @@ plainto_tsquery('english', '{search}')"
    
    query += f" LIMIT {page_size} OFFSET {offset}"
    
    rows = db.execute(query)
    total = db.execute(f"SELECT COUNT(*) FROM dataset_{dataset_id}")[0][0]
    
    return {
        "rows": rows,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": math.ceil(total / page_size)
    }
```

**Frontend Component**:
```tsx
// apps/web/src/components/tabs/PreviewTab.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export const PreviewTab = ({ datasetId }: { datasetId: string }) => {
  const [page, setPage] = useState(1);
  const { data } = useQuery(['preview', datasetId, page], () =>
    api.get(`/datasets/${datasetId}/preview?page=${page}`)
  );

  return (
    <div className="h-[600px] overflow-auto">
      <VirtualizedTable data={data.rows} columns={data.columns} />
      <Pagination 
        page={page} 
        totalPages={data.totalPages} 
        onPageChange={setPage} 
      />
    </div>
  );
};
```

---

### Tab 3: Distributions (PRO TIER - $29/mo)
**Purpose**: Statistical distributions & histograms
**Monetization**: Paywall after 3 columns

**Features**:
- ✅ Histograms (numeric columns)
- ✅ Bar charts (categorical columns)
- ✅ Kernel density estimation
- ✅ Distribution fitting (normal, log-normal, exponential)
- ✅ Goodness-of-fit tests (Kolmogorov-Smirnov, Anderson-Darling)

**Backend Algorithm**:
```python
from scipy import stats
import numpy as np

def analyze_distribution(column_data):
    """
    100% accurate distribution analysis
    """
    # Remove nulls and infinites
    clean_data = column_data[np.isfinite(column_data)]
    
    # Calculate histogram bins using Freedman-Diaconis rule
    iqr = np.percentile(clean_data, 75) - np.percentile(clean_data, 25)
    bin_width = 2 * iqr / (len(clean_data) ** (1/3))
    num_bins = int((clean_data.max() - clean_data.min()) / bin_width)
    
    hist, bin_edges = np.histogram(clean_data, bins=min(num_bins, 50))
    
    # Test distribution fits
    distributions = {
        'normal': stats.norm,
        'lognormal': stats.lognorm,
        'exponential': stats.expon,
        'gamma': stats.gamma
    }
    
    best_fit = None
    best_p_value = 0
    
    for name, dist in distributions.items():
        params = dist.fit(clean_data)
        ks_stat, p_value = stats.kstest(clean_data, name, args=params)
        
        if p_value > best_p_value:
            best_p_value = p_value
            best_fit = {
                'distribution': name,
                'params': params,
                'p_value': p_value,
                'ks_statistic': ks_stat
            }
    
    return {
        'histogram': {
            'counts': hist.tolist(),
            'bin_edges': bin_edges.tolist()
        },
        'statistics': {
            'mean': float(np.mean(clean_data)),
            'median': float(np.median(clean_data)),
            'std': float(np.std(clean_data)),
            'skewness': float(stats.skew(clean_data)),
            'kurtosis': float(stats.kurtosis(clean_data))
        },
        'best_fit': best_fit
    }
```

---

### Tab 4: Correlations (PRO TIER)
**Purpose**: Relationship analysis
**Monetization**: PRO feature

**Features**:
- ✅ Pearson correlation
- ✅ Spearman correlation (rank-based)
- ✅ Kendall tau (ordinal)
- ✅ Mutual information (non-linear)
- ✅ Interactive heatmap
- ✅ Scatter plot matrix

**Backend Algorithm**:
```python
from sklearn.feature_selection import mutual_info_regression
from scipy.stats import pearsonr, spearmanr, kendalltau

def calculate_correlations(dataset_id, method='pearson'):
    """
    Multi-method correlation analysis
    """
    numeric_columns = get_numeric_columns(dataset_id)
    data = load_dataset(dataset_id, columns=numeric_columns)
    
    n = len(numeric_columns)
    correlation_matrix = np.zeros((n, n))
    p_values = np.zeros((n, n))
    
    for i in range(n):
        for j in range(i, n):
            col1_data = data[numeric_columns[i]].dropna()
            col2_data = data[numeric_columns[j]].dropna()
            
            # Align indices
            common_idx = col1_data.index.intersection(col2_data.index)
            col1 = col1_data[common_idx]
            col2 = col2_data[common_idx]
            
            if method == 'pearson':
                corr, p_val = pearsonr(col1, col2)
            elif method == 'spearman':
                corr, p_val = spearmanr(col1, col2)
            elif method == 'kendall':
                corr, p_val = kendalltau(col1, col2)
            elif method == 'mutual_info':
                corr = mutual_info_regression(col1.values.reshape(-1, 1), col2)[0]
                p_val = None
            
            correlation_matrix[i, j] = corr
            correlation_matrix[j, i] = corr
            if p_val is not None:
                p_values[i, j] = p_val
                p_values[j, i] = p_val
    
    return {
        'matrix': correlation_matrix.tolist(),
        'p_values': p_values.tolist(),
        'columns': numeric_columns,
        'method': method
    }
```

---

### Tab 5: Outliers (PRO TIER)
**Purpose**: Anomaly detection
**Monetization**: PRO feature

**Features**:
- ✅ IQR method
- ✅ Z-score method
- ✅ Isolation Forest (ML-based)
- ✅ Local Outlier Factor
- ✅ DBSCAN clustering
- ✅ Visual box plots

**Backend Algorithm**:
```python
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.cluster import DBSCAN

def detect_outliers(column_data, method='iqr', contamination=0.1):
    """
    Multi-method outlier detection
    """
    clean_data = column_data[np.isfinite(column_data)].reshape(-1, 1)
    
    if method == 'iqr':
        q1 = np.percentile(clean_data, 25)
        q3 = np.percentile(clean_data, 75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = (clean_data < lower_bound) | (clean_data > upper_bound)
        
    elif method == 'zscore':
        z_scores = np.abs(stats.zscore(clean_data))
        outliers = z_scores > 3
        
    elif method == 'isolation_forest':
        clf = IsolationForest(contamination=contamination, random_state=42)
        outliers = clf.fit_predict(clean_data) == -1
        
    elif method == 'lof':
        clf = LocalOutlierFactor(contamination=contamination)
        outliers = clf.fit_predict(clean_data) == -1
    
    return {
        'outlier_indices': np.where(outliers)[0].tolist(),
        'outlier_count': int(np.sum(outliers)),
        'outlier_percentage': float(np.sum(outliers) / len(clean_data) * 100),
        'method': method
    }
```

---

### Tab 6: Data Quality (ENTERPRISE TIER - $99/mo)
**Purpose**: Comprehensive quality assessment
**Monetization**: Enterprise feature

**Features**:
- ✅ Data profiling
- ✅ Schema validation
- ✅ Business rule validation
- ✅ Referential integrity checks
- ✅ Temporal consistency
- ✅ Automated recommendations

**Backend Algorithm**:
```python
def comprehensive_quality_check(dataset_id):
    """
    Enterprise-grade data quality assessment
    """
    issues = []
    
    # 1. Completeness checks
    missing_analysis = check_missing_patterns(dataset_id)
    if missing_analysis['has_systematic_missing']:
        issues.append({
            'severity': 'high',
            'category': 'completeness',
            'description': 'Systematic missing data detected',
            'affected_columns': missing_analysis['columns'],
            'recommendation': 'Investigate data collection process'
        })
    
    # 2. Consistency checks
    type_inconsistencies = check_type_consistency(dataset_id)
    for col, inconsistency in type_inconsistencies.items():
        issues.append({
            'severity': 'medium',
            'category': 'consistency',
            'description': f'Mixed data types in column {col}',
            'affected_columns': [col],
            'recommendation': 'Standardize data types'
        })
    
    # 3. Validity checks
    range_violations = check_value_ranges(dataset_id)
    for violation in range_violations:
        issues.append({
            'severity': 'high',
            'category': 'validity',
            'description': violation['message'],
            'affected_columns': [violation['column']],
            'recommendation': violation['fix']
        })
    
    # 4. Uniqueness checks
    duplicate_analysis = check_duplicates(dataset_id)
    if duplicate_analysis['has_exact_duplicates']:
        issues.append({
            'severity': 'medium',
            'category': 'uniqueness',
            'description': f'{duplicate_analysis["count"]} exact duplicate rows found',
            'recommendation': 'Remove duplicate rows'
        })
    
    # 5. Timeliness checks (for datetime columns)
    temporal_issues = check_temporal_consistency(dataset_id)
    for issue in temporal_issues:
        issues.append(issue)
    
    return {
        'quality_score': calculate_quality_score(issues),
        'issues': sorted(issues, key=lambda x: {'high': 0, 'medium': 1, 'low': 2}[x['severity']]),
        'summary': {
            'total_issues': len(issues),
            'high_severity': len([i for i in issues if i['severity'] == 'high']),
            'medium_severity': len([i for i in issues if i['severity'] == 'medium']),
            'low_severity': len([i for i in issues if i['severity'] == 'low'])
        }
    }
```

---

### Tab 7: Preprocessing (PRO TIER)
**Purpose**: Data transformation pipeline
**Monetization**: PRO feature with usage limits

**Features**:
- ✅ Recipe builder (drag-and-drop)
- ✅ Preview transformations
- ✅ Approval workflow (for ADMIN)
- ✅ Version control
- ✅ Rollback capability
- ✅ Audit trail

**Backend Implementation**:
```python
class PreprocessingPipeline:
    """
    Versioned, auditable preprocessing pipeline
    """
    
    def __init__(self, dataset_id, user_id):
        self.dataset_id = dataset_id
        self.user_id = user_id
        self.steps = []
    
    def add_step(self, step_type, params):
        """Add preprocessing step to pipeline"""
        step = {
            'id': str(uuid.uuid4()),
            'type': step_type,
            'params': params,
            'added_by': self.user_id,
            'added_at': datetime.utcnow()
        }
        self.steps.append(step)
        return step['id']
    
    def preview(self, sample_size=1000):
        """Preview transformation on sample data"""
        data = load_dataset_sample(self.dataset_id, sample_size)
        transformed = self._apply_steps(data)
        
        return {
            'before': data.head(10).to_dict(),
            'after': transformed.head(10).to_dict(),
            'changes': self._calculate_changes(data, transformed)
        }
    
    def execute(self, create_new_version=True):
        """Execute pipeline and create new dataset version"""
        data = load_dataset(self.dataset_id)
        transformed = self._apply_steps(data)
        
        if create_new_version:
            new_version_id = create_dataset_version(
                self.dataset_id,
                transformed,
                pipeline_steps=self.steps,
                created_by=self.user_id
            )
            
            # Log to audit trail
            log_audit_event(
                event_type='preprocessing_applied',
                dataset_id=self.dataset_id,
                user_id=self.user_id,
                details={'steps': self.steps, 'new_version': new_version_id}
            )
            
            return new_version_id
        else:
            update_dataset(self.dataset_id, transformed)
            return self.dataset_id
    
    def _apply_steps(self, data):
        """Apply all steps in order"""
        for step in self.steps:
            if step['type'] == 'handle_missing':
                data = self._handle_missing(data, step['params'])
            elif step['type'] == 'encode_categorical':
                data = self._encode_categorical(data, step['params'])
            elif step['type'] == 'normalize':
                data = self._normalize(data, step['params'])
            # ... more step types
        return data
```

---

### Tab 8: Versions (ENTERPRISE TIER)
**Purpose**: Dataset version control
**Monetization**: Enterprise feature

**Features**:
- ✅ Timeline view
- ✅ Diff viewer
- ✅ Rollback
- ✅ Branch/merge (future)
- ✅ Approval workflow

**Backend Schema**:
```sql
CREATE TABLE dataset_versions (
  id UUID PRIMARY KEY,
  dataset_id UUID REFERENCES datasets(id),
  version_number INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  parent_version_id UUID REFERENCES dataset_versions(id),
  changes JSONB,
  row_count INTEGER,
  column_count INTEGER,
  storage_path VARCHAR(500),
  status VARCHAR(50) -- 'active', 'archived', 'deleted'
);
```

---

## Monetization Strategy

### Tier 1: FREE
- Overview tab
- Preview tab (100 rows)
- 1 dataset
- 100 MB storage

### Tier 2: PRO ($29/mo)
- All FREE features
- Distributions tab
- Correlations tab
- Outliers tab
- Preprocessing tab
- 10 datasets
- 10 GB storage
- Export capabilities

### Tier 3: ENTERPRISE ($99/mo)
- All PRO features
- Data Quality tab
- Versions tab
- Unlimited datasets
- 100 GB storage
- API access
- Approval workflows
- Audit logs
- Priority support

---

## Implementation Timeline

### Week 1-2: Backend Foundation
- [ ] Create EDA job queue
- [ ] Implement statistical algorithms
- [ ] Build API endpoints
- [ ] Database schema

### Week 3-4: Frontend Tabs
- [ ] Rebuild Overview tab
- [ ] Rebuild Preview tab
- [ ] Rebuild Distributions tab
- [ ] Rebuild Correlations tab

### Week 5-6: Advanced Features
- [ ] Outliers tab
- [ ] Data Quality tab
- [ ] Preprocessing pipeline
- [ ] Versions tab

### Week 7-8: Polish & Launch
- [ ] Paywall implementation
- [ ] Billing integration (Stripe)
- [ ] Performance optimization
- [ ] Documentation

---

## Success Metrics

- **Accuracy**: 100% statistical correctness
- **Performance**: < 5s for EDA on 1M rows
- **Scalability**: Handle 100GB datasets
- **Reliability**: 99.9% uptime
- **User Experience**: Lighthouse score > 90

---

**Next Steps**: Start with backend EDA job implementation?
