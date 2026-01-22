import React, { useRef, useState } from 'react';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { uploadFile } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';

const UploadComponent: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            // Mock tenant/project IDs for MVP
            const tenantId = 'tenant-123';
            const projectId = 'proj-abc';

            const result = await uploadFile(file, tenantId, projectId);
            console.log('Upload complete:', result);

            // Navigate to dataset view (mocking dataset creation/id logic)
            // Ideally backend returns datasetId. For now let's just go to a dummy one
            navigate(`/datasets/${result.upload.datasetId || 'new'}`);

        } catch (err: any) {
            console.error(err);
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <Box sx={{ border: '2px dashed #334155', borderRadius: 2, p: 4, textAlign: 'center', bgcolor: '#1e293b', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}>
            <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.xlsx,.json,.pdf"
            />

            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6">Click or Drag to Upload Dataset</Typography>
            <Typography variant="body2" color="text.secondary">CSV, Excel, JSON, PDF (max 100MB)</Typography>

            {uploading && <LinearProgress sx={{ mt: 2 }} />}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
    );
};

export default UploadComponent;
