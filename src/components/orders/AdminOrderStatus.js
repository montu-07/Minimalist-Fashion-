import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  Typography, 
  CircularProgress,
  Paper,
  Divider,
  ListItemIcon
} from '@mui/material';
import { 
  Inventory2 as PackedIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as DeliveredIcon,
  MoreVert as MoreVertIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending', icon: <PendingIcon fontSize="small" /> },
  { value: 'Packed', label: 'Packed', icon: <PackedIcon fontSize="small" /> },
  { value: 'Shipped', label: 'Shipped', icon: <ShippingIcon fontSize="small" /> },
  { value: 'Out for Delivery', label: 'Out for Delivery', icon: <ShippingIcon fontSize="small" /> },
  { value: 'Delivered', label: 'Delivered', icon: <DeliveredIcon fontSize="small" /> },
];

const AdminOrderStatus = ({ orderId, currentStatus, onStatusUpdate }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [updating, setUpdating] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      await onStatusUpdate(orderId, newStatus);
      handleClose();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusLabel = (status) => {
    return STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;
  };

  const getStatusIcon = (status) => {
    return STATUS_OPTIONS.find(opt => opt.value === status)?.icon || <PendingIcon fontSize="small" />;
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1" fontWeight="medium">
            Order Status
          </Typography>
          <Button
            id="status-menu-button"
            aria-controls={open ? 'status-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
            disabled={updating}
            endIcon={<MoreVertIcon />}
            size="small"
          >
            {updating ? (
              <CircularProgress size={20} />
            ) : (
              getStatusLabel(currentStatus)
            )}
          </Button>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Status:
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(currentStatus)}
            <Typography variant="body1" fontWeight="medium">
              {getStatusLabel(currentStatus)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Menu
        id="status-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'status-menu-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem 
            key={option.value}
            onClick={() => handleStatusUpdate(option.value)}
            disabled={option.value === currentStatus || updating}
            selected={option.value === currentStatus}
          >
            <ListItemIcon>
              {option.icon}
            </ListItemIcon>
            {option.label}
            {option.value === currentStatus && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (Current)
              </Typography>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default AdminOrderStatus;
