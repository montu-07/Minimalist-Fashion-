// Simple localStorage-backed users store for Admin panel
// Provides CRUD, search/filter, and pagination.

const STORAGE_KEY = 'admin:users';

function dispatchUpdated() {
  try {
    window.dispatchEvent(new CustomEvent('users:updated'));
  } catch {}
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const roles = ['admin', 'user', 'manager', 'support'];
  const seed = Array.from({ length: 24 }).map((_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: roles[i % roles.length],
    status: i % 7 === 0 ? 'inactive' : 'active',
    avatar: '',
    createdAt: Date.now() - i * 86400000,
  }));
  save(seed);
  return seed;
}

function save(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

export function getAllUsers() {
  return load();
}

export function upsertUser(user) {
  const list = load();
  let next;
  if (user.id && list.some((u) => u.id === user.id)) {
    next = list.map((u) => (u.id === user.id ? { ...u, ...user } : u));
  } else {
    const id = user.id || Date.now();
    next = [{ ...user, id, createdAt: Date.now() }, ...list];
  }
  save(next);
  dispatchUpdated();
  return next;
}

export function removeUser(id) {
  const list = load();
  const next = list.filter((u) => u.id !== id);
  save(next);
  dispatchUpdated();
  return next;
}

export function toggleUserStatus(id) {
  const list = load();
  const next = list.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  save(next);
  dispatchUpdated();
  return next.find((u) => u.id === id);
}

export function bulkRemoveUsers(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return getAllUsers();
  const list = load();
  const next = list.filter((u) => !ids.includes(u.id));
  save(next);
  dispatchUpdated();
  return next;
}

export function setUsersStatus(ids = [], status = 'active') {
  if (!Array.isArray(ids) || ids.length === 0) return getAllUsers();
  const list = load();
  const next = list.map((u) => (ids.includes(u.id) ? { ...u, status } : u));
  save(next);
  dispatchUpdated();
  return next;
}

// Query with search, filters, pagination
export function queryUsers({ q = '', role = 'all', status = 'all', page = 1, pageSize = 10 }) {
  const term = q.trim().toLowerCase();
  const list = load();
  let items = list;
  if (term) {
    items = items.filter((u) => (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term));
  }
  if (role !== 'all') {
    items = items.filter((u) => u.role === role);
  }
  if (status !== 'all') {
    items = items.filter((u) => u.status === status);
  }
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return { items: pageItems, total, totalPages };
}
