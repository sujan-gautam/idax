import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Assessment, TableChart, ErrorOutline } from '@mui/icons-material';

interface OverviewTabProps {
    datasetId: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ datasetId }) => {
    const { tenant } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOverview();
    }, [datasetId]);

    const loadOverview = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/datasets/${datasetId}/eda`, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load overview');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!data?.overview) {
        return (
            <Alert severity="info">
                EDA results not available yet. The analysis may still be processing.
            </Alert>
        );
    }

    const overview = data.overview;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Dataset Overview</Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <TableChart sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h4">{overview.rowCount?.toLocaleString()}</Typography>
                        <Typography variant="body2" color="text.secondary">Rows</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Assessment sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography variant="h4">{overview.columnCount}</Typography>
                        <Typography variant="body2" color="text.secondary">Columns</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <ErrorOutline sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                        <Typography variant="h4">{overview.missingRatio}%</Typography>
                        <Typography variant="body2" color="text.secondary">Missing Data</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">{overview.duplicateRows}</Typography>
                        <Typography variant="body2" color="text.secondary">Duplicate Rows</Typography>
                        <Typography variant="caption" color="text.secondary">
                            ({overview.duplicateRatio}%)
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Column Types</Typography>
                        <Grid container spacing={2}>
                            {Object.entries(overview.columnTypes || {}).map(([type, count]) => (
                                <Grid item xs={6} md={3} key={type}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5">{count as number}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {type}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default OverviewTab;
