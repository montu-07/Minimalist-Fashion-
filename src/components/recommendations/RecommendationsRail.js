import React from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardContent, Button } from '@mui/material';
import { getRecommendations, trackEvent } from 'services/recommendations';
import { getProductImage, onImgErrorSwap } from 'core/utils/imageForProduct';
import { Link } from 'react-router-dom';
import { useCart } from 'state/CartContext';

export default function RecommendationsRail({ excludeIds = [], title = 'You may also like', limit = 8, boost = {} }) {
  const { addItem } = useCart();
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    const recs = getRecommendations({ limit, excludeIds, boost });
    setItems(recs);
  }, [JSON.stringify(excludeIds), JSON.stringify(boost), limit]);

  if (!items.length) return null;
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      <Grid container spacing={2}>
        {items.map((p) => (
          <Grid item key={p.id} xs={12} sm={6} md={3} lg={3}>
            <Card>
              <CardMedia
                component="img"
                src={getProductImage(p, { w: 600, h: 600 })}
                alt={p.title}
                loading="lazy"
                onError={(e) => onImgErrorSwap(e, p, { w: 600, h: 600 })}
                sx={{ aspectRatio: '1 / 1', bgcolor: 'action.hover', objectFit: 'cover', width: '100%' }}
              />
              <CardContent>
                <Typography variant="subtitle2" noWrap>{p.title}</Typography>
                <Typography variant="body2" color="text.secondary">${Number(p.price).toFixed(2)}</Typography>
              </CardContent>
              <Box sx={{ display: 'flex', gap: 1, px: 2, pb: 2 }}>
                <Button component={Link} to={`/product/${p.id}`} size="small" onClick={() => trackEvent({ type: 'quick_view', productId: p.id, category: p.category })}>View</Button>
                <Button size="small" variant="contained" onClick={() => { addItem(p, 1); trackEvent({ type: 'add_to_cart', productId: p.id, category: p.category }); }}>Add to Cart</Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
