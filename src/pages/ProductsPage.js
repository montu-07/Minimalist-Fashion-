import React from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Pagination from '@mui/material/Pagination';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import TuneIcon from '@mui/icons-material/Tune';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Rating from '@mui/material/Rating';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from 'state/CartContext';
import { fetchProducts, fetchFacets } from 'services/productsApi';
import FilterSidebar from 'components/filters/FilterSidebar';
import { getProductImage, onImgErrorSwap } from 'core/utils/imageForProduct';
import RecommendationsRail from 'components/recommendations/RecommendationsRail';
import { trackEvent, trackProductImpressions } from 'services/recommendations';
import Chip from '@mui/material/Chip';
import { useAuth } from 'state/AuthContext';
import { isMember } from 'services/memberships';

function ProductCard({ product, onAdd, onQuick, locked }) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transform: 'translateY(0)',
        transition: 'transform .2s ease, box-shadow .2s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
        '&:hover .overlay': { opacity: 1, transform: 'translateY(0)' },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          src={getProductImage(product, { w: 600, h: 600 })}
          alt={product.title}
          loading="lazy"
          onError={(e) => onImgErrorSwap(e, product, { w: 600, h: 600 })}
          sx={{ aspectRatio: '1 / 1', bgcolor: 'action.hover', objectFit: 'cover', width: '100%' }}
        />
        {(product.exclusive || product.earlyAccess || (Array.isArray(product.tags) && (product.tags.includes('exclusive') || product.tags.includes('earlyAccess')))) && (
          <Chip
            size="small"
            label={product.exclusive || (product.tags||[]).includes('exclusive') ? 'Member Exclusive' : 'Early Access'}
            color={(product.exclusive || (product.tags||[]).includes('exclusive')) ? 'secondary' : 'primary'}
            sx={{ position: 'absolute', top: 8, left: 8 }}
          />
        )}
        <Box
          className="overlay"
          sx={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 1,
            p: 2, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%)',
            opacity: 0, transform: 'translateY(10px)', transition: 'all .25s ease',
          }}
        >
          <Button size="small" variant="contained" onClick={() => onAdd(product)} sx={{ flex: 1 }} disabled={locked}>{locked ? 'Members Only' : 'Quick Add'}</Button>
          <Button size="small" variant="outlined" color="secondary" onClick={() => onQuick(product)} sx={{ flex: 1 }}>Quick View</Button>
        </Box>
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="subtitle1">{product.title}</Typography>
        <Typography variant="body2" color="text.secondary">${product.price.toFixed(2)}</Typography>
      </CardContent>
      <CardActions>
        <Button component={Link} to={`/product/${product.id}`} size="small">View</Button>
        <Button onClick={() => onAdd(product)} size="small" variant="contained" disabled={locked}>{locked ? 'Members Only' : 'Add to Cart'}</Button>
      </CardActions>
    </Card>
  );
}

function ProductsPage() {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [sort, setSort] = React.useState('relevance');
  const [filters, setFilters] = React.useState({ categories: [], brands: [], price: [0, 100], rating: [], color: [], size: [] });
  const [items, setItems] = React.useState([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [available, setAvailable] = React.useState({ categories: [], brands: [] });
  const [quick, setQuick] = React.useState(null);
  const [dataVersion, setDataVersion] = React.useState(0);

  const q = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const categoryAliasMap = {
    // Fashion
    coat: 'Fashion',
    coats: 'Fashion',
    outerwear: 'Fashion',
    jacket: 'Fashion',
    jackets: 'Fashion',
    knitwear: 'Fashion',
    sweater: 'Fashion',
    sweaters: 'Fashion',
    hoodie: 'Fashion',
    hoodies: 'Fashion',
    dress: 'Fashion',
    dresses: 'Fashion',
    shoes: 'Fashion',
    sneaker: 'Fashion',
    sneakers: 'Fashion',
    apparel: 'Fashion',
    clothing: 'Fashion',

    // Electronics
    electronic: 'Electronics',
    electronics: 'Electronics',
    gadget: 'Electronics',
    gadgets: 'Electronics',
    phone: 'Electronics',
    phones: 'Electronics',
    smartphone: 'Electronics',
    smartphones: 'Electronics',
    laptop: 'Electronics',
    laptops: 'Electronics',
    camera: 'Electronics',
    cameras: 'Electronics',

    // Home
    home: 'Home',
    furniture: 'Home',
    decor: 'Home',
    decoration: 'Home',
    kitchen: 'Home',
    living: 'Home',
    'home & living': 'Home',

    // Sports
    sport: 'Sports',
    sports: 'Sports',
    fitness: 'Sports',
    outdoor: 'Sports',
    gear: 'Sports',

    // Beauty
    beauty: 'Beauty',
    skincare: 'Beauty',
    makeup: 'Beauty',
    cosmetics: 'Beauty',
    grooming: 'Beauty',
  };
  const canonicalCategory = React.useMemo(() => {
    const key = (categoryParam || '').toLowerCase();
    return categoryAliasMap[key] || categoryParam;
  }, [categoryParam]);

  const pageSize = 12;

  React.useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetchProducts({ q, filters, sort, page, pageSize }).then((res) => {
      if (ignore) return;
      setItems(res.items);
      setTotalPages(res.totalPages);
      setLoading(false);
      try {
        if (res.items && res.items.length) {
          trackProductImpressions(res.items.map((x) => x.id));
        }
      } catch {}
    });
    return () => { ignore = true; };
  }, [q, JSON.stringify(filters), sort, page, dataVersion]);

  React.useEffect(() => {
    const onUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener('products:updated', onUpdate);
    return () => window.removeEventListener('products:updated', onUpdate);
  }, []);

  React.useEffect(() => {
    fetchFacets().then((f) => setAvailable({ categories: f.categories, brands: f.brands }));
  }, []);

  // Track category and search signals
  React.useEffect(() => {
    if (canonicalCategory) {
      try { trackEvent({ type: 'category_view', category: canonicalCategory }); } catch {}
    }
  }, [canonicalCategory]);
  React.useEffect(() => {
    if ((q || '').trim()) {
      try { trackEvent({ type: 'search', meta: { q: (q || '').trim() } }); } catch {}
    }
  }, [q]);

  // Keep filters in sync with category from URL query (e.g., /products?category=Fashion)
  React.useEffect(() => {
    if (!canonicalCategory) return;
    // Only update if different to avoid reset loops
    const curr = (filters.categories && filters.categories[0]) || '';
    if (curr !== canonicalCategory) {
      setFilters((prev) => ({ ...prev, categories: [canonicalCategory] }));
      setPage(1);
    }
  }, [canonicalCategory]);

  return (
    <Box sx={{ py: 3 }}>
      <FilterSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} filters={filters} setFilters={setFilters} available={available} />
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, px: 1 }}>
        <IconButton onClick={() => setDrawerOpen(true)}><TuneIcon /></IconButton>
        <Typography variant="h6" sx={{ flex: 1 }}>{categoryParam ? `${categoryParam}` : 'Products'}</Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="sort-label">Sort by</InputLabel>
          <Select labelId="sort-label" label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
            <MenuItem value="relevance">Relevance</MenuItem>
            <MenuItem value="priceAsc">Price: Low to High</MenuItem>
            <MenuItem value="priceDesc">Price: High to Low</MenuItem>
            <MenuItem value="rating">Top Rated</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      {!loading && items.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>No products found</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>Try clearing filters or browsing all products.</Typography>
          <Button variant="outlined" onClick={() => { setFilters({ categories: [], brands: [], price: [0, 100], rating: [], color: [], size: [] }); setPage(1); }}>Clear Filters</Button>
        </Box>
      ) : (
      <Grid container spacing={2}>
        {(loading ? Array.from({ length: pageSize }) : items).map((p, idx) => (
          <Grid item key={p?.id || idx} xs={12} sm={6} md={4} lg={3}>
            {loading ? (
              <Card>
                <Skeleton variant="rectangular" sx={{ aspectRatio: '1 / 1' }} />
                <Box sx={{ p: 2 }}>
                  <Skeleton width="70%" />
                  <Skeleton width="45%" />
                </Box>
              </Card>
            ) : (
              <ProductCard 
                product={p}
                locked={((p.exclusive || (p.tags||[]).includes('exclusive')) || (p.earlyAccess || (p.tags||[]).includes('earlyAccess'))) && !isMember(user)}
                onAdd={(prod) => { addItem(prod, 1); trackEvent({ type: 'add_to_cart', productId: prod.id, category: prod.category }); }} 
                onQuick={(prod) => { setQuick(prod); trackEvent({ type: 'quick_view', productId: prod.id, category: prod.category }); }} 
              />
            )}
          </Grid>
        ))}
      </Grid>
      )}
      <Dialog open={Boolean(quick)} onClose={() => setQuick(null)} fullWidth maxWidth="sm">
        <DialogTitle>{quick?.title}</DialogTitle>
        <DialogContent dividers>
          <Box
            component="img"
            src={quick ? getProductImage(quick, { w: 800, h: 600, index: 0 }) : undefined}
            alt={quick?.title || 'preview'}
            loading="lazy"
            onError={(e) => quick && onImgErrorSwap(e, quick, { w: 800, h: 600, index: 0 })}
            sx={{
              borderRadius: 2,
              height: 280,
              width: '100%',
              backgroundColor: 'action.hover',
              objectFit: 'cover',
              mb: 2,
            }}
          />
          <Stack spacing={1}>
            <Rating value={quick?.rating || 4} precision={0.5} readOnly />
            <Typography variant="h6">${quick?.price?.toFixed(2)}</Typography>
            <Typography color="text.secondary">{quick?.description}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button component={Link} to={`/product/${quick?.id}`} onClick={() => setQuick(null)}>View Details</Button>
          <Button variant="contained" onClick={() => { addItem(quick, 1); setQuick(null); }}>Add to Cart</Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Box>

      {/* Recommendations */}
      {/* {!loading && items.length > 0 && (
        <RecommendationsRail excludeIds={items.map(i => i.id)} boost={{ categories: (filters.categories || []) }} />
      )} */}
    </Box>
  );
}

export default ProductsPage;
