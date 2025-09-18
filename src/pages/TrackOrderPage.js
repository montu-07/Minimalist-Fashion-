import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Chip,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useOrder } from 'contexts/OrderContext';
// No admin controls on this public page

// Timeline hidden on customer page by requirement

const TrackOrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [searched, setSearched] = useState(false);
  
  const { 
    order, 
    loading,   
    getOrderById, 
    updateOrderStatus, 
    clearOrder, 
    isAdmin 
  } = useOrder();

  // Check for order ID in URL params (for direct linking)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const emailParam = params.get('email');
    
    if (id) {
      setOrderId(id);
      if (emailParam) {
        setEmail(emailParam);
        handleTrackOrder({ preventDefault: () => {} }, id, emailParam);
      }
    }
    
    return () => clearOrder();
  }, [location.search]);

  const handleTrackOrder = async (e, id = orderId, emailParam = email) => {
    e?.preventDefault();
    
    if (!id.trim() || (!isAdmin && !emailParam.trim())) {
      setFormError(isAdmin ? 'Please enter an order ID' : 'Please enter both order ID and email');
      return;
    }
    setFormError('');
    
    setSearched(true);
    
    try {
      await getOrderById(id, emailParam);
      // Update URL without page reload
      const newUrl = `${window.location.pathname}?id=${id}${!isAdmin ? `&email=${encodeURIComponent(emailParam)}` : ''}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (err) {
      console.error('Error tracking order:', err);
    }
  };
  
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      throw err;
    }
  };

  // No stepper on customer page
  
  const getStatusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'out for delivery':
      case 'out_for_delivery':
        return 'warning';
      case 'shipped':
        return 'info';
      case 'packed':
        return 'primary';
      case 'cancelled':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        {isAdmin ? 'Order Management' : 'Track Your Order'}
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleTrackOrder}>
          <Typography variant="h6" gutterBottom>
            {isAdmin ? 'Lookup Order' : 'Enter Your Order Details'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
            <TextField
              fullWidth
              label="Order ID"
              variant="outlined"
              value={orderId}
              onChange={(e) => { setOrderId(e.target.value); if (formError) setFormError(''); }}
              placeholder={isAdmin ? "Enter order ID" : "e.g. ORD-123456"}
              required
              disabled={loading}
            />
            {!isAdmin && (
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (formError) setFormError(''); }}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              disabled={loading}
              sx={{ 
                minWidth: 150,
                height: 56,
                '& .MuiButton-startIcon': { m: 0 }
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Box>
          {formError && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Paper>

      {searched && !order && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No order found with the provided details. Please check your order ID and email and try again.
        </Alert>
      )}

      {order && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={isAdmin ? 8 : 12}>
                <Box sx={{ mb: 4 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Order #{order.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status.replace(/_/g, ' ')}
                      color={getStatusColor(order.status)}
                      variant="filled"
                      size="medium"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                  
                  {/* Timeline hidden on customer page */}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Shipping Address
                    </Typography>
                    <Typography variant="body1">
                      {order.address?.firstName} {order.address?.lastName}<br />
                      {order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ''}<br />
                      {order.address?.city}, {order.address?.state} {order.address?.zip}<br />
                      {order.address?.country}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Contact Information
                    </Typography>
                    <Typography variant="body1">
                      {order.user?.email || '—'}
                    </Typography>
                    
                    <Box mt={2}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Order Total
                      </Typography>
                      <Typography variant="h6">
                        ${order.totals?.total != null ? Number(order.totals.total).toFixed(2) : '0.00'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    View Order Details
                  </Button>
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => window.print()}
                  >
                    Print Order
                  </Button>
                </Box>
              </Grid>
              
              {/* No admin controls on this public page */}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default TrackOrderPage;
