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
import { upsertUser, getAllUsers } from 'services/usersStore';

function parseCSV(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.length > 0);
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

const templateHeaders = ['name','email','role','status','avatar','password'];
const ROLE_SET = new Set(['admin','user','manager','support']);
const STATUS_SET = new Set(['active','inactive']);

export default function BulkUsersUploadDialog({ open, onClose, onImported }) {
  const [fileName, setFileName] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [error, setError] = React.useState('');
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const reset = () => {
    setFileName(''); setRows([]); setError(''); setImporting(false); setResult(null);
  };

  const downloadTemplate = () => {
    const header = templateHeaders.join(',');
    const example = '\n"Jane Doe",jane@example.com,user,active,,,"';
    const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users-template.csv'; a.click(); URL.revokeObjectURL(url);
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

  const validateRow = (r) => {
    const errs = [];
    const name = (r.name || '').trim();
    const email = (r.email || '').trim();
    if (!name) errs.push('name missing');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errs.push('invalid email');
    if (r.role && !ROLE_SET.has(r.role)) errs.push('invalid role');
    if (r.status && !STATUS_SET.has(r.status)) errs.push('invalid status');
    if (r.password && String(r.password).length < 6) errs.push('password too short');
    // duplicate email check within file and existing storage will be indirect via upsert + UI validation elsewhere
    return errs;
  };

  const toPayload = (r) => {
    const name = (r.name || '').trim();
    const email = (r.email || '').trim();
    const role = ROLE_SET.has(r.role) ? r.role : 'user';
    const status = STATUS_SET.has(r.status) ? r.status : 'active';
    const avatar = r.avatar || '';
    const password = r.password || '';
    const base = { name, email, role, status, avatar };
    return password ? { ...base, password } : base;
  };

  const doImport = async () => {
    setImporting(true); setError(''); setResult(null);
    let ok = 0, fail = 0;
    const errors = [];
    const existing = getAllUsers();
    const existingEmails = new Set(existing.map((u) => (u.email || '').toLowerCase()));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const errs = validateRow(r);
      if (errs.length) { fail++; errors.push({ index: i + 2, message: errs.join(', ') }); continue; }
      const payload = toPayload(r);
      try {
        // Prevent duplicates by email in this simple importer
        const dup = existingEmails.has(payload.email.toLowerCase());
        if (dup) { fail++; errors.push({ index: i + 2, message: 'email already exists' }); continue; }
        upsertUser(payload);
        existingEmails.add(payload.email.toLowerCase());
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
    onImported?.(res);
  };

  const handleClose = () => { reset(); onClose?.(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Upload Users</DialogTitle>
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
          <Typography variant="caption" color="text.secondary">Headers: name, email, role, status, avatar, password</Typography>
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
