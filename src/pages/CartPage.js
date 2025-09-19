import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useCart } from '../state/CartContext';
import { useNavigate } from 'react-router-dom';
import RecommendationsRail from 'components/recommendations/RecommendationsRail';

function CartPage() {
  const { items, removeItem, updateQty, subtotal, clear } = useCart();
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>Shopping Cart</Typography>
      <Divider sx={{ mb: 2 }} />
      {items.length === 0 ? (
        <Typography color="text.secondary">Your cart is empty.</Typography>
      ) : (
        <>
          {items.map((i) => (
            <Box key={i.key} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <Box sx={{ width: 72, height: 72, bgcolor: 'action.hover', borderRadius: 1 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{i.product.title}</Typography>
                <Typography variant="body2" color="text.secondary">${i.product.price.toFixed(2)} x {i.qty}</Typography>
              </Box>
              <Button onClick={() => updateQty(i.key, Math.max(1, i.qty - 1))}>-</Button>
              <Typography>{i.qty}</Typography>
              <Button onClick={() => updateQty(i.key, i.qty + 1)}>+</Button>
              <Button color="error" onClick={() => removeItem(i.key)}>Remove</Button>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Subtotal: ${subtotal.toFixed(2)}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={clear}>Clear</Button>
              <Button variant="contained" onClick={() => navigate('/checkout')}>Checkout</Button>
            </Box>
          </Box>
          {/* Cross-sell recommendations */}
          <Box sx={{ mt: 4 }}>
            <RecommendationsRail
              title="You may also like"
              excludeIds={items.map(i => i.product.id)}
              boost={{ categories: Array.from(new Set(items.map(i => i.product.category).filter(Boolean))) }}
              limit={8}
            />
          </Box>
        </>
      )}
    </Box>
  );
}

export default CartPage;
