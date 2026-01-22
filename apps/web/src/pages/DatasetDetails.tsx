import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, CircularProgress, Chip } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import OverviewTab from '../components/tabs/OverviewTab';
import PreviewTab from '../components/tabs/PreviewTab';
import DistributionsTab from '../components/tabs/DistributionsTab';
import CorrelationsTab from '../components/tabs/CorrelationsTab';
import OutliersTab from '../components/tabs/OutliersTab';
import DataQualityTab from '../components/tabs/DataQualityTab';

interface Dataset {
    id: string;
    name: string;
    project: {
        id: string;
        name: string;
    };
    activeVersionId?: string;
    versions: any[];
}

const DatasetDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { tenant } = useAuth();
    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        loadDataset();
    }, [id]);

    const loadDataset = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/datasets/${id}`, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setDataset(response.data);
        } catch (error) {
            console.error('Failed to load dataset:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!dataset) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6">Dataset not found</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>{dataset.name}</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Project: {dataset.project.name}
                    </Typography>
                    <Chip
                        label={`${dataset.versions.length} versions`}
                        size="small"
                        variant="outlined"
                    />
                </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab label="Overview" />
                    <Tab label="Preview" />
                    <Tab label="Distributions" />
                    <Tab label="Correlations" />
                    <Tab label="Outliers" />
                    <Tab label="Data Quality" />
                </Tabs>
            </Box>

            {activeTab === 0 && <OverviewTab datasetId={id!} />}
            {activeTab === 1 && <PreviewTab datasetId={id!} />}
            {activeTab === 2 && <DistributionsTab datasetId={id!} />}
            {activeTab === 3 && <CorrelationsTab datasetId={id!} />}
            {activeTab === 4 && <OutliersTab datasetId={id!} />}
            {activeTab === 5 && <DataQualityTab datasetId={id!} />}
        </Box>
    );
};

export default DatasetDetails;
