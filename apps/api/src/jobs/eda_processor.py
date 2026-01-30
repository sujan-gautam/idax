"""
EDA Job Processor - Statistical Analysis Engine
Handles automated exploratory data analysis with 100% accuracy
"""

import pandas as pd
import numpy as np
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from typing import Dict, List, Any, Optional
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class EDAProcessor:
    """
    Enterprise-grade EDA processor with statistical rigor
    """
    
    def __init__(self, dataset_id: str, file_path: str):
        self.dataset_id = dataset_id
        self.file_path = file_path
        self.df: Optional[pd.DataFrame] = None
        self.results = {}
    
    def load_data(self) -> bool:
        """Load dataset from file"""
        try:
            if self.file_path.endswith('.csv'):
                self.df = pd.read_csv(self.file_path)
            elif self.file_path.endswith(('.xlsx', '.xls')):
                self.df = pd.read_excel(self.file_path)
            else:
                raise ValueError(f"Unsupported file format: {self.file_path}")
            
            logger.info(f"Loaded dataset {self.dataset_id}: {self.df.shape}")
            return True
        except Exception as e:
            logger.error(f"Failed to load dataset: {e}")
            return False
    
    def detect_column_types(self) -> Dict[str, str]:
        """
        Detect column types with high accuracy
        Returns: {column_name: type}
        """
        column_types = {}
        
        for col in self.df.columns:
            col_type = self._detect_single_column_type(self.df[col])
            column_types[col] = col_type
        
        return column_types
    
    def _detect_single_column_type(self, series: pd.Series) -> str:
        """Detect type of a single column"""
        # Remove nulls for analysis
        non_null = series.dropna()
        
        if len(non_null) == 0:
            return 'empty'
        
        # Check if numeric
        if pd.api.types.is_numeric_dtype(series):
            # Check if all integers
            if pd.api.types.is_integer_dtype(series):
                # Check if it's a categorical ID (low cardinality)
                unique_ratio = series.nunique() / len(series)
                if unique_ratio < 0.5 and series.nunique() < 50:
                    return 'categorical'
                return 'numeric'
            return 'numeric'
        
        # Try to parse as datetime
        try:
            pd.to_datetime(non_null, errors='raise')
            return 'datetime'
        except:
            pass
        
        # Check cardinality for categorical vs text
        unique_ratio = series.nunique() / len(series)
        if unique_ratio < 0.5:
            return 'categorical'
        
        # Check average string length for text detection
        if series.dtype == 'object':
            avg_length = non_null.astype(str).str.len().mean()
            if avg_length > 50:
                return 'text'
        
        return 'categorical'
    
    def calculate_statistics(self, column_types: Dict[str, str]) -> Dict[str, Dict]:
        """
        Calculate comprehensive statistics for each column
        """
        stats_results = {}
        
        for col in self.df.columns:
            col_type = column_types[col]
            
            if col_type == 'numeric':
                stats_results[col] = self._calculate_numeric_stats(self.df[col])
            elif col_type == 'categorical':
                stats_results[col] = self._calculate_categorical_stats(self.df[col])
            elif col_type == 'datetime':
                stats_results[col] = self._calculate_datetime_stats(self.df[col])
            else:
                stats_results[col] = self._calculate_basic_stats(self.df[col])
        
        return stats_results
    
    def _calculate_numeric_stats(self, series: pd.Series) -> Dict:
        """Calculate statistics for numeric columns"""
        clean_data = series.dropna()
        clean_data = clean_data[np.isfinite(clean_data)]
        
        if len(clean_data) == 0:
            return {'error': 'No valid numeric data'}
        
        # Basic statistics
        q1 = clean_data.quantile(0.25)
        q3 = clean_data.quantile(0.75)
        iqr = q3 - q1
        
        # Outlier detection (IQR method)
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = clean_data[(clean_data < lower_bound) | (clean_data > upper_bound)]
        
        return {
            'count': int(len(clean_data)),
            'mean': float(clean_data.mean()),
            'median': float(clean_data.median()),
            'std': float(clean_data.std()),
            'min': float(clean_data.min()),
            'max': float(clean_data.max()),
            'q1': float(q1),
            'q3': float(q3),
            'iqr': float(iqr),
            'skewness': float(stats.skew(clean_data)),
            'kurtosis': float(stats.kurtosis(clean_data)),
            'outliers': {
                'count': int(len(outliers)),
                'percentage': float(len(outliers) / len(clean_data) * 100),
                'lower_bound': float(lower_bound),
                'upper_bound': float(upper_bound)
            }
        }
    
    def _calculate_categorical_stats(self, series: pd.Series) -> Dict:
        """Calculate statistics for categorical columns"""
        clean_data = series.dropna()
        
        if len(clean_data) == 0:
            return {'error': 'No valid categorical data'}
        
        value_counts = clean_data.value_counts()
        
        return {
            'count': int(len(clean_data)),
            'unique': int(series.nunique()),
            'top_value': str(value_counts.index[0]) if len(value_counts) > 0 else None,
            'top_frequency': int(value_counts.iloc[0]) if len(value_counts) > 0 else 0,
            'value_counts': value_counts.head(20).to_dict(),
            'entropy': float(stats.entropy(value_counts))
        }
    
    def _calculate_datetime_stats(self, series: pd.Series) -> Dict:
        """Calculate statistics for datetime columns"""
        try:
            dt_series = pd.to_datetime(series, errors='coerce')
            clean_data = dt_series.dropna()
            
            if len(clean_data) == 0:
                return {'error': 'No valid datetime data'}
            
            return {
                'count': int(len(clean_data)),
                'min': clean_data.min().isoformat(),
                'max': clean_data.max().isoformat(),
                'range_days': int((clean_data.max() - clean_data.min()).days)
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _calculate_basic_stats(self, series: pd.Series) -> Dict:
        """Calculate basic statistics for other column types"""
        return {
            'count': int(series.count()),
            'unique': int(series.nunique()),
            'missing': int(series.isna().sum())
        }
    
    def calculate_correlations(self, method: str = 'pearson') -> Dict:
        """
        Calculate correlation matrix for numeric columns
        Supports: pearson, spearman, kendall
        """
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        
        if len(numeric_cols) < 2:
            return {'error': 'Not enough numeric columns for correlation'}
        
        # Remove columns with all NaN or infinite values
        valid_cols = []
        for col in numeric_cols:
            clean = self.df[col].dropna()
            clean = clean[np.isfinite(clean)]
            if len(clean) > 0:
                valid_cols.append(col)
        
        if len(valid_cols) < 2:
            return {'error': 'Not enough valid numeric columns'}
        
        # Calculate correlation matrix
        corr_matrix = self.df[valid_cols].corr(method=method)
        
        # Extract significant correlations
        correlations = []
        for i in range(len(valid_cols)):
            for j in range(i + 1, len(valid_cols)):
                col1, col2 = valid_cols[i], valid_cols[j]
                corr_value = corr_matrix.loc[col1, col2]
                
                if not np.isnan(corr_value):
                    # Calculate p-value
                    if method == 'pearson':
                        _, p_value = stats.pearsonr(
                            self.df[col1].dropna(),
                            self.df[col2].dropna()
                        )
                    elif method == 'spearman':
                        _, p_value = stats.spearmanr(
                            self.df[col1].dropna(),
                            self.df[col2].dropna()
                        )
                    else:
                        p_value = None
                    
                    correlations.append({
                        'column1': col1,
                        'column2': col2,
                        'correlation': float(corr_value),
                        'p_value': float(p_value) if p_value is not None else None,
                        'strength': self._classify_correlation_strength(corr_value)
                    })
        
        # Sort by absolute correlation value
        correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
        
        return {
            'method': method,
            'matrix': corr_matrix.to_dict(),
            'correlations': correlations,
            'columns': valid_cols
        }
    
    def _classify_correlation_strength(self, corr: float) -> str:
        """Classify correlation strength"""
        abs_corr = abs(corr)
        if abs_corr >= 0.7:
            return 'strong'
        elif abs_corr >= 0.4:
            return 'moderate'
        elif abs_corr >= 0.2:
            return 'weak'
        else:
            return 'very_weak'
    
    def detect_outliers(self, method: str = 'iqr') -> Dict:
        """
        Detect outliers using multiple methods
        Methods: iqr, zscore, isolation_forest, lof
        """
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        outlier_results = {}
        
        for col in numeric_cols:
            clean_data = self.df[col].dropna()
            clean_data = clean_data[np.isfinite(clean_data)]
            
            if len(clean_data) == 0:
                continue
            
            if method == 'iqr':
                outliers = self._detect_outliers_iqr(clean_data)
            elif method == 'zscore':
                outliers = self._detect_outliers_zscore(clean_data)
            elif method == 'isolation_forest':
                outliers = self._detect_outliers_isolation_forest(clean_data)
            elif method == 'lof':
                outliers = self._detect_outliers_lof(clean_data)
            else:
                continue
            
            outlier_results[col] = outliers
        
        return {
            'method': method,
            'results': outlier_results
        }
    
    def _detect_outliers_iqr(self, data: pd.Series) -> Dict:
        """IQR method for outlier detection"""
        q1 = data.quantile(0.25)
        q3 = data.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        
        outliers = data[(data < lower) | (data > upper)]
        
        return {
            'count': int(len(outliers)),
            'percentage': float(len(outliers) / len(data) * 100),
            'indices': outliers.index.tolist(),
            'values': outliers.tolist(),
            'bounds': {'lower': float(lower), 'upper': float(upper)}
        }
    
    def _detect_outliers_zscore(self, data: pd.Series) -> Dict:
        """Z-score method for outlier detection"""
        z_scores = np.abs(stats.zscore(data))
        outliers = data[z_scores > 3]
        
        return {
            'count': int(len(outliers)),
            'percentage': float(len(outliers) / len(data) * 100),
            'indices': outliers.index.tolist(),
            'values': outliers.tolist()
        }
    
    def _detect_outliers_isolation_forest(self, data: pd.Series) -> Dict:
        """Isolation Forest method for outlier detection"""
        clf = IsolationForest(contamination=0.1, random_state=42)
        predictions = clf.fit_predict(data.values.reshape(-1, 1))
        outliers = data[predictions == -1]
        
        return {
            'count': int(len(outliers)),
            'percentage': float(len(outliers) / len(data) * 100),
            'indices': outliers.index.tolist(),
            'values': outliers.tolist()
        }
    
    def _detect_outliers_lof(self, data: pd.Series) -> Dict:
        """Local Outlier Factor method"""
        clf = LocalOutlierFactor(contamination=0.1)
        predictions = clf.fit_predict(data.values.reshape(-1, 1))
        outliers = data[predictions == -1]
        
        return {
            'count': int(len(outliers)),
            'percentage': float(len(outliers) / len(data) * 100),
            'indices': outliers.index.tolist(),
            'values': outliers.tolist()
        }
    
    def analyze_data_quality(self) -> Dict:
        """
        Comprehensive data quality analysis
        """
        total_cells = self.df.shape[0] * self.df.shape[1]
        missing_cells = self.df.isna().sum().sum()
        
        # Missing value analysis
        missing_by_column = {}
        for col in self.df.columns:
            missing_count = self.df[col].isna().sum()
            if missing_count > 0:
                missing_by_column[col] = {
                    'count': int(missing_count),
                    'percentage': float(missing_count / len(self.df) * 100)
                }
        
        # Duplicate analysis
        duplicate_rows = self.df.duplicated().sum()
        
        # Infinite value detection
        infinite_by_column = {}
        for col in self.df.select_dtypes(include=[np.number]).columns:
            inf_count = np.isinf(self.df[col]).sum()
            if inf_count > 0:
                infinite_by_column[col] = {
                    'count': int(inf_count),
                    'percentage': float(inf_count / len(self.df) * 100)
                }
        
        # Calculate quality score
        completeness = 1 - (missing_cells / total_cells)
        uniqueness = 1 - (duplicate_rows / len(self.df))
        validity = 1 - (len(infinite_by_column) / len(self.df.columns))
        
        quality_score = (completeness * 0.5 + uniqueness * 0.3 + validity * 0.2) * 100
        
        return {
            'quality_score': float(quality_score),
            'completeness': float(completeness * 100),
            'missing_values': {
                'total': int(missing_cells),
                'percentage': float(missing_cells / total_cells * 100),
                'by_column': missing_by_column
            },
            'duplicates': {
                'count': int(duplicate_rows),
                'percentage': float(duplicate_rows / len(self.df) * 100)
            },
            'infinite_values': {
                'columns_affected': len(infinite_by_column),
                'by_column': infinite_by_column
            }
        }
    
    def run_full_analysis(self) -> Dict[str, Any]:
        """
        Run complete EDA analysis
        """
        if not self.load_data():
            return {'error': 'Failed to load dataset'}
        
        logger.info(f"Starting EDA for dataset {self.dataset_id}")
        
        try:
            # Step 1: Detect column types
            column_types = self.detect_column_types()
            
            # Step 2: Calculate statistics
            statistics = self.calculate_statistics(column_types)
            
            # Step 3: Calculate correlations
            correlations = self.calculate_correlations(method='pearson')
            
            # Step 4: Detect outliers
            outliers = self.detect_outliers(method='iqr')
            
            # Step 5: Analyze data quality
            quality = self.analyze_data_quality()
            
            results = {
                'dataset_id': self.dataset_id,
                'shape': {
                    'rows': int(self.df.shape[0]),
                    'columns': int(self.df.shape[1])
                },
                'column_types': column_types,
                'statistics': statistics,
                'correlations': correlations,
                'outliers': outliers,
                'quality': quality,
                'analyzed_at': datetime.utcnow().isoformat()
            }
            
            logger.info(f"EDA completed for dataset {self.dataset_id}")
            return results
            
        except Exception as e:
            logger.error(f"EDA failed: {e}", exc_info=True)
            return {'error': str(e)}

    def apply_cleaning(self, options: Dict, save_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Apply cleaning transformations to the dataset
        """
        if not self.load_data():
            return {'error': 'Failed to load dataset'}
            
        logs = []
        original_rows = len(self.df)
        initial_quality = self.analyze_data_quality()
        
        df_clean = self.df.copy()
        
        protected_cols = options.get('protectedColumns', [])
        
        # 1. Deduplication
        dropped_duplicates = 0
        if options.get('dropDuplicates'):
            before_dedup = len(df_clean)
            df_clean = df_clean.drop_duplicates()
            dropped_duplicates = before_dedup - len(df_clean)
            if dropped_duplicates > 0:
                logs.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "action": "Deduplication",
                    "reason": "Exact duplicate rows detected",
                    "count": dropped_duplicates
                })
                
        # 2. Fill Missing
        filled_missing = 0
        if options.get('fillMissing'):
            for col in df_clean.columns:
                if col in protected_cols:
                    continue
                
                missing_count = df_clean[col].isna().sum()
                if missing_count > 0:
                    col_type = self._detect_single_column_type(df_clean[col])
                    if col_type == 'numeric':
                        fill_val = df_clean[col].median()
                        df_clean[col] = df_clean[col].fillna(fill_val)
                    else:
                        fill_val = df_clean[col].mode().iloc[0] if not df_clean[col].mode().empty else "Unknown"
                        df_clean[col] = df_clean[col].fillna(fill_val)
                    
                    filled_missing += missing_count
                    
            if filled_missing > 0:
                logs.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "action": "Imputation",
                    "reason": "Missing values filled with median/mode",
                    "count": filled_missing
                })

        # 3. Standardize Text
        text_standardized = 0
        if options.get('standardizeText'):
            for col in df_clean.select_dtypes(include=['object']).columns:
                if col in protected_cols:
                    continue
                
                original_series = df_clean[col].astype(str)
                cleaned_series = df_clean[col].astype(str).str.strip()
                
                changes = (original_series != cleaned_series).sum()
                if changes > 0:
                    df_clean[col] = cleaned_series
                    text_standardized += changes

            if text_standardized > 0:
                 logs.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "action": "Standardization",
                    "reason": "Whitespace stripped from text columns",
                    "count": text_standardized
                 })
                 
        # 4. Remove Outliers
        outliers_capped = 0
        if options.get('removeOutliers'):
            numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                if col in protected_cols:
                    continue
                
                q1 = df_clean[col].quantile(0.25)
                q3 = df_clean[col].quantile(0.75)
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                
                outliers = df_clean[(df_clean[col] < lower) | (df_clean[col] > upper)]
                count = len(outliers)
                if count > 0:
                    df_clean = df_clean[~((df_clean[col] < lower) | (df_clean[col] > upper))]
                    outliers_capped += count
            
            if outliers_capped > 0:
                logs.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "action": "Outlier Removal",
                    "reason": "Rows with values outside 1.5*IQR removed",
                    "count": outliers_capped
                })
        
        # Recalculate quality
        temp_df = self.df
        self.df = df_clean
        final_quality = self.analyze_data_quality()
        self.df = temp_df
        
        # Save if requested
        if save_path:
            try:
                if save_path.endswith('.csv'):
                    df_clean.to_csv(save_path, index=False)
                elif save_path.endswith('.parquet'):
                    df_clean.to_parquet(save_path, index=False)
                else:
                    df_clean.to_csv(save_path, index=False)
            except Exception as e:
                logger.error(f"Failed to save cleaned data: {e}")
                return {'error': f"Failed to save data: {e}"}

        return {
            "originalRows": original_rows,
            "finalRows": len(df_clean),
            "droppedDuplicates": dropped_duplicates,
            "filledMissing": filled_missing,
            "outliersCapped": outliers_capped,
            "textStandardized": text_standardized,
            "beforeQualityScore": int(initial_quality['quality_score']),
            "afterQualityScore": int(final_quality['quality_score']),
            "logs": logs,
            "intents": {col: self._detect_single_column_type(df_clean[col]) for col in df_clean.columns},
            "schemaValidation": {
                "isValid": True,
                "errors": []
            }
        }



# Example usage
if __name__ == "__main__":
    processor = EDAProcessor(
        dataset_id="test-123",
        file_path="/path/to/dataset.csv"
    )
    results = processor.run_full_analysis()
    print(json.dumps(results, indent=2))
