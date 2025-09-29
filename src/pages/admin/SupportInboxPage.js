import React from 'react';
import { Box, Typography, Grid, Paper, List, ListItemButton, ListItemText, Stack, Button, TextField, Divider, Chip, MenuItem, Select } from '@mui/material';
import { getAllSessions, getSession, addAgentMessage, closeSession } from 'services/supportChatStore';

export default function SupportInboxPage() {
  const [sessions, setSessions] = React.useState([]);
  const [activeId, setActiveId] = React.useState('');
  const [active, setActive] = React.useState(null);
  const [reply, setReply] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // all|open|escalated|closed

  const load = React.useCallback(() => {
    const all = getAllSessions();
    setSessions(all);
    if (activeId) setActive(getSession(activeId));
  }, [activeId]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    const onUpd = () => load();
    window.addEventListener('support:updated', onUpd);
    return () => window.removeEventListener('support:updated', onUpd);
  }, [load]);

  const filtered = sessions.filter((s) => filter==='all' || s.status === filter);

  const send = () => {
    const m = (reply || '').trim(); if (!m || !activeId) return;
    addAgentMessage(activeId, m, 'Admin');
    setReply('');
  };

  const doClose = () => { if (activeId) closeSession(activeId); };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Support Inbox</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ flex: 1 }}>Conversations</Typography>
              <Select size="small" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="escalated">Escalated</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </Stack>
            <Divider />
            <List dense sx={{ maxHeight: 520, overflow: 'auto' }}>
              {filtered.map((s) => {
                const last = s.messages[s.messages.length - 1];
                return (
                  <ListItemButton key={s.id} selected={activeId === s.id} onClick={() => { setActiveId(s.id); setActive(getSession(s.id)); }}>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2">{s.user?.name || s.user?.email || 'Guest'}</Typography>
                          <Chip size="small" label={s.status} color={s.status==='escalated' ? 'warning' : s.status==='closed' ? 'default' : 'success'} />
                        </Stack>
                      }
                      secondary={<Typography variant="caption" color="text.secondary" noWrap>{last?.text || '—'}</Typography>}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2, minHeight: 600, display: 'flex', flexDirection: 'column' }}>
            {active ? (
              <>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ flex: 1 }}>{active.user?.name || active.user?.email || 'Guest'}</Typography>
                  <Chip size="small" label={active.status} color={active.status==='escalated' ? 'warning' : active.status==='closed' ? 'default' : 'success'} />
                  <Button onClick={doClose} disabled={active.status==='closed'}>Close</Button>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                  {(active.messages || []).map((m) => (
                    <Box key={m.id} sx={{ display: 'flex', justifyContent: m.from==='user' ? 'flex-start' : 'flex-end', my: 0.5 }}>
                      <Box sx={{ maxWidth: '80%', px: 1.25, py: 0.75, borderRadius: 2, bgcolor: m.from==='user' ? 'action.hover' : (m.from==='agent' ? 'secondary.main' : 'primary.main'), color: m.from==='user' ? 'text.primary' : 'common.white' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>{new Date(m.ts).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField fullWidth placeholder="Type a reply…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); }}} />
                  <Button variant="contained" onClick={send}>Send</Button>
                </Stack>
              </>
            ) : (
              <Typography color="text.secondary">Select a conversation to view and reply.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
