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
    TableRow,
    Chip
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Warning } from '@mui/icons-material';

interface OutliersTabProps {
    datasetId: string;
}

const OutliersTab: React.FC<OutliersTabProps> = ({ datasetId }) => {
    const { tenant } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOutliers();
    }, [datasetId]);

    const loadOutliers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/datasets/${datasetId}/eda`, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load outliers');
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

    if (!data?.outliers || Object.keys(data.outliers).length === 0) {
        return (
            <Alert severity="info">
                No outliers detected or no numeric columns available
            </Alert>
        );
    }

    const outliers = data.outliers;
    const columns = Object.keys(outliers);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Outlier Detection (IQR Method)
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Count</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Percentage</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Lower Bound</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Upper Bound</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Examples</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {columns.map((col) => {
                            const outlier = outliers[col];
                            return (
                                <TableRow key={col}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {outlier.count > 0 && (
                                                <Warning color="warning" fontSize="small" />
                                            )}
                                            {col}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{outlier.count}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${outlier.percentage}%`}
                                            size="small"
                                            color={outlier.percentage > 5 ? 'warning' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>{outlier.lowerBound}</TableCell>
                                    <TableCell>{outlier.upperBound}</TableCell>
                                    <TableCell>
                                        {outlier.examples.slice(0, 3).map((val: number, idx: number) => (
                                            <Chip
                                                key={idx}
                                                label={val}
                                                size="small"
                                                sx={{ mr: 0.5 }}
                                            />
                                        ))}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Alert severity="info" sx={{ mt: 2 }}>
                Outliers are detected using the IQR (Interquartile Range) method.
                Values below Q1 - 1.5×IQR or above Q3 + 1.5×IQR are considered outliers.
            </Alert>
        </Box>
    );
};

export default OutliersTab;
