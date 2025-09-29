import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import MenuIcon from '@mui/icons-material/Menu';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import { useCart } from 'state/CartContext';
import { useWishlist } from 'state/WishlistContext';
import { useColorMode } from 'theme';
import { useNavigate, Link } from 'react-router-dom';
import { useUI } from 'state/UIContext';
import BrandLogo from 'components/BrandLogo';
import { fetchSearchSuggestions, saveRecentSearch } from 'services/searchApi';
import { useAuth } from 'state/AuthContext';
import NotificationCenter from 'components/notifications/NotificationCenter';

function Header() {
  const { items } = useCart();
  const { items: wish } = useWishlist();
  const { toggleColorMode, mode } = useColorMode();
  const navigate = useNavigate();
  const { setMiniCartOpen } = useUI();
  const { user, logout } = useAuth();
  const [menuEl, setMenuEl] = React.useState(null);
  const [catEl, setCatEl] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [q, setQ] = React.useState('');
  const [options, setOptions] = React.useState([]);

  const goSearch = (query) => {
    const val = (query || '').trim();
    if (!val) return;
    saveRecentSearch(val);
    navigate(`/products?q=${encodeURIComponent(val)}`);
  };

  React.useEffect(() => {
    let ignore = false;
    const t = setTimeout(() => {
      fetchSearchSuggestions(q).then(({ suggestions, popular }) => {
        if (ignore) return;
        setOptions(suggestions.length ? suggestions : popular);
      });
    }, 200);
    return () => { ignore = true; clearTimeout(t); };
  }, [q]);

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{
      borderBottom: '1px solid', borderColor: 'divider',
      backdropFilter: 'saturate(180%) blur(8px)',
    }}>
      <Toolbar sx={{ gap: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton edge="start" sx={{ display: { xs: 'inline-flex', md: 'none' } }} aria-label="menu" onClick={() => setMobileOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Box component={Link} to="/" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { opacity: 0.9 } }} aria-label="Minimalist Fashion home">
            <BrandLogo size={26} withWordmark />
          </Box>
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          <Button
            startIcon={<CategoryIcon />}
            color="inherit"
            onClick={(e) => setCatEl(e.currentTarget)}
            aria-haspopup="true"
            aria-controls={catEl ? 'categories-menu' : undefined}
            aria-expanded={Boolean(catEl) ? 'true' : undefined}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 1.5,
              '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.06), transform: 'translateY(-1px)' },
              transition: 'all 150ms ease',
            }}
          >
            Shop
          </Button>
          <Menu id="categories-menu" anchorEl={catEl} open={Boolean(catEl)} onClose={() => setCatEl(null)} MenuListProps={{ 'aria-labelledby': 'categories-button' }}>
            <MenuItem component={Link} to="/products?category=fashion" onClick={() => setCatEl(null)}>Fashion</MenuItem>
            <MenuItem component={Link} to="/products?category=beauty" onClick={() => setCatEl(null)}>Beauty</MenuItem>
            <MenuItem component={Link} to="/products?category=electronics" onClick={() => setCatEl(null)}>Electronics</MenuItem>
            <MenuItem component={Link} to="/products?category=Home" onClick={() => setCatEl(null)}>Home & Living</MenuItem>
          </Menu>
          <Button
            component={Link}
            to="/track-order"
            color="inherit"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 1.5,
              '&:hover': { bgcolor: (t) => alpha(t.palette.text.primary, 0.06), transform: 'translateY(-1px)' },
              transition: 'all 150ms ease',
            }}
          >
            Track Order
          </Button>
        </Box>
        <Box sx={{ flex: 1, display: { xs: 'none', sm: 'flex' } }}>
          <Autocomplete
            freeSolo
            options={options}
            inputValue={q}
            onInputChange={(_, v) => setQ(v)}
            onChange={(_, val) => val && goSearch(val)}
            sx={{ width: '50%' }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search products..."
                size="small"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    goSearch(q);
                  }
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: (t) => alpha(t.palette.common.white, 0.15),
                    '&:hover': { backgroundColor: (t) => alpha(t.palette.common.white, 0.25) },
                    '& fieldset': { borderColor: "lightgrey" },
                    color: 'inherit',
                  },
                }}
              />
            )}
          />
        </Box>
        {!user ? (
          <Button color="inherit" component={Link} to="/login">Sign in</Button>
        ) : (
          <>
            <IconButton color="inherit" onClick={(e) => setMenuEl(e.currentTarget)} aria-label="account">
              <Avatar
                src={user?.avatar || undefined}
                sx={{ width: 32, height: 32, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}
              >
                {(!user?.avatar) && (user.name || user.email || 'U').slice(0, 1).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={() => setMenuEl(null)}>
              <MenuItem component={Link} to="/profile" onClick={() => setMenuEl(null)}>Profile</MenuItem>
              <MenuItem onClick={() => { setMenuEl(null); logout(); navigate('/'); }}>Logout</MenuItem>
            </Menu>
          </>
        )}
        <IconButton color="inherit" onClick={toggleColorMode} aria-label="toggle theme" sx={{
          transition: 'transform 120ms ease',
          '&:hover': { transform: 'translateY(-1px)' },
        }}>
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
        <Tooltip title="Wishlist">
          <IconButton component={Link} to="/wishlist" color="inherit" aria-label="Wishlist">
            <Badge badgeContent={wish.length} color="error">
              <FavoriteIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <Tooltip title="Notifications">
          <Box>
            <NotificationCenter />
          </Box>
        </Tooltip>
        <IconButton color="inherit" aria-label="cart" onClick={() => setMiniCartOpen(true)} sx={{
          transition: 'transform 120ms ease',
          '&:hover': { transform: 'translateY(-1px)' },
        }}>
          <Badge badgeContent={items.reduce((n, i) => n + i.qty, 0)} color="secondary">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </Toolbar>
      {/* Mobile Drawer */}
      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}>
        <Box sx={{ width: 300, p: 2 }} role="presentation">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BrandLogo size={22} withWordmark />
            </Box>
            <Tooltip title="Close"><IconButton onClick={() => setMobileOpen(false)}><MenuIcon /></IconButton></Tooltip>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              freeSolo
              options={options}
              inputValue={q}
              onInputChange={(_, v) => setQ(v)}
              onChange={(_, val) => { if (val) { goSearch(val); setMobileOpen(false); } }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search products..."
                  size="small"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      goSearch(q);
                      setMobileOpen(false);
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              )}
            />
          </Box>
          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/products" onClick={() => setMobileOpen(false)}>
                <ListItemIcon><CategoryIcon /></ListItemIcon>
                <ListItemText primary="Shop" />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1 }} />
            {!user ? (
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/login" onClick={() => setMobileOpen(false)}>
                  <ListItemText primary="Sign in" />
                </ListItemButton>
              </ListItem>
            ) : (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/profile" onClick={() => setMobileOpen(false)}>
                    <ListItemText primary="Profile" />
                  </ListItemButton>
                </ListItem>
                
                <ListItem disablePadding>
                  <ListItemButton onClick={() => { setMobileOpen(false); logout(); navigate('/'); }}>
                    <ListItemText primary="Logout" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default Header;
