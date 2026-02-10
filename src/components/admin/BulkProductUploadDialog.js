import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import { upsertProduct, getAllProducts } from 'services/productsStore';

function parseCSV(text) {
  // Very lightweight CSV parser; expects first line as header
  // Handles quoted fields with commas
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cells[i] ?? '').trim(); });
    return obj;
  });
  return { headers, rows };
}

function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

const templateHeaders = ['title','price','stock','brand','category','categories','description','images','sku'];

export default function BulkProductUploadDialog({ open, onClose, onImported }) {
  const [fileName, setFileName] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [error, setError] = React.useState('');
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const reset = () => {
    setFileName('');
    setRows([]);
    setError('');
    setImporting(false);
    setResult(null);
  };

  const downloadTemplate = () => {
    const header = templateHeaders.join(',');
    const example = '\n"Sample Product",19.99,100,BrandX,CategoryA,"CategoryA|CategoryB","Short description","https://example.com/a.jpg|https://example.com/b.jpg",SKU123';
    const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'products-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (e) => {
    setError(''); setRows([]); setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { rows: parsed } = parseCSV(String(reader.result));
        setRows(parsed);
      } catch (err) {
        console.error(err);
        setError('Failed to parse the file. Please ensure it is a valid CSV.');
      }
    };
    reader.readAsText(file);
  };

  const validateRow = (r, index) => {
    const errs = [];
    if (!r.title) errs.push('title missing');
    if (!r.price || isNaN(Number(r.price))) errs.push('invalid price');
    if (r.stock && isNaN(Number(r.stock))) errs.push('invalid stock');
    return errs;
  };

  const toPayload = (r) => {
    const categories = (r.categories || r.category || '')
      .split(/\||,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const images = (r.images || '')
      .split(/\||,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const price = Number(r.price);
    const stock = r.stock !== '' && r.stock != null ? Number(r.stock) : undefined;
    return {
      id: r.id || undefined,
      title: r.title,
      price,
      brand: r.brand || '',
      category: categories[0] || r.category || '',
      categories,
      images,
      image: images[0] || '',
      description: r.description || '',
      stock,
      sku: r.sku || '',
      specs: [],
    };
  };

  const doImport = async () => {
    setImporting(true); setError(''); setResult(null);
    let ok = 0, fail = 0;
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const errs = validateRow(r, i);
      if (errs.length) { fail++; errors.push({ index: i + 2, message: errs.join(', ') }); continue; }
      try {
        upsertProduct(toPayload(r));
        ok++;
      } catch (err) {
        console.error(err);
        fail++;
        errors.push({ index: i + 2, message: err.message || 'import error' });
      }
      if (i % 10 === 0) await new Promise((res) => setTimeout(res, 0));
    }
    setImporting(false);
    const res = { imported: ok, failed: fail, errors };
    setResult(res);
    if (onImported) onImported(res);
  };

  const handleClose = () => { reset(); onClose?.(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Upload Products</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button startIcon={<DownloadIcon />} onClick={downloadTemplate}>Download CSV Template</Button>
            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
              Choose CSV File
              <input type="file" accept=".csv,text/csv" hidden onChange={onFile} />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: 'auto' } }}>{fileName}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">Headers: title, price, stock, brand, category, categories, description, images, sku</Typography>
          {!!error && <Alert severity="error">{error}</Alert>}
          {importing && <LinearProgress />}

          {rows.length > 0 && (
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview ({rows.length} rows)</Typography>
              <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {templateHeaders.map((h) => (<TableCell key={h}>{h}</TableCell>))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.slice(0, 50).map((r, idx) => (
                      <TableRow key={idx}>
                        {templateHeaders.map((h) => (<TableCell key={h}>{r[h] || ''}</TableCell>))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          )}

          {result && (
            <Alert severity={result.failed ? 'warning' : 'success'}>
              Imported: {result.imported}, Failed: {result.failed}
              {result.errors?.length ? (
                <Box component="span" sx={{ display: 'block', mt: 1 }}>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <Typography key={i} variant="caption" display="block">Row {e.index}: {e.message}</Typography>
                  ))}
                  {result.errors.length > 5 && (<Typography variant="caption">...and {result.errors.length - 5} more</Typography>)}
                </Box>
              ) : null}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button variant="contained" onClick={doImport} disabled={!rows.length || importing}>Import</Button>
      </DialogActions>
    </Dialog>
  );
}
