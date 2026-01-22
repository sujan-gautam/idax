import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Add, CloudUpload, TableChart } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import UploadComponent from '../components/UploadComponent';

interface Dataset {
    id: string;
    name: string;
    createdAt: string;
    _count?: {
        versions: number;
    };
}

interface Project {
    id: string;
    name: string;
    description?: string;
    datasets: Dataset[];
}

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { tenant } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);

    useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/projects/${id}`, {
                headers: { 'x-tenant-id': tenant?.id }
            });
            setProject(response.data);
        } catch (error) {
            console.error('Failed to load project:', error);
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

    if (!project) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6">Project not found</Typography>
                <Button onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
                    Back to Projects
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>{project.name}</Typography>
                    {project.description && (
                        <Typography variant="body2" color="text.secondary">
                            {project.description}
                        </Typography>
                    )}
                </Box>
                <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => setUploadOpen(true)}
                >
                    Upload Dataset
                </Button>
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>Datasets</Typography>

            {project.datasets.length === 0 ? (
                <Card sx={{ textAlign: 'center', py: 8 }}>
                    <TableChart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>No datasets yet</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Upload your first dataset to start analyzing
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        onClick={() => setUploadOpen(true)}
                    >
                        Upload Dataset
                    </Button>
                </Card>
            ) : (
                <Grid container spacing={2}>
                    {project.datasets.map((dataset) => (
                        <Grid item xs={12} sm={6} md={4} key={dataset.id}>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 4 }
                                }}
                                onClick={() => navigate(`/datasets/${dataset.id}`)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <TableChart sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="h6">{dataset.name}</Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(dataset.createdAt).toLocaleDateString()}
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Chip
                                            label={`${dataset._count?.versions || 0} versions`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Upload Dialog */}
            <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Upload Dataset</DialogTitle>
                <DialogContent>
                    <UploadComponent
                        onUploadComplete={() => {
                            setUploadOpen(false);
                            loadProject();
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectDetail;
