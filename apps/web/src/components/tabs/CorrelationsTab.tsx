import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

interface CorrelationsTabProps {
    datasetId: string;
}

const CorrelationsTab: React.FC<CorrelationsTabProps> = ({ datasetId }) => {
    const { tenant } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCorrelations();
    }, [datasetId]);

    const loadCorrelations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/datasets/${datasetId}/eda`, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load correlations');
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

    if (!data?.correlations?.matrix) {
        return (
            <Alert severity="info">
                Correlation analysis requires at least 2 numeric columns
            </Alert>
        );
    }

    const matrix = data.correlations.matrix;
    const columns = Object.keys(matrix);

    const getColor = (value: number) => {
        const intensity = Math.abs(value);
        if (value > 0) {
            return `rgba(102, 126, 234, ${intensity})`;
        } else {
            return `rgba(239, 68, 68, ${intensity})`;
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Correlation Matrix ({data.correlations.method})
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}></TableCell>
                            {columns.map((col) => (
                                <TableCell
                                    key={col}
                                    sx={{ fontWeight: 'bold', bgcolor: 'grey.100', minWidth: 100 }}
                                >
                                    {col}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {columns.map((row) => (
                            <TableRow key={row}>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                                    {row}
                                </TableCell>
                                {columns.map((col) => {
                                    const value = matrix[row][col];
                                    return (
                                        <TableCell
                                            key={col}
                                            sx={{
                                                bgcolor: getColor(value),
                                                textAlign: 'center',
                                                fontWeight: Math.abs(value) > 0.7 ? 'bold' : 'normal'
                                            }}
                                        >
                                            {value.toFixed(3)}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="caption">Legend:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: 'rgba(102, 126, 234, 0.8)' }} />
                    <Typography variant="caption">Positive</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: 'rgba(239, 68, 68, 0.8)' }} />
                    <Typography variant="caption">Negative</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default CorrelationsTab;
