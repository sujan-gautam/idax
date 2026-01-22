import React from 'react';
import { Typography, Box } from '@mui/material';

const NotFound: React.FC = () => {
    return (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
            <Typography variant="h1">404</Typography>
            <Typography variant="h5" color="text.secondary">Page not found</Typography>
        </Box>
    );
};

export default NotFound;
