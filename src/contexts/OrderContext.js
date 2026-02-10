import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from 'state/AuthContext';
import { getOrderById as fetchOrderById, updateOrderStatus as updateOrderStatusApi } from 'services/ordersStore';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const getOrderById = async (orderId, email) => {
    setLoading(true);
    setError('');
    try {
      const orderData = await fetchOrderById(orderId);
      if (!orderData) {
        throw new Error('Order not found');
      }
      
      // For non-admin users, verify email matches
      if (user?.role !== 'admin') {
        const orderEmail = orderData?.user?.email || '';
        if (!orderEmail || orderEmail.toLowerCase() !== String(email).toLowerCase()) {
          throw new Error('No order found with the provided details');
        }
      }
      
      setOrder(orderData);
      return orderData;
    } catch (err) {
      setError(err.message || 'Failed to fetch order details');
      setOrder(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    if (user?.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update order status');
    }

    setLoading(true);
    setError('');
    try {
      const updatedOrder = await updateOrderStatusApi(orderId, status);
      setOrder(prevOrder => ({
        ...prevOrder,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }));
      return updatedOrder;
    } catch (err) {
      setError(err.message || 'Failed to update order status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearOrder = () => {
    setOrder(null);
    setError('');
  };

  // Refresh current order when orders store broadcasts an update
  useEffect(() => {
    const onUpdated = () => {
      if (order?.id) {
        const refreshed = fetchOrderById(order.id);
        if (refreshed) setOrder(refreshed);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('orders:updated', onUpdated);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('orders:updated', onUpdated);
      }
    };
  }, [order?.id]);

  return (
    <OrderContext.Provider
      value={{
        order,
        loading,
        error,
        getOrderById,
        updateOrderStatus,
        clearOrder,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
