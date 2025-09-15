import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { getAllProducts } from 'services/productsStore';
import herobanner from "../assests/images/herobanner.jpg";
import collection from "../assests/images/collection.jpg";
import Lifestyle from "../assests/images/Lifestyle Section.jpg";
import { getProductImage, onImgErrorSwap } from 'core/utils/imageForProduct';
import BrandLogo from 'components/BrandLogo';
import LookbookSlider from 'components/lookbook/LookbookSlider';

const STORAGE_KEY = 'home:config';

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function HomePage() {
  const theme = useTheme();
  const [cfg, setCfg] = React.useState(loadConfig());
  const [all, setAll] = React.useState(getAllProducts());

  React.useEffect(() => {
    const onUpdate = () => setAll(getAllProducts());
    window.addEventListener('products:updated', onUpdate);
    return () => window.removeEventListener('products:updated', onUpdate);
  }, []);

  React.useEffect(() => {
    const onStorage = () => setCfg(loadConfig());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const primarySx = cfg.themeMode === 'custom' ? { bgcolor: cfg.customPrimaryColor, '&:hover': { filter: 'brightness(0.9)' } } : undefined;

  const featured = React.useMemo(() => {
    if (!Array.isArray(cfg.featuredProducts) || !cfg.featuredProducts.length) return [];
    const set = new Set(cfg.featuredProducts);
    return all.filter((p) => set.has(p.id));
  }, [cfg.featuredProducts, all]);

  const newArrivals = React.useMemo(() => {
    const tagged = all.filter((p) => Array.isArray(p.tags) && p.tags.includes('new'));
    if (tagged.length) return tagged.slice(0, 8);
    // Fallback: newest by createdAt or last added
    return [...all].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8);
  }, [all]);
  const bestSellers = React.useMemo(() => [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8), [all]);
  const discounts = React.useMemo(() => all.filter((p) => p.price <= 30).slice(0, 8), [all]);

  const renderProducts = (items) => (
    <Grid container spacing={3}>
      {items.map((p) => (
        <Grid key={p.id} item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 3 }}>
            <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <img
                src={getProductImage(p, { w: 900, h: 1200 })}
                alt={p.title}
                width="100%"
                height={280}
                style={{ objectFit: 'cover' }}
                onError={(e) => onImgErrorSwap(e, p, { w: 900, h: 1200 })}
              />
            </Box>
            <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 600 }} noWrap>
              {p.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">${p.price}</Typography>
            <Box sx={{ mt: 1.5 }}>
              <Button size="small" component={Link} to={`/product/${p.id}`} variant="text">
                View
              </Button>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ bgcolor: theme.palette.mode === 'light' ? '#FFFFFF' : 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 520, md: 640 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'common.white',
          overflow: 'hidden',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="img"
          src={cfg.heroImage || herobanner}
          alt="Hero"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'grayscale(10%)',
            transform: 'scale(1.02)',
          }}
        />
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.25)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Centered overlay slightly below mid to align under collection text */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: { xs: '56%', md: '62%' },
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              width: '100%',
              px: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              pointerEvents: 'none',
            }}
          >
            {(cfg.banner?.showHeading ?? true) && (
              <Typography
                variant="h1"
                sx={{
                  mr: 2.5,
                  mb: 40,
                  color: 'common.white',
                  textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                  letterSpacing: { xs: 0, md: 0.5 },
                }}
              >
                {cfg.banner?.heading || 'Minimalist Fashion'}
              </Typography>
            )}
            <Button
              component={Link}
              to="/products"
              variant="contained"
              size="large"
              sx={{  borderRadius: 999, pointerEvents: 'auto' }}
            >
              {cfg.banner?.buttonText || 'Shop Now'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* New Arrivals */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h2">New Arrivals</Typography>
          <Button component={Link} to="/products" variant="text">View all</Button>
        </Stack>
        {renderProducts(newArrivals)}
        <Box sx={{ mt: 4 }}>
          <LookbookSlider />
        </Box>
      </Container>

      {/* Collection Banner */}
      <Container maxWidth="lg" sx={{ pb: { xs: 5, md: 7 } }}>
        <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
          <Box
            component="img"
            src={cfg.collectionImage || collection}
            alt="Collection"
            sx={{ width: '100%', height: { xs: 260, md: 360 }, objectFit: 'cover', filter: 'grayscale(12%)' }}
          />
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.25)' }} />
          <Stack spacing={1} sx={{ position: 'absolute', left: { xs: 16, md: 32 }, bottom: { xs: 16, md: 24 }, color: 'common.white' }}>
            <Typography variant="h2" sx={{ letterSpacing: 6 }}>COLLECTION</Typography>
            <Button component={Link} to="/products" variant="contained" size="medium" sx={{ width: 'fit-content', borderRadius: 999 }}>View</Button>
          </Stack>
        </Box>
      </Container>

      {/* Editorial / Lifestyle Section */}
      <Container maxWidth="lg" sx={{ pb: { xs: 5, md: 7 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ borderRadius: 3, overflow: 'hidden', height: { xs: 280, md: 420 } }}>
              <Box
                component="img"
                src={Lifestyle}
                alt="Editorial 1"
                sx={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(8%)' }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2} sx={{ height: '100%', justifyContent: 'center' }}>
              <Typography variant="h2">Twice as Cozy</Typography>
              <Typography variant="body1" color="text.secondary">
                Discover elevated textures and refined silhouettes crafted for comfort and intention. Layer softly, move freely, and live beautifully.
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button component={Link} to="/products?category=coats" variant="outlined">Shop Coats</Button>
                <Button component={Link} to="/products?category=knitwear" variant="text">Shop Knitwear</Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Minimal Footer */}
      <Divider />
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <BrandLogo size={24} withWordmark />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Modern essentials with a luxury touch.</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>About Us</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary" component={Link} to="/about" style={{ textDecoration: 'none' }}>Our Story</Typography>
              <Typography variant="body2" color="text.secondary" component={Link} to="/sustainability" style={{ textDecoration: 'none' }}>Sustainability</Typography>
            </Stack>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Customer Service</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary" component={Link} to="/help" style={{ textDecoration: 'none' }}>Help Center</Typography>
              <Typography variant="body2" color="text.secondary" component={Link} to="/shipping" style={{ textDecoration: 'none' }}>Shipping & Returns</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Contact</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">support@example.com</Typography>
              <Typography variant="body2" color="text.secondary">Terms • Privacy</Typography>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default HomePage;
