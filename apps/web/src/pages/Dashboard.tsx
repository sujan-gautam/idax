import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Folder, CloudUpload, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { user, tenant } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const [projectsRes, datasetsRes] = await Promise.all([
                api.get('/projects', { headers: { 'x-tenant-id': tenant?.id } }),
                api.get('/datasets', { headers: { 'x-tenant-id': tenant?.id } })
            ]);

            setStats({
                projectCount: projectsRes.data.length,
                datasetCount: datasetsRes.data.length
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
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

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Welcome back, {user?.name}!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {tenant?.name}
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper
                        sx={{
                            p: 3,
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 4 }
                        }}
                        onClick={() => navigate('/projects')}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Folder sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                            <Box>
                                <Typography variant="h6" color="text.secondary">
                                    Projects
                                </Typography>
                                <Typography variant="h3">
                                    {stats?.projectCount || 0}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper
                        sx={{
                            p: 3,
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 4 }
                        }}
                        onClick={() => navigate('/projects')}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Assessment sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                            <Box>
                                <Typography variant="h6" color="text.secondary">
                                    Datasets
                                </Typography>
                                <Typography variant="h3">
                                    {stats?.datasetCount || 0}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <CloudUpload sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                            <Box>
                                <Typography variant="h6" color="text.secondary">
                                    Plan
                                </Typography>
                                <Typography variant="h3">
                                    {tenant?.plan || 'FREE'}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
