import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import { getAllProducts } from 'services/productsStore';
import { getProductImage, onImgErrorSwap } from 'core/utils/imageForProduct';

const STORAGE_KEY = 'home:config';

const defaultConfig = {
  welcomeText: 'Welcome to E-Shop',
  themeMode: 'light', // light | dark | custom
  customPrimaryColor: '#1976d2',
  banner: { image: '', ctaText: 'Discover the latest products', buttonText: 'Shop Now', link: '/products' },
  heroImage: '',
  collectionImage: '',
  featuredProducts: [],
  layoutStyle: 'grid', // grid | list | masonry
  widgets: { newArrivals: true, bestSellers: true, discounts: true, testimonials: false },
};

function loadConfig() {
  try { return { ...defaultConfig, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; } catch { return defaultConfig; }
}

function saveConfig(cfg) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch {}
}

export default function CustomizeHomePage() {
  const [cfg, setCfg] = React.useState(loadConfig());
  const [saved, setSaved] = React.useState(false);
  const [all, setAll] = React.useState(getAllProducts());

  React.useEffect(() => {
    const onUpdate = () => setAll(getAllProducts());
    window.addEventListener('products:updated', onUpdate);
    return () => window.removeEventListener('products:updated', onUpdate);
  }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCfg((c) => ({ ...c, banner: { ...c.banner, image: reader.result } }));
    reader.readAsDataURL(file);
  };

  const onHeroFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setCfg((c) => ({ ...c, heroImage: reader.result })); reader.readAsDataURL(file);
  };
  const onCollectionFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setCfg((c) => ({ ...c, collectionImage: reader.result })); reader.readAsDataURL(file);
  };

  const toggleWidget = (k) => setCfg((c) => ({ ...c, widgets: { ...c.widgets, [k]: !c.widgets[k] } }));

  const save = () => {
    saveConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const productOptions = React.useMemo(() => all.slice(0, 24), [all]);
  const toggleFeatured = (id) => setCfg((c) => ({
    ...c,
    featuredProducts: c.featuredProducts.includes(id)
      ? c.featuredProducts.filter((x) => x !== id)
      : [...c.featuredProducts, id],
  }));

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>✨ Customize Your E-Shop Homepage</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>Changes are saved in your browser and will be visible only on this device.</Alert>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">1. Welcome Message</Typography>
        <TextField fullWidth size="small" sx={{ mt: 1 }} label="Greeting Text" value={cfg.welcomeText} onChange={(e) => setCfg({ ...cfg, welcomeText: e.target.value })} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">2. Theme</Typography>
        <TextField select size="small" label="Mode" sx={{ mt: 1, mr: 2, minWidth: 180 }} value={cfg.themeMode} onChange={(e) => setCfg({ ...cfg, themeMode: e.target.value })}>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </TextField>
        {cfg.themeMode === 'custom' && (
          <TextField type="color" size="small" label="Primary Color" value={cfg.customPrimaryColor}
            onChange={(e) => setCfg({ ...cfg, customPrimaryColor: e.target.value })} sx={{ ml: 2, width: 160 }} />
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">3. Banner Section</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <Button component="label" variant="outlined">Upload Image<input type="file" accept="image/*" hidden onChange={onFile} /></Button>
          <TextField label="CTA Text" size="small" value={cfg.banner.ctaText} onChange={(e) => setCfg({ ...cfg, banner: { ...cfg.banner, ctaText: e.target.value } })} />
          <TextField label="Button Text" size="small" value={cfg.banner.buttonText} onChange={(e) => setCfg({ ...cfg, banner: { ...cfg.banner, buttonText: e.target.value } })} />
          <TextField label="Button Link" size="small" value={cfg.banner.link} onChange={(e) => setCfg({ ...cfg, banner: { ...cfg.banner, link: e.target.value } })} />
        </Stack>
        {cfg.banner.image && (
          <Box sx={{ mt: 2 }}>
            <img src={cfg.banner.image} alt="banner" style={{ maxWidth: '100%', borderRadius: 8 }} />
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">3b. Hero Image</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <Button component="label" variant="outlined">Upload Hero<input type="file" accept="image/*" hidden onChange={onHeroFile} /></Button>
        </Stack>
        {cfg.heroImage && (
          <Box sx={{ mt: 2 }}>
            <img src={cfg.heroImage} alt="hero" style={{ maxWidth: '100%', borderRadius: 8 }} />
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">3c. Collection Banner Image</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <Button component="label" variant="outlined">Upload Collection<input type="file" accept="image/*" hidden onChange={onCollectionFile} /></Button>
        </Stack>
        {cfg.collectionImage && (
          <Box sx={{ mt: 2 }}>
            <img src={cfg.collectionImage} alt="collection" style={{ maxWidth: '100%', borderRadius: 8 }} />
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">4. Featured Products</Typography>
        <Typography variant="body2" color="text.secondary">Select products to highlight on the home page</Typography>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {productOptions.map((p) => {
            const active = cfg.featuredProducts.includes(p.id);
            return (
              <Grid item key={p.id} xs={6} sm={4} md={3}>
                <Paper variant={active ? 'elevation' : 'outlined'} sx={{ p: 1, cursor: 'pointer', borderColor: active ? 'primary.main' : undefined }} onClick={() => toggleFeatured(p.id)}>
                  <img src={getProductImage(p, { w: 160, h: 120 })} alt={p.title} width="100%" height={120} style={{ objectFit: 'cover', borderRadius: 6 }} onError={(e) => onImgErrorSwap(e, p, { w: 160, h: 120 })} />
                  <Typography noWrap variant="caption">{p.title}</Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">5. Layout Style</Typography>
        <TextField select size="small" sx={{ mt: 1, minWidth: 200 }} label="Layout" value={cfg.layoutStyle} onChange={(e) => setCfg({ ...cfg, layoutStyle: e.target.value })}>
          <MenuItem value="grid">Grid</MenuItem>
          <MenuItem value="list">List</MenuItem>
          <MenuItem value="masonry">Masonry</MenuItem>
        </TextField>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">6. Widgets</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          {Object.keys(cfg.widgets).map((k) => (
            <FormControlLabel key={k} control={<Switch checked={cfg.widgets[k]} onChange={() => toggleWidget(k)} />} label={k}
              sx={{ textTransform: 'capitalize' }} />
          ))}
        </Stack>
      </Paper>

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={save}>Save</Button>
        <Button variant="outlined" onClick={() => setCfg(defaultConfig)}>Reset</Button>
      </Stack>
      {saved && <Alert severity="success" sx={{ mt: 2 }}>Saved! Check your homepage.</Alert>}
    </Box>
  );
}
