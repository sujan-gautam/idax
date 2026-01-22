import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

interface PreviewTabProps {
    datasetId: string;
}

const PreviewTab: React.FC<PreviewTabProps> = ({ datasetId }) => {
    const { tenant } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPreview();
    }, [datasetId]);

    const loadPreview = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/datasets/${datasetId}/preview`, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load preview');
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
            <Alert severity="error">{error}</Alert>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Alert severity="info">No data available</Alert>
        );
    }

    const columns = Object.keys(data[0]);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Data Preview (First 100 rows)
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>#</TableCell>
                            {columns.map((col) => (
                                <TableCell key={col} sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                                    {col}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>{idx + 1}</TableCell>
                                {columns.map((col) => (
                                    <TableCell key={col}>
                                        {row[col] !== null && row[col] !== undefined
                                            ? String(row[col])
                                            : <span style={{ color: '#999' }}>null</span>
                                        }
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default PreviewTab;
