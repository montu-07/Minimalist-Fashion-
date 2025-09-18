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
  const incoming = { ...user };
  if (incoming.email) incoming.email = String(incoming.email).trim();
  const now = Date.now();
  if (incoming.password) incoming.passwordUpdatedAt = now;
  let next;
  if (incoming.id && list.some((u) => u.id === incoming.id)) {
    next = list.map((u) => (
      u.id === incoming.id ? { ...u, ...incoming, updatedAt: now } : u
    ));
  } else {
    const id = incoming.id || Date.now();
    next = [{ ...incoming, id, createdAt: now, updatedAt: now }, ...list];
  }
  save(next);
  dispatchUpdated();
  return next;
}

export function removeUser(id) {
  const list = load();
  const target = list.find((u) => u.id === id);
  if (!target) return list;
  if (target.role === 'admin') {
    const admins = list.filter((u) => u.role === 'admin');
    if (admins.length <= 1) {
      throw new Error('Cannot delete the last admin account. Create another admin first.');
    }
  }
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
  const admins = list.filter((u) => u.role === 'admin');
  const adminIds = new Set(admins.map((a) => a.id));
  const removingAdminCount = ids.reduce((acc, id) => acc + (adminIds.has(id) ? 1 : 0), 0);
  if (admins.length - removingAdminCount <= 0) {
    throw new Error('Bulk delete would remove the last admin. Adjust your selection.');
  }
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
