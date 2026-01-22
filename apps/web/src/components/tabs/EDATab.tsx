import React, { useEffect, useState } from 'react';
import { Paper, Typography, Grid, Box, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDatasetEDA } from '../../services/api';

interface EDATabProps {
    datasetId?: string;
    type: 'distribution' | 'correlation' | 'outliers' | 'quality';
}

const EDATab: React.FC<EDATabProps> = ({ datasetId, type }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!datasetId) return;
        getDatasetEDA(datasetId)
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [datasetId]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (!stats || !stats.columns) return <Typography>No analysis available. Please verify the dataset has been processed.</Typography>;

    const columns = Object.entries(stats.columns);

    const renderDistributions = () => (
        <Grid container spacing={3}>
            {columns.map(([name, col]: [string, any]) => (
                <Grid item xs={12} md={6} key={name}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>{name}</Typography>
                        <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
                            Type: {col.type}
                        </Typography>
                        <Box sx={{ height: 300, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={col.type === 'numeric' ? col.histogram : col.topValues} margin={{ bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey={col.type === 'numeric' ? 'range' : 'val'}
                                        tick={{ fontSize: 10 }}
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill={col.type === 'numeric' ? "#1976d2" : "#82ca9d"} name="Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );

    const renderOutliers = () => (
        <Grid container spacing={3}>
            {columns.filter(([_, col]: [string, any]) => col.type === 'numeric').map(([name, col]: [string, any]) => {
                const iqr = (col.q3 || 0) - (col.q1 || 0);
                const lower = (col.q1 || 0) - 1.5 * iqr;
                const upper = (col.q3 || 0) + 1.5 * iqr;
                return (
                    <Grid item xs={12} sm={6} md={4} key={name}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>{name}</Typography>
                            <Box sx={{ mt: 2 }}>
                                <Grid container spacing={1}>
                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Min</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2" align="right">{col.min?.toFixed(2)}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Q1 (25%)</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2" align="right">{col.q1?.toFixed(2)}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Median</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2" align="right">{col.median?.toFixed(2)}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Q3 (75%)</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2" align="right">{col.q3?.toFixed(2)}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Max</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2" align="right">{col.max?.toFixed(2)}</Typography></Grid>
                                </Grid>
                                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                    <Typography variant="subtitle2" gutterBottom>Potential Outliers</Typography>
                                    <Typography variant="caption" color="error">
                                        {'<'} {lower.toFixed(2)} or {'>'} {upper.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                );
            })}
            {columns.every(([_, col]: [string, any]) => col.type !== 'numeric') && (
                <Grid item xs={12}>
                    <Typography>No numeric columns found for outlier analysis.</Typography>
                </Grid>
            )}
        </Grid>
    );

    const renderQuality = () => (
        <Grid container spacing={3}>
            {columns.map(([name, col]: [string, any]) => (
                <Grid item xs={12} sm={6} md={3} key={name}>
                    <Paper sx={{ p: 3, borderLeft: 6, borderColor: col.missing > 0 ? 'warning.main' : 'success.main' }}>
                        <Typography variant="h6" noWrap>{name}</Typography>
                        <Box sx={{ my: 2 }}>
                            <Typography variant="h3" color={col.missing > 0 ? 'error' : 'text.primary'}>
                                {col.missing}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Missing Values</Typography>
                        </Box>
                        <Typography variant="caption" display="block">
                            {col.type === 'numeric' ? 'Numeric' : 'Categorical'}
                        </Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );

    return (
        <Box sx={{ pb: 4 }}>
            {type === 'distribution' && renderDistributions()}
            {type === 'outliers' && renderOutliers()}
            {type === 'quality' && renderQuality()}
            {type === 'correlation' && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">Correlation Analysis</Typography>
                    <Typography>Feature correlation matrix implementation pending.</Typography>
                </Paper>
            )}
        </Box>
    );
};

export default EDATab;
