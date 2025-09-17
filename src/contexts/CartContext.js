import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSnackbar } from 'notistack';

const CART_STORAGE_KEY = 'ecom_cart';

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  coupon: null,
  isCartOpen: false,
};

// Action types
const actionTypes = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_COUPON: 'APPLY_COUPON',
  REMOVE_COUPON: 'REMOVE_COUPON',
  TOGGLE_CART: 'TOGGLE_CART',
  CALCULATE_TOTALS: 'CALCULATE_TOTALS',
  LOAD_CART: 'LOAD_CART',
};

// Reducer function
const cartReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_ITEM: {
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.payload.id && JSON.stringify(item.selectedOptions) === JSON.stringify(action.payload.selectedOptions || {})
      );

      let updatedItems;
      if (existingItemIndex >= 0) {
        updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + (action.payload.quantity || 1),
        };
      } else {
        updatedItems = [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }];
      }

      return { ...state, items: updatedItems };
    }

    case actionTypes.REMOVE_ITEM: {
      const updatedItems = state.items.filter((_, index) => index !== action.payload);
      return { ...state, items: updatedItems };
    }

    case actionTypes.UPDATE_QUANTITY: {
      const { index, quantity } = action.payload;
      if (quantity < 1) return state;
      
      const updatedItems = [...state.items];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity,
      };
      
      return { ...state, items: updatedItems };
    }

    case actionTypes.CLEAR_CART:
      return { ...initialState, isCartOpen: state.isCartOpen };

    case actionTypes.APPLY_COUPON:
      return { ...state, coupon: action.payload };

    case actionTypes.REMOVE_COUPON:
      return { ...state, coupon: null };

    case actionTypes.TOGGLE_CART:
      return { ...state, isCartOpen: !state.isCartOpen };

    case actionTypes.CALCULATE_TOTALS: {
      const subtotal = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      
      // Calculate discount from coupon if applied
      let discount = 0;
      if (state.coupon) {
        if (state.coupon.discountType === 'percentage') {
          discount = (subtotal * state.coupon.discountValue) / 100;
        } else {
          discount = Math.min(state.coupon.discountValue, subtotal);
        }
      }
      
      // Calculate shipping (example: free shipping for orders over $50)
      const shipping = subtotal >= 50 ? 0 : 10;
      
      // Calculate tax (example: 8% tax)
      const tax = (subtotal - discount) * 0.08;
      
      // Calculate total
      const total = subtotal - discount + shipping + tax;
      
      // Calculate total items
      const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...state,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        totalItems,
      };
    }

    case actionTypes.LOAD_CART:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

// Create context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { enqueueSnackbar } = useSnackbar();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: actionTypes.LOAD_CART, payload: parsedCart });
      } catch (error) {
        console.error('Failed to parse cart from localStorage', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [state]);

  // Recalculate totals when items or coupon changes
  useEffect(() => {
    dispatch({ type: actionTypes.CALCULATE_TOTALS });
  }, [state.items, state.coupon]);

  // Action creators
  const addToCart = (item) => {
    dispatch({ type: actionTypes.ADD_ITEM, payload: item });
    enqueueSnackbar(`${item.name} added to cart`, { variant: 'success' });
  };

  const removeFromCart = (index) => {
    const item = state.items[index];
    dispatch({ type: actionTypes.REMOVE_ITEM, payload: index });
    enqueueSnackbar(`${item.name} removed from cart`, { variant: 'info' });
  };

  const updateQuantity = (index, quantity) => {
    dispatch({ type: actionTypes.UPDATE_QUANTITY, payload: { index, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: actionTypes.CLEAR_CART });
    enqueueSnackbar('Cart cleared', { variant: 'info' });
  };

  const applyCoupon = (coupon) => {
    dispatch({ type: actionTypes.APPLY_COUPON, payload: coupon });
    enqueueSnackbar('Coupon applied successfully', { variant: 'success' });
  };

  const removeCoupon = () => {
    dispatch({ type: actionTypes.REMOVE_COUPON });
    enqueueSnackbar('Coupon removed', { variant: 'info' });
  };

  const toggleCart = () => {
    dispatch({ type: actionTypes.TOGGLE_CART });
  };

  const isInCart = (productId, selectedOptions = {}) => {
    return state.items.some(
      (item) => 
        item.id === productId && 
        JSON.stringify(item.selectedOptions || {}) === JSON.stringify(selectedOptions)
    );
  };

  // Context value
  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    toggleCart,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook for using cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
