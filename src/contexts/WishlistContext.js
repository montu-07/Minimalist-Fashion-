import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSnackbar } from 'notistack';

const WISHLIST_STORAGE_KEY = 'ecom_wishlist';

// Initial state
const initialState = {
  items: [],
  isWishlistOpen: false,
};

// Action types
const actionTypes = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  MOVE_TO_CART: 'MOVE_TO_CART',
  CLEAR_WISHLIST: 'CLEAR_WISHLIST',
  TOGGLE_WISHLIST: 'TOGGLE_WISHLIST',
  LOAD_WISHLIST: 'LOAD_WISHLIST',
};

// Reducer function
const wishlistReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_ITEM: {
      // Check if item already exists in wishlist
      const itemExists = state.items.some(item => item.id === action.payload.id);
      
      if (itemExists) {
        return state; // Don't add duplicate items
      }
      
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }

    case actionTypes.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };

    case actionTypes.MOVE_TO_CART: {
      const item = state.items.find(item => item.id === action.payload);
      if (!item) return state;
      
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload),
      };
    }

    case actionTypes.CLEAR_WISHLIST:
      return { ...state, items: [] };

    case actionTypes.TOGGLE_WISHLIST:
      return { ...state, isWishlistOpen: !state.isWishlistOpen };

    case actionTypes.LOAD_WISHLIST:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

// Create context
const WishlistContext = createContext();

// Provider component
export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { enqueueSnackbar } = useSnackbar();

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist);
        dispatch({ type: actionTypes.LOAD_WISHLIST, payload: parsedWishlist });
      } catch (error) {
        console.error('Failed to parse wishlist from localStorage', error);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  }, [state]);

  // Action creators
  const addToWishlist = (product) => {
    dispatch({ type: actionTypes.ADD_ITEM, payload: product });
    enqueueSnackbar(`${product.name} added to wishlist`, { variant: 'success' });
  };

  const removeFromWishlist = (productId) => {
    dispatch({ type: actionTypes.REMOVE_ITEM, payload: productId });
    enqueueSnackbar('Item removed from wishlist', { variant: 'info' });
  };

  const moveToCart = (productId, cart) => {
    const item = state.items.find(item => item.id === productId);
    if (item) {
      cart.addToCart({ ...item, quantity: 1 });
      dispatch({ type: actionTypes.REMOVE_ITEM, payload: productId });
      enqueueSnackbar('Item moved to cart', { variant: 'success' });
    }
  };

  const clearWishlist = () => {
    dispatch({ type: actionTypes.CLEAR_WISHLIST });
    enqueueSnackbar('Wishlist cleared', { variant: 'info' });
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const toggleWishlistDrawer = () => {
    dispatch({ type: actionTypes.TOGGLE_WISHLIST });
  };

  const isInWishlist = (productId) => {
    return state.items.some(item => item.id === productId);
  };

  // Context value
  const value = {
    items: state.items,
    isWishlistOpen: state.isWishlistOpen,
    wishlistCount: state.items.length,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    clearWishlist,
    toggleWishlist,
    toggleWishlistDrawer,
    isInWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook for using wishlist context
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
