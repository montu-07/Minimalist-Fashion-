import React from 'react';
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { getOrCreateSession, addUserMessage, escalate } from 'services/supportChatStore';
import { useAuth } from 'state/AuthContext';
import { useCart } from 'state/CartContext';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import { Link } from 'react-router-dom';

export default function SupportChatWidget() {
  const { user } = useAuth?.() || { user: null };
  const [open, setOpen] = React.useState(false);
  const [session, setSession] = React.useState(() => getOrCreateSession(user));
  const [text, setText] = React.useState('');
  const [unread, setUnread] = React.useState(0);
  const { addItem } = useCart();

  const refresh = React.useCallback(() => {
    try { setSession(getOrCreateSession(user)); } catch {}
  }, [user]);

  React.useEffect(() => {
    const onUpd = () => refresh();
    window.addEventListener('support:updated', onUpd);
    return () => window.removeEventListener('support:updated', onUpd);
  }, [refresh]);

  React.useEffect(() => {
    if (!open) {
      const botCount = (session?.messages || []).filter(m => m.from !== 'user').length;
      setUnread(botCount);
    } else {
      setUnread(0);
    }
  }, [open, session?.messages?.length]);

  const send = () => {
    const msg = text.trim();
    if (!msg) return;
    addUserMessage(session.id, msg);
    setText('');
    setTimeout(() => {
      const el = document.getElementById('support-chat-scroll');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  };

  const doEscalate = () => {
    escalate(session.id);
  };

  const onAction = (payload) => {
    if (!payload) return;
    // Handle special actions locally, otherwise send as text
    if (payload === 'escalate') { doEscalate(); return; }
    if (payload.startsWith('open order')) {
      const id = payload.split(' ').pop();
      window.open(`/orders/${id}`, '_self');
      return;
    }
    addUserMessage(session.id, payload);
  };

  const renderMessage = (m) => {
    if (m.type === 'cards' && Array.isArray(m.items)) {
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
          {m.items.map((p) => (
            <Card key={p.id} variant="outlined" sx={{ overflow: 'hidden' }}>
              {p.image && (
                <CardMedia component="img" image={p.image} alt={p.title} sx={{ height: 120, objectFit: 'cover' }} />
              )}
              <CardContent sx={{ py: 1 }}>
                <Typography variant="subtitle2" noWrap>{p.title}</Typography>
                <Typography variant="caption" color="text.secondary">${Number(p.price).toFixed(2)}</Typography>
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
                <Button component={Link} to={`/product/${p.id}`} size="small">View</Button>
                <Button size="small" variant="contained" onClick={() => addItem({ id: p.id, title: p.title, price: p.price }, 1)}>Add</Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      );
    }
    if (m.type === 'actions' && Array.isArray(m.actions)) {
      return (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {m.actions.map((a) => (
            <Button key={a.id} size="small" variant="outlined" onClick={() => onAction(a.payload)}>{a.label}</Button>
          ))}
        </Stack>
      );
    }
    // default text
    return (
      <ListItemText
        primary={<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>}
        secondary={<Typography variant="caption" sx={{ opacity: 0.8 }}>{new Date(m.ts).toLocaleTimeString()}</Typography>}
      />
    );
  };

  const messages = session?.messages || [];
  return (
    <>
      <Tooltip title="Chat with us">
        <Badge color="secondary" badgeContent={unread} invisible={!unread} overlap="circular" sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1300 }}>
          <Fab color="primary" aria-label="support" onClick={() => setOpen(true)}>
            <ChatIcon />
          </Fab>
        </Badge>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SupportAgentIcon />
            <Typography variant="subtitle1">Support</Typography>
            <Chip size="small" label={session?.status || 'open'} color={session?.status==='escalated' ? 'warning' : session?.status==='closed' ? 'default' : 'success'} />
          </Stack>
          <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box id="support-chat-scroll" sx={{ maxHeight: 380, overflow: 'auto' }}>
            <List dense>
              {messages.map((m) => (
                <ListItem key={m.id} sx={{ justifyContent: m.from==='user' ? 'flex-end' : 'flex-start' }}>
                  <Box sx={{ px: 1.25, py: 0.75, borderRadius: 2, bgcolor: m.from==='user' ? 'primary.main' : (m.from==='agent' ? 'secondary.main' : 'action.hover'), color: m.from==='user' || m.from==='agent' ? 'common.white' : 'text.primary', maxWidth: '100%', minWidth: { xs: '60%', sm: '50%' } }}>
                    {renderMessage(m)}
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              placeholder="Type your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <IconButton color="primary" onClick={send}><SendIcon /></IconButton>
                </InputAdornment>
              )}}
            />
            <Button variant="outlined" onClick={doEscalate} disabled={session?.status==='escalated'}>Escalate</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
