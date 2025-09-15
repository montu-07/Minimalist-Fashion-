import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { ENV, API_ROUTES } from 'core/config/env';

// Lightweight editorial lookbook slider with scroll-snap and programmatic controls
// Usage: <LookbookSlider slides={[{ src, title, subtitle }]}/>
export default function LookbookSlider({ slides = [], autoplay = true, intervalMs = 3500 }) {
  const ref = React.useRef(null);
  const navigate = useNavigate();
  const [hover, setHover] = React.useState(false);
  const [data, setData] = React.useState(() => (slides && slides.length ? slides : []));

  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollBy({ left: dir * Math.max(320, Math.round(w * 0.85)), behavior: 'smooth' });
  };

  // Optional backend fetch with cache
  React.useEffect(() => {
    if (slides && slides.length) { setData(slides); return; }
    const CACHE_KEY = 'lookbook:slides';
    const TTL = 24 * 60 * 60 * 1000; // 24h
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && (Date.now() - cached.ts < TTL) && Array.isArray(cached.items)) {
        setData(cached.items);
      }
    } catch {}
    const base = ENV.API_BASE_URL;
    if (!base) { setData((prev) => (prev && prev.length ? prev : defaultSlides)); return; }
    const url = base.replace(/\/$/, '') + API_ROUTES.lookbook;
    fetch(url)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('lookbook fetch failed')))
      .then((json) => {
        const items = Array.isArray(json) ? json : (Array.isArray(json?.items) ? json.items : []);
        if (items.length) {
          setData(items);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items })); } catch {}
        } else {
          setData(defaultSlides);
        }
      })
      .catch(() => setData(defaultSlides));
  }, [slides]);

  // Autoplay with pause on hover
  React.useEffect(() => {
    if (!autoplay) return;
    let id;
    const tick = () => { if (!hover) scrollBy(1); };
    id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [hover, autoplay, intervalMs]);

  return (
    <Box sx={{ position: 'relative' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h2">Lookbook</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => scrollBy(-1)} aria-label="previous" size="small" sx={navBtnSx}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
          <IconButton onClick={() => scrollBy(1)} aria-label="next" size="small" sx={navBtnSx}><ArrowForwardIosIcon fontSize="small" /></IconButton>
        </Stack>
      </Stack>
      <Box
        ref={ref}
        sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: { xs: '80%', sm: '60%', md: '40%' },
          gap: 2,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          pb: 1,
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-thumb': { bgcolor: (t) => alpha(t.palette.text.primary, 0.2), borderRadius: 8 },
        }}
      >
        {data.map((s, i) => (
          <Box key={i} sx={{ position: 'relative', scrollSnapAlign: 'start', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box
              component="img"
              src={s.src}
              alt={s.title || `Look ${i + 1}`}
              loading="lazy"
              style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }}
            />
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)' }} />
            <Box sx={{ position: 'absolute', left: 16, bottom: 16, color: 'common.white' }}>
              {s.title && <Typography variant="h5" sx={{ textShadow: '0 2px 6px rgba(0,0,0,.35)' }}>{s.title}</Typography>}
              {s.subtitle && <Typography variant="body2" sx={{ opacity: 0.9 }}>{s.subtitle}</Typography>}
              {(s.ctaText || s.to) && (
                <Button
                  size="small"
                  variant="contained"
                  sx={{ mt: 1, borderRadius: 999 }}
                  onClick={() => {
                    if (s.onClick) return s.onClick();
                    if (s.to) return navigate(s.to);
                    if (s.category) return navigate(`/products?category=${encodeURIComponent(s.category)}`);
                  }}
                >
                  {s.ctaText || 'Shop the look'}
                </Button>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const navBtnSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
};

const defaultSlides = [
  {
    src: 'https://images.unsplash.com/photo-1503342217505-b0a15cf70489?q=80&w=1200&auto=format&fit=crop',
    title: 'Soft Layers',
    subtitle: 'Tonal knitwear and subtle textures',
    category: 'knitwear',
    ctaText: 'Shop knitwear',
  },
  {
    src: 'https://images.unsplash.com/photo-1520975922284-9ce8a0a2f0ee?q=80&w=1200&auto=format&fit=crop',
    title: 'City Classics',
    subtitle: 'Tailored coats and everyday essentials',
    category: 'coats',
    ctaText: 'Shop coats',
  },
  {
    src: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop',
    title: 'Monochrome Edit',
    subtitle: 'Minimalist silhouettes in black and white',
    to: '/products?category=apparel',
    ctaText: 'Explore apparel',
  },
  {
    src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop',
    title: 'Weekend Ease',
    subtitle: 'Relaxed fits for long days out',
    to: '/products?category=shoes',
    ctaText: 'Shop shoes',
  },
];
