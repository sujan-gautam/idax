import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Grid
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Error, Warning, Info } from '@mui/icons-material';

interface DataQualityTabProps {
    datasetId: string;
}

const DataQualityTab: React.FC<DataQualityTabProps> = ({ datasetId }) => {
    const { tenant } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDataQuality();
    }, [datasetId]);

    const loadDataQuality = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/datasets/${datasetId}/eda`, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data quality');
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
        return <Alert severity="error">{error}</Alert>;
    }

    if (!data?.dataQuality) {
        return <Alert severity="info">Data quality analysis not available</Alert>;
    }

    const quality = data.dataQuality;

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high':
                return <Error color="error" />;
            case 'medium':
                return <Warning color="warning" />;
            case 'low':
                return <Info color="info" />;
            default:
                return <Info />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Data Quality Assessment
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="error.main">
                            {quality.summary.high}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            High Severity Issues
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="warning.main">
                            {quality.summary.medium}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Medium Severity Issues
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="info.main">
                            {quality.summary.low}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Low Severity Issues
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {quality.issues.length === 0 ? (
                <Alert severity="success">
                    No data quality issues detected! Your dataset looks clean.
                </Alert>
            ) : (
                <Paper>
                    <List>
                        {quality.issues.map((issue: any, idx: number) => (
                            <ListItem
                                key={idx}
                                sx={{
                                    borderLeft: 4,
                                    borderColor: `${getSeverityColor(issue.severity)}.main`,
                                    mb: 1
                                }}
                            >
                                <ListItemIcon>
                                    {getSeverityIcon(issue.severity)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                {issue.column}
                                            </Typography>
                                            <Chip
                                                label={issue.type.replace('_', ' ')}
                                                size="small"
                                                color={getSeverityColor(issue.severity) as any}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" color="text.secondary">
                                                {issue.message}
                                            </Typography>
                                            <Typography variant="caption" color="primary">
                                                Recommendation: {issue.recommendation}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default DataQualityTab;
