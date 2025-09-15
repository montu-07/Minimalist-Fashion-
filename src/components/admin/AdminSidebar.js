import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutline';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import DesignIcon from '@mui/icons-material/DesignServicesOutlined';
import { Link, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

const drawerWidth = 280;
const railWidth = 96;

export default function AdminSidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const items = [
    { to: '/admin', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/admin/products', label: 'Products', icon: <InventoryIcon /> },
    { to: '/admin/orders', label: 'Orders', icon: <ReceiptIcon /> },
    { to: '/admin/users', label: 'Users', icon: <PeopleIcon /> },
    { to: '/admin/recycle-bin', label: 'Recycle Bin', icon: <InventoryIcon /> },
    { to: '/admin/customize-home', label: 'Customize Home', icon: <DesignIcon /> },
    { to: '/admin/settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <>
      {/* Permanent mini rail on desktop to avoid layout shifting */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? open : true}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: railWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: railWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            // Offset below AppBar (56px mobile, 64px desktop); rail only shows on md+
            top: { xs: 56, sm: 64 },
            height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' },
          },
        }}
      >
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Minimalist Fashion Admin</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', md: 'none' } }}>Manage store</Typography>
        </Box>
        <Divider />
        <List sx={{ pt: 0 }} role="navigation" aria-label="Admin Navigation">
          {items.map((it) => {
            const active = pathname === it.to || pathname.startsWith(it.to + '/');
            return (
              <ListItem key={it.to} disablePadding>
                <Tooltip title={it.label} placement="right" arrow>
                  <ListItemButton
                    component={Link}
                    to={it.to}
                    selected={active}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      my: 0.5,
                      justifyContent: 'center',
                      ...(active && {
                        bgcolor: 'action.selected',
                        '&:hover': { bgcolor: 'action.selected' },
                      }),
                    }}
                    aria-current={active ? 'page' : undefined}
                  >
                    <ListItemIcon sx={{ minWidth: 40, mr: 0, justifyContent: 'center' }}>{it.icon}</ListItemIcon>
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Overlay drawer for expanded navigation on desktop, and the normal temporary drawer on mobile */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            // Overlay covers the AppBar for smooth slide-in
            zIndex: (t) => t.zIndex.modal + 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Minimalist Fashion Admin</Typography>
        <Typography variant="caption" color="text.secondary">Manage store</Typography>
      </Box>
      <Divider />
      <List sx={{ pt: 0 }} role="navigation" aria-label="Admin Navigation">
        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + '/');
          return (
            <ListItem key={it.to} disablePadding>
              <Tooltip title={it.label} placement="right" arrow>
                <ListItemButton
                  component={Link}
                  to={it.to}
                  selected={active}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    justifyContent: 'initial',
                    ...(active && {
                      bgcolor: 'action.selected',
                      '&:hover': { bgcolor: 'action.selected' },
                    }),
                  }}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                >
                  <ListItemIcon sx={{ minWidth: 40, mr: 1, justifyContent: 'center' }}>{it.icon}</ListItemIcon>
                  <ListItemText primary={it.label} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      </Drawer>
    </>
  );
}
