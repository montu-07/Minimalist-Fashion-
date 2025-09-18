import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSnackbar } from 'notistack';

// Types of notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  OFFER: 'offer',
  WISHLIST: 'wishlist',
  ORDER: 'order',
};

// Initial state
const initialState = {
  notifications: [],
  preferences: {
    [NOTIFICATION_TYPES.SUCCESS]: true,
    [NOTIFICATION_TYPES.ERROR]: true,
    [NOTIFICATION_TYPES.WARNING]: true,
    [NOTIFICATION_TYPES.INFO]: true,
    [NOTIFICATION_TYPES.OFFER]: true,
    [NOTIFICATION_TYPES.WISHLIST]: true,
    [NOTIFICATION_TYPES.ORDER]: true,
    sound: true,
    desktop: true,
    email: false,
    push: false,
  },
};

// Action types
const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
const CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS';
const UPDATE_PREFERENCES = 'UPDATE_PREFERENCES';

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50), // Limit to 50 notifications
      };
    case REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };
    case UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };
    default:
      return state;
  }
};

// Context
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { enqueueSnackbar } = useSnackbar();

  // Add a new notification
  const addNotification = useCallback(({ 
    type = NOTIFICATION_TYPES.INFO, 
    message, 
    title, 
    autoHideDuration = 5000, 
    action,
    persist = false,
    ...rest 
  }) => {
    // Check if this type of notification is enabled in preferences
    if (!state.preferences[type]) return null;

    const id = uuidv4();
    const notification = {
      id,
      type,
      message,
      title,
      timestamp: new Date().toISOString(),
      read: false,
      ...rest,
    };

    dispatch({ type: ADD_NOTIFICATION, payload: notification });

    // Show snackbar if enabled
    if (state.preferences.desktop && !persist) {
      enqueueSnackbar(message, {
        variant: type,
        autoHideDuration: persist ? null : autoHideDuration,
        action,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
      });
    }

    // Play sound if enabled
    if (state.preferences.sound) {
      // You can implement a custom sound here
      // playNotificationSound();
    }

    return id;
  }, [enqueueSnackbar, state.preferences]);

  // Remove a notification
  const removeNotification = useCallback((id) => {
    dispatch({ type: REMOVE_NOTIFICATION, payload: id });
  }, []); 

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    dispatch({
      type: 'UPDATE_NOTIFICATION',
      payload: { id, updates: { read: true } },
    });
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    dispatch({ type: CLEAR_NOTIFICATIONS });
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback((updates) => {
    dispatch({ type: UPDATE_PREFERENCES, payload: updates });
  }, []);

  // Get unread count
  const unreadCount = state.notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: state.notifications,
        preferences: state.preferences,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Helper hooks for specific notification types
export const useNotification = () => {
  const { addNotification } = useNotifications();
  
  return {
    success: (message, options) => 
      addNotification({ type: NOTIFICATION_TYPES.SUCCESS, message, ...options }),
    error: (message, options) => 
      addNotification({ type: NOTIFICATION_TYPES.ERROR, message, ...options }),
    warning: (message, options) => 
      addNotification({ type: NOTIFICATION_TYPES.WARNING, message, ...options }),
    info: (message, options) => 
      addNotification({ type: NOTIFICATION_TYPES.INFO, message, ...options }),
    offer: (message, options) => 
      addNotification({ type: NOTIFICATION_TYPES.OFFER, message, ...options }),
    wishlist: (message, options) => 
      addNotification({ type: NOTIFICATION_TYPES.WISHLIST, message, ...options }),
    order: (message, options) => 
      addNotification({ type: NOTIFICATION_TYPES.ORDER, message, ...options }),
  };
};
