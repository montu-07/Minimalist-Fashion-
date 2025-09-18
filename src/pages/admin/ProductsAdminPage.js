import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIos';
import { getAllProducts, upsertProduct, removeProduct as storeRemove } from 'services/productsStore';
import BulkProductUploadDialog from 'components/admin/BulkProductUploadDialog';

export default function ProductsAdminPage() {
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState(getAllProducts().slice(0, 50));
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ 
    id: '', title: '', price: '', brand: '', category: '', categoriesText: '', 
    images: [], image: '', description: '', stock: '', sku: '', 
    specs: [{ key: '', value: '' }]
  });
  const [errors, setErrors] = React.useState({});
  const [primaryImageIndex, setPrimaryImageIndex] = React.useState(0);
  const [confirm, setConfirm] = React.useState({ open: false, row: null });
  const [orderBy, setOrderBy] = React.useState('title');
  const [order, setOrder] = React.useState('asc'); // 'asc' | 'desc'
  const [bulkOpen, setBulkOpen] = React.useState(false);

  const filtered = rows.filter(r => r.title.toLowerCase().includes(q.toLowerCase()));
  const comparator = React.useCallback((a, b) => {
    const dir = order === 'asc' ? 1 : -1;
    const get = (r) => {
      if (orderBy === 'price') return Number(r.price) || 0;
      return String(r[orderBy] || '').toLowerCase();
    };
    const va = get(a); const vb = get(b);
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  }, [order, orderBy]);
  const sorted = React.useMemo(() => [...filtered].sort(comparator), [filtered, comparator]);

  const handleSort = (key) => {
    if (orderBy === key) setOrder((p) => (p === 'asc' ? 'desc' : 'asc'));
    else { setOrderBy(key); setOrder('asc'); }
  };

  const openCreate = () => {
    setForm({ id: '', title: '', price: '', brand: '', category: '', categoriesText: '', images: [], image: '', description: '', stock: '', sku: '', specs: [{ key: '', value: '' }] });
    setErrors({});
    setPrimaryImageIndex(0);
    setOpen(true);
  };

  const save = () => {
    // validations
    const nextErr = {};
    if (!form.title.trim()) nextErr.title = 'Title is required';
    if (form.price === '' || isNaN(Number(form.price))) nextErr.price = 'Enter a valid price';
    if (form.stock !== '' && isNaN(Number(form.stock))) nextErr.stock = 'Enter a valid stock number';
    const sku = (form.sku || '').trim();
    if (sku) {
      const exists = getAllProducts().some((p) => String(p.sku || '').toLowerCase() === sku.toLowerCase() && String(p.id) !== String(form.id || ''));
      if (exists) nextErr.sku = 'SKU must be unique';
    }
    setErrors(nextErr);
    if (Object.keys(nextErr).length) return;
    const id = form.id || Date.now();
    // categories from categoriesText (comma/pipe separated) -> array
    const categories = (form.categoriesText || form.category || '')
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const images = Array.isArray(form.images) && form.images.length
      ? form.images
      : (form.image ? [form.image] : []);
    // normalize specs: only non-empty
    const specs = (form.specs || []).filter((s) => s.key && s.value);
    const primaryIdx = Math.min(Math.max(primaryImageIndex, 0), Math.max(images.length - 1, 0));
    const payload = {
      id,
      title: form.title,
      price: Number(form.price),
      brand: form.brand || '',
      category: categories[0] || form.category || '',
      categories,
      images,
      image: images[primaryIdx] || images[0] || '',
      description: form.description || '',
      stock: form.stock !== '' ? Number(form.stock) : undefined,
      sku: form.sku || '',
      specs,
    };
    upsertProduct(payload);
    // Refresh from store to reflect latest state
    setRows(getAllProducts().slice(0, 50));
    setOpen(false);
  };

  const edit = (r) => {
    const categories = r.categories || (r.category ? [r.category] : []);
    const images = r.images || (r.image ? [r.image] : []);
    const specs = Array.isArray(r.specs) && r.specs.length ? r.specs : [{ key: '', value: '' }];
    setForm({ 
      id: r.id, 
      title: r.title, 
      price: r.price, 
      brand: r.brand || '', 
      category: r.category || '', 
      categoriesText: categories.join(', '),
      images, 
      image: r.image || '', 
      description: r.description || '', 
      stock: r.stock ?? '',
      sku: r.sku || '',
      specs,
    });
    const idx = Math.max(0, images.findIndex((img) => img === (r.image || '')));
    setPrimaryImageIndex(idx === -1 ? 0 : idx);
    setErrors({});
    setOpen(true);
  };

  const remove = (id) => {
    storeRemove(id);
    setRows(getAllProducts().slice(0, 50));
  };

  const onFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const readers = files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then((results) => {
      setForm((f) => ({ ...f, images: [...(f.images || []), ...results] }));
    });
  };

  const moveImage = (from, to) => {
    setForm((f) => {
      const imgs = [...(f.images || [])];
      if (to < 0 || to >= imgs.length) return f;
      const [it] = imgs.splice(from, 1);
      imgs.splice(to, 0, it);
      let nextPrimary = primaryImageIndex;
      if (from === primaryImageIndex) nextPrimary = to;
      else if (from < primaryImageIndex && to >= primaryImageIndex) nextPrimary -= 1;
      else if (from > primaryImageIndex && to <= primaryImageIndex) nextPrimary += 1;
      setPrimaryImageIndex(Math.max(0, Math.min(nextPrimary, imgs.length - 1)));
      return { ...f, images: imgs };
    });
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
        <Typography variant="h6">Products</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box>
            <TextField size="small" placeholder="Search products in this table" value={q} onChange={e => setQ(e.target.value)} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>This search filters the products table only.</Typography>
          </Box>
          <Button variant="outlined" onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
          <Button variant="contained" onClick={openCreate}>New Product</Button>
        </Stack>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={72}>Image</TableCell>
              <TableCell sortDirection={orderBy === 'title' ? order : false}>
                <TableSortLabel active={orderBy === 'title'} direction={order} onClick={() => handleSort('title')}>Title</TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'brand' ? order : false}>
                <TableSortLabel active={orderBy === 'brand'} direction={order} onClick={() => handleSort('brand')}>Brand</TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'category' ? order : false}>
                <TableSortLabel active={orderBy === 'category'} direction={order} onClick={() => handleSort('category')}>Category</TableSortLabel>
              </TableCell>
              <TableCell align="right" width={100}>Stock</TableCell>
              <TableCell align="right" width={120} sortDirection={orderBy === 'price' ? order : false}>
                <TableSortLabel active={orderBy === 'price'} direction={order} onClick={() => handleSort('price')}>Price</TableSortLabel>
              </TableCell>
              <TableCell align="right" width={160}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>
                  {r.image ? (
                    <Box component="img" src={r.image} alt={r.title} sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
                  ) : (
                    <Box sx={{ width: 40, height: 40, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" noWrap title={r.title}>{r.title}</Typography>
                </TableCell>
                <TableCell>
                  <TextField
                    variant="standard"
                    value={r.brand || ''}
                    onChange={(e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, brand: e.target.value } : x))}
                    onBlur={() => upsertProduct(rows.find(x => x.id === r.id))}
                    placeholder="-"
                    inputProps={{ 'aria-label': 'brand' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }} noWrap title={r.category}>{r.category || '-'}</Typography>
                </TableCell>
                <TableCell align="right">
                  <TextField
                    variant="standard"
                    value={r.stock ?? ''}
                    onChange={(e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, stock: e.target.value } : x))}
                    onBlur={() => upsertProduct(rows.find(x => x.id === r.id))}
                    inputProps={{ inputMode: 'numeric', style: { textAlign: 'right' }, 'aria-label': 'stock' }}
                    placeholder="0"
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    variant="standard"
                    value={r.price}
                    onChange={(e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, price: e.target.value } : x))}
                    onBlur={() => upsertProduct(rows.find(x => x.id === r.id))}
                    inputProps={{ inputMode: 'numeric', step: '0.01', style: { textAlign: 'right' }, 'aria-label': 'price' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="contained" onClick={() => edit(r)}>Edit</Button>
                    <Button size="small" variant="contained" color="error" onClick={() => setConfirm({ open: true, row: r })}>Delete</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{form.id ? 'Edit Product' : 'New Product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth error={!!errors.title} helperText={errors.title} />
              <TextField label="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} sx={{ minWidth: 200 }} error={!!errors.sku} helperText={errors.sku} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Brand" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} fullWidth />
              <TextField label="Category (primary)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} fullWidth />
            </Stack>
            <TextField label="Categories (comma or | separated)" value={form.categoriesText} onChange={e => setForm({ ...form, categoriesText: e.target.value })} fullWidth />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Price" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} fullWidth error={!!errors.price} helperText={errors.price} />
              <TextField label="Stock" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} fullWidth error={!!errors.stock} helperText={errors.stock} />
            </Stack>
            <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth multiline minRows={3} />

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">Images</Typography>
            <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap">
              {(form.images || []).map((img, idx) => (
                <Box key={idx} sx={{ position: 'relative', mr: 1, mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box component="img" src={img} alt={`img-${idx}`} sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
                  <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 0.5 }}>
                    <IconButton size="small" onClick={() => moveImage(idx, idx - 1)} aria-label="move-left"><ArrowBackIcon fontSize="inherit" /></IconButton>
                    <IconButton size="small" onClick={() => moveImage(idx, idx + 1)} aria-label="move-right"><ArrowForwardIcon fontSize="inherit" /></IconButton>
                  </Stack>
                  <FormControlLabel control={<Radio checked={primaryImageIndex === idx} onChange={() => setPrimaryImageIndex(idx)} />} label={primaryImageIndex === idx ? 'Primary' : 'Set Primary'} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Button size="small" color="error" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}>Remove</Button>
                  </Box>
                </Box>
              ))}
              <Button component="label" variant="outlined">Upload Images<input type="file" accept="image/*" hidden multiple onChange={onFile} /></Button>
            </Stack>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">Specifications</Typography>
            <Stack spacing={1}>
              {(form.specs || []).map((s, i) => (
                <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <TextField label="Key" value={s.key} onChange={(e) => setForm((f) => ({ ...f, specs: f.specs.map((x, ix) => ix === i ? { ...x, key: e.target.value } : x) }))} fullWidth />
                  <TextField label="Value" value={s.value} onChange={(e) => setForm((f) => ({ ...f, specs: f.specs.map((x, ix) => ix === i ? { ...x, value: e.target.value } : x) }))} fullWidth />
                  <Button color="error" onClick={() => setForm((f) => ({ ...f, specs: f.specs.filter((_, ix) => ix !== i) }))}>Remove</Button>
                </Stack>
              ))}
              <Button onClick={() => setForm((f) => ({ ...f, specs: [...(f.specs || []), { key: '', value: '' }] }))} variant="outlined" size="small">Add Specification</Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirm.open} onClose={() => setConfirm({ open: false, row: null })}>
        <DialogTitle>Delete product</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete <strong>{confirm.row?.title}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ open: false, row: null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => { remove(confirm.row.id); setConfirm({ open: false, row: null }); }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <BulkProductUploadDialog 
        open={bulkOpen} 
        onClose={() => setBulkOpen(false)} 
        onImported={() => setRows(getAllProducts().slice(0, 50))}
      />
    </Box>
  );
}
