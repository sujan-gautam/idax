import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DistributionsTabProps {
    datasetId: string;
}

const DistributionsTab: React.FC<DistributionsTabProps> = ({ datasetId }) => {
    const { tenant } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<string>('');

    useEffect(() => {
        loadDistributions();
    }, [datasetId]);

    const loadDistributions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/datasets/${datasetId}/eda`, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setData(response.data);

            // Select first column by default
            if (response.data?.distributions) {
                const columns = Object.keys(response.data.distributions);
                if (columns.length > 0) {
                    setSelectedColumn(columns[0]);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load distributions');
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

    if (!data?.distributions) {
        return <Alert severity="info">Distribution data not available</Alert>;
    }

    const columns = Object.keys(data.distributions);
    const distribution = data.distributions[selectedColumn];

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Distributions</Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Column</InputLabel>
                <Select
                    value={selectedColumn}
                    label="Select Column"
                    onChange={(e) => setSelectedColumn(e.target.value)}
                >
                    {columns.map((col) => (
                        <MenuItem key={col} value={col}>{col}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {distribution && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>{selectedColumn}</Typography>

                    {distribution.type === 'numeric' && (
                        <>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6} md={2}>
                                    <Typography variant="caption" color="text.secondary">Min</Typography>
                                    <Typography variant="body1">{distribution.min}</Typography>
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <Typography variant="caption" color="text.secondary">Max</Typography>
                                    <Typography variant="body1">{distribution.max}</Typography>
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <Typography variant="caption" color="text.secondary">Mean</Typography>
                                    <Typography variant="body1">{distribution.mean}</Typography>
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <Typography variant="caption" color="text.secondary">Median</Typography>
                                    <Typography variant="body1">{distribution.median}</Typography>
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <Typography variant="caption" color="text.secondary">Std Dev</Typography>
                                    <Typography variant="body1">{distribution.std}</Typography>
                                </Grid>
                            </Grid>

                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={distribution.bins}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="start"
                                        tickFormatter={(value) => value.toFixed(2)}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#667eea" name="Frequency" />
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    )}

                    {distribution.type === 'categorical' && (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {distribution.uniqueCount} unique values
                            </Typography>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={distribution.topValues}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="value" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#764ba2" name="Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default DistributionsTab;
