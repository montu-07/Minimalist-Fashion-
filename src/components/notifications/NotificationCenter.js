import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Badge,
  Popover,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
  Avatar,
  Paper,
  Slide,
  Fade,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  DoneAll as MarkAllReadIcon,
  Delete as ClearAllIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  LocalOffer as OfferIcon,
  Favorite as WishlistIcon,
  LocalShipping as OrderIcon,
} from '@mui/icons-material';
import { useNotifications, NOTIFICATION_TYPES } from 'contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationIcon = ({ type }) => {
  const iconProps = { fontSize: 'small' };
  switch (type) {
    case NOTIFICATION_TYPES.ERROR:
      return <ErrorIcon color="error" {...iconProps} />;
    case NOTIFICATION_TYPES.WARNING:
      return <WarningIcon color="warning" {...iconProps} />;
    case NOTIFICATION_TYPES.SUCCESS:
      return <SuccessIcon color="success" {...iconProps} />;
    case NOTIFICATION_TYPES.OFFER:
      return <OfferIcon color="primary" {...iconProps} />;
    case NOTIFICATION_TYPES.WISHLIST:
      return <WishlistIcon color="secondary" {...iconProps} />;
    case NOTIFICATION_TYPES.ORDER:
      return <OrderIcon color="info" {...iconProps} />;
    default:
      return <InfoIcon color="info" {...iconProps} />;
  }
};

const NotificationItem = ({ notification, onClose, onMarkAsRead }) => {
  const [isVisible, setIsVisible] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    // Handle notification click (e.g., navigate to relevant page)
    if (notification.onClick) {
      notification.onClick();
    }
    handleDismiss();
  };

  return (
    <Slide direction="left" in={isVisible} mountOnEnter unmountOnExit>
      <Paper
        elevation={2}
        sx={{
          mb: 1,
          borderRadius: 2,
          overflow: 'hidden',
          opacity: notification.read ? 0.8 : 1,
          borderLeft: `4px solid ${theme.palette[notification.type]?.main || theme.palette.primary.main}`,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
        }}
        onClick={handleClick}
      >
        <Box sx={{ p: 2, pr: 6, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <NotificationIcon type={notification.type} />
            <Typography
              variant="subtitle2"
              sx={{
                ml: 1,
                fontWeight: 'medium',
                color: theme.palette.text.primary,
              }}
            >
              {notification.title || notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {notification.message}
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{
              display: 'block',
              mt: 0.5,
              fontSize: '0.7rem',
            }}
          >
            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              color: 'text.secondary',
              '&:hover': {
                color: 'error.main',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Slide>
  );
};

const NotificationCenter = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Mark all as read when opening the notification center
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          aria-describedby={id}
          onClick={handleClick}
          sx={{
            position: 'relative',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isMobile ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isMobile ? 'left' : 'right',
        }}
        PaperProps={{
          sx: {
            width: isMobile ? '100vw' : 380,
            maxWidth: '100%',
            maxHeight: '80vh',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: theme.shadows[10],
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Notifications {unreadCount > 0 && `(${unreadCount} new)`}
          </Typography>
          <Box>
            <Tooltip title="Mark all as read">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                disabled={unreadCount === 0}
              >
                <MarkAllReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear all">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotifications();
                }}
                disabled={notifications.length === 0}
              >
                <ClearAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ overflowY: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              <AnimatePresence initial={false}>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NotificationItem
                      notification={notification}
                      onClose={removeNotification}
                      onMarkAsRead={markAsRead}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          )}
        </Box>

        {notifications.length > 0 && (
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button size="small" onClick={clearNotifications}>
              Clear all notifications
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default NotificationCenter;
