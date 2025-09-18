import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { getOrderById, updateOrderStatus, requestRMA } from 'services/ordersStore';
import { useAuth } from 'state/AuthContext';

const STEPS = ['Pending', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = React.useState(() => getOrderById(id));
  const [rmaOpen, setRmaOpen] = React.useState(false);
  const [rmaType, setRmaType] = React.useState('refund');
  const [rmaNote, setRmaNote] = React.useState('');
  const [error, setError] = React.useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const refresh = React.useCallback(() => setOrder(getOrderById(id)), [id]);

  React.useEffect(() => {
    const onUpd = () => refresh();
    window.addEventListener('orders:updated', onUpd);
    return () => window.removeEventListener('orders:updated', onUpd);
  }, [refresh]);

  if (!order) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="warning">Order not found.</Alert>
        <Button component={Link} to="/orders" sx={{ mt: 2 }}>Back to Orders</Button>
      </Box>
    );
  }

  const stepIndex = Math.max(0, STEPS.indexOf(order.status));
  const currency = (n) => (n != null ? `$${Number(n).toFixed(2)}` : '-');

  const printInvoice = () => {
    // Open print dialog for the invoice section
    const el = document.getElementById('invoice-section');
    if (!el) return;
    const w = window.open('', 'PRINT', 'height=700,width=900');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Invoice #${order.id}</title>`);
    w.document.write('<style>body{font-family:Inter,Arial,sans-serif;padding:24px} h2{margin:0 0 8px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px;text-align:left} .right{text-align:right}</style>');
    w.document.write('</head><body>');
    w.document.write(el.outerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const doAdvance = () => {
    if (!isAdmin) return;
    const idx = STEPS.indexOf(order.status);
    if (idx === -1 || idx === STEPS.length - 1) return;
    updateOrderStatus(order.id, STEPS[idx + 1]);
  };

  const submitRMA = () => {
    setError('');
    if (!['refund', 'return', 'exchange'].includes(rmaType)) { setError('Select a valid request type.'); return; }
    requestRMA(order.id, rmaType, rmaNote || undefined);
    setRmaOpen(false);
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Order #{order.id}</Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={order.status} color={order.status === 'Delivered' ? 'success' : 'default'} />
          <Button variant="outlined" onClick={printInvoice}>Download Invoice (PDF)</Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        {isAdmin ? (
          <Stepper activeStep={stepIndex} alternativeLabel>
            {STEPS.map((s) => (
              <Step key={s}><StepLabel>{s}</StepLabel></Step>
            ))}
          </Stepper>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2">Status:</Typography>
            <Chip label={order.status} color={order.status === 'Delivered' ? 'success' : 'default'} size="small" />
          </Box>
        )}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Shipping Address</Typography>
            <Typography variant="body2" color="text.secondary">
              {order.address.firstName} {order.address.lastName}<br />
              {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
              {order.address.city}, {order.address.state} {order.address.zip}<br />
              {order.address.country}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Payment</Typography>
            <Typography variant="body2" color="text.secondary">
              Method: {order.payment.method.toUpperCase()}<br />
              {order.payment.meta?.last4 && <>Card: **** {order.payment.meta.last4}<br /></>}
              {order.payment.meta?.vpa && <>UPI: {order.payment.meta.vpa}<br /></>}
              {order.payment.meta?.bank && <>Bank: {order.payment.meta.bank}<br /></>}
              {order.payment.meta?.wallet && <>Wallet: {order.payment.meta.wallet}<br /></>}
              {order.payment.meta?.paypalEmail && <>PayPal: {order.payment.meta.paypalEmail}<br /></>}
              {order.payment.meta?.stripeEmail && <>Stripe: {order.payment.meta.stripeEmail}<br /></>}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Subtotal: {currency(order.totals?.subtotal)}<br />
              Shipping: {order.totals?.shipping ? currency(order.totals.shipping) : 'Free'}<br />
              Total: <b>{currency(order.totals?.total)}</b>
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Items</Typography>
            {order.items.map((it) => (
              <Stack key={it.id} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="body2">{it.title} × {it.qty}</Typography>
                <Typography variant="body2">{currency(it.price * it.qty)}</Typography>
              </Stack>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          {isAdmin && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Timeline</Typography>
              {order.timeline.map((t, i) => (
                <Typography key={i} variant="body2" color="text.secondary">{new Date(t.ts).toLocaleString()} — {t.status}{t.note ? ` • ${t.note}` : ''}</Typography>
              ))}
              {order.status !== 'Delivered' && (
                <Button size="small" onClick={doAdvance} sx={{ mt: 1 }}>Advance Status</Button>
              )}
            </Paper>
          )}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Need help with this order?</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => { setRmaType('refund'); setRmaOpen(true); }}>Request Refund</Button>
              <Button size="small" variant="outlined" onClick={() => { setRmaType('return'); setRmaOpen(true); }}>Return</Button>
              <Button size="small" variant="outlined" onClick={() => { setRmaType('exchange'); setRmaOpen(true); }}>Exchange</Button>
            </Stack>
            {order.rma && (
              <Alert severity={order.rma.status === 'requested' ? 'info' : order.rma.status === 'approved' ? 'success' : 'warning'} sx={{ mt: 1 }}>
                {order.rma.type.toUpperCase()} — {order.rma.status}
                {order.rma.note ? ` • ${order.rma.note}` : ''}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Printable invoice markup */}
      <div id="invoice-section" style={{ display: 'none' }}>
        <h2>Invoice #{order.id}</h2>
        <div>Date: {new Date(order.createdAt).toLocaleDateString()}</div>
        <hr />
        <div><b>Bill To:</b><br />
          {order.address.firstName} {order.address.lastName}<br />
          {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city}, {order.address.state} {order.address.zip}, {order.address.country}
        </div>
        <br />
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}><td>{it.title}</td><td>{it.qty}</td><td class="right">{currency(it.price)}</td><td class="right">{currency(it.price * it.qty)}</td></tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan="3" class="right">Subtotal</td><td class="right">{currency(order.totals?.subtotal)}</td></tr>
            <tr><td colSpan="3" class="right">Shipping</td><td class="right">{order.totals?.shipping ? currency(order.totals.shipping) : 'Free'}</td></tr>
            <tr><td colSpan="3" class="right"><b>Total</b></td><td class="right"><b>{currency(order.totals?.total)}</b></td></tr>
          </tfoot>
        </table>
      </div>

      <Dialog open={rmaOpen} onClose={() => setRmaOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Request {rmaType.charAt(0).toUpperCase() + rmaType.slice(1)}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Request Type"
              SelectProps={{ native: true }}
              value={rmaType}
              onChange={(e) => setRmaType(e.target.value)}
            >
              <option value="refund">Refund</option>
              <option value="return">Return</option>
              <option value="exchange">Exchange</option>
            </TextField>
            <TextField label="Notes (optional)" value={rmaNote} onChange={(e) => setRmaNote(e.target.value)} multiline minRows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRmaOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitRMA}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
