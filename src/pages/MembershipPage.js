import React from 'react';
import { Box, Typography, Grid, Paper, Stack, Button, List, ListItem, ListItemIcon, ListItemText, Alert } from '@mui/material';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import { getPlans, subscribe, getMembership } from 'services/memberships';
import { useAuth } from 'state/AuthContext';

export default function MembershipPage() {
  const { user } = useAuth();
  const [plans, setPlans] = React.useState(getPlans());
  const [sub, setSub] = React.useState(() => getMembership(user));
  const [message, setMessage] = React.useState('');

  React.useEffect(() => { setSub(getMembership(user)); }, [user]);

  const onSubscribe = (id) => {
    try {
      subscribe(id, user);
      setSub(getMembership(user));
      setMessage('Membership activated! Benefits apply automatically at checkout.');
      setTimeout(() => setMessage(''), 4000);
    } catch (e) {
      setMessage(e.message || 'Failed to subscribe.');
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Membership Plans</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Enjoy free delivery, early access to sales, member discounts, and exclusive collections.</Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {sub && (
        <Alert severity="info" sx={{ mb: 2 }}>You have an active membership (plan: {sub.planId}). Expires on {new Date(sub.expiresAt).toLocaleDateString()}.</Alert>
      )}
      <Grid container spacing={3}>
        {plans.map((p) => (
          <Grid key={p.id} item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Stack spacing={1.5}>
                <Typography variant="h5">{p.name}</Typography>
                <Typography variant="h6">${p.price} / {p.interval}</Typography>
                <List dense>
                  {p.perks.map((perk, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28, color: 'primary.main' }}><CheckIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={<Typography variant="body2">{perk}</Typography>} />
                    </ListItem>
                  ))}
                </List>
                <Box>
                  <Button variant="contained" onClick={() => onSubscribe(p.id)} disabled={sub && sub.planId === p.id}> {sub && sub.planId === p.id ? 'Current Plan' : 'Subscribe'} </Button>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
