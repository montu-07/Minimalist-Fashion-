import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, updateOrderStatus, cancelOrder, updateRMAStatus } from 'services/ordersStore';

const STATUS_OPTIONS = ['Pending','Packed','Shipped','Out for Delivery','Delivered','Cancelled'];

function statusColor(s) {
  const x = String(s).toLowerCase();
  if (x === 'delivered') return 'success';
  if (x === 'out for delivery') return 'warning';
  if (x === 'shipped') return 'info';
  if (x === 'packed') return 'primary';
  if (x === 'cancelled' || x === 'failed') return 'error';
  return 'default';
}

export default function OrdersAdminPage() {
  const navigate = useNavigate();
  const [rows, setRows] = React.useState(getAllOrders());

  const refresh = React.useCallback(() => setRows(getAllOrders()), []);

  React.useEffect(() => {
    const onUpd = () => refresh();
    window.addEventListener('orders:updated', onUpd);
    return () => window.removeEventListener('orders:updated', onUpd);
  }, [refresh]);

  const onChangeStatus = (id, status) => {
    updateOrderStatus(id, status);
  };

  const onCancel = (id) => {
    cancelOrder(id);
  };

  const onRMAAction = (id, action) => {
    // action: approve|reject|complete
    const map = { approve: 'approved', reject: 'rejected', complete: 'completed' };
    updateRMAStatus(id, map[action] || 'approved');
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Orders</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>RMA</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.user?.name || r.user?.email || '—'}</TableCell>
                <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell align="right">${r.totals?.total != null ? Number(r.totals.total).toFixed(2) : '0.00'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={r.status} color={statusColor(r.status)} />
                    <Select size="small" value={r.status} onChange={(e) => onChangeStatus(r.id, e.target.value)} sx={{ minWidth: 160 }}>
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </Stack>
                </TableCell>
                <TableCell>
                  {r.rma ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={`${r.rma.type}: ${r.rma.status}`} />
                      {r.rma.status === 'requested' && (
                        <>
                          <Button size="small" onClick={() => onRMAAction(r.id, 'approve')}>Approve</Button>
                          <Button size="small" color="error" onClick={() => onRMAAction(r.id, 'reject')}>Reject</Button>
                        </>
                      )}
                      {r.rma.status === 'approved' && (
                        <Button size="small" onClick={() => onRMAAction(r.id, 'complete')}>Complete</Button>
                      )}
                    </Stack>
                  ) : '—'}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" onClick={() => navigate(`/orders/${r.id}`)}>View</Button>
                    <Button size="small" color="error" disabled={String(r.status).toLowerCase()==='cancelled'} onClick={() => onCancel(r.id)}>Cancel</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
