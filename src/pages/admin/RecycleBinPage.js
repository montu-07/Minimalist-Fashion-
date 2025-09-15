import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import { getRecycleBinItems, restoreProduct, emptyRecycleBin } from 'services/productsStore';

export default function RecycleBinPage() {
  const [rows, setRows] = React.useState([]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setRows(getRecycleBinItems());
  }, []);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    const onUpdated = () => load();
    window.addEventListener('products:updated', onUpdated);
    return () => window.removeEventListener('products:updated', onUpdated);
  }, [load]);

  const doRestore = async (id) => {
    restoreProduct(id);
    load();
  };

  const doEmpty = () => {
    emptyRecycleBin();
    setConfirmOpen(false);
    load();
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Recycle Bin</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)} disabled={!rows.some((r) => !r._tombstone)}>Empty Trash</Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 2 }}>Items you delete can be restored here. Base catalog items appear as tombstones and can be restored by removing the tombstone.</Alert>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell>{r._tombstone ? 'Base (tombstone)' : 'Custom (trash)'}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="contained" onClick={() => doRestore(r.id)}>Restore</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">Recycle bin is empty.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Empty Trash</DialogTitle>
        <DialogContent>
          <Typography>Remove all custom deleted items permanently? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doEmpty}>Empty</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
