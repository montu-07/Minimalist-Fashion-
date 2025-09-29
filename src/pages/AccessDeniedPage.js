import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function AccessDeniedPage() {
  return (
    <Box sx={{ py: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ textAlign: 'center', maxWidth: 560 }}>
        <Typography variant="h4" gutterBottom>Access Denied</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          You dont have permission to access this page. If you believe this is an error, please contact an administrator.
        </Typography>
        <Button component={Link} to="/" variant="contained">Go to Home</Button>
      </Box>
    </Box>
  );
}
