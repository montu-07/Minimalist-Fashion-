// Local orders store with status tracking and basic returns/refunds flow
// In production, replace with real API calls.

const ORDERS_KEY = 'orders:list';

function readOrders() {
  try { const raw = localStorage.getItem(ORDERS_KEY); const arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch { return []; }
}

function writeOrders(list) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list || []));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('orders:updated'));
    }
  } catch {}
}

export function getAllOrders() {
  return readOrders().sort((a, b) => b.createdAt - a.createdAt);
}

export function getOrderById(id) {
  const sid = String(id);
  return readOrders().find((o) => String(o.id) === sid) || null;
}

export function createOrder({ items, address, delivery, paymentMethod, paymentMeta, totals, user }) {
  const order = {
    id: Date.now(),
    createdAt: Date.now(),
    user: user ? { id: user.id, email: user.email, name: user.name } : null,
    items: items.map((i) => ({ id: i.product.id, title: i.product.title, price: i.product.price, qty: i.qty })),
    address,
    delivery,
    payment: { method: paymentMethod, meta: paymentMeta || {} },
    totals,
    status: 'Pending', // Pending -> Packed -> Shipped -> Delivered
    timeline: [{ ts: Date.now(), status: 'Pending', note: 'Order placed' }],
    rma: null, // { type: 'refund'|'return'|'exchange', status: 'requested'|'approved'|'rejected'|'completed', note }
  };
  const list = readOrders();
  writeOrders([order, ...list]);
  return order;
}

export function updateOrderStatus(id, status, note) {
  const list = readOrders();
  const idx = list.findIndex((o) => String(o.id) === String(id));
  if (idx === -1) return null;
  const next = { ...list[idx], status, timeline: [...list[idx].timeline, { ts: Date.now(), status, note: note || '' }] };
  list[idx] = next;
  writeOrders(list);
  return next;
}

export function requestRMA(id, type, note) {
  const list = readOrders();
  const idx = list.findIndex((o) => String(o.id) === String(id));
  if (idx === -1) return null;
  const rma = { type, status: 'requested', note: note || '', ts: Date.now() };
  const next = { ...list[idx], rma };
  list[idx] = next;
  writeOrders(list);
  return next;
}

export function completeRMA(id, status, note) {
  const list = readOrders();
  const idx = list.findIndex((o) => String(o.id) === String(id));
  if (idx === -1) return null;
  const rma = { ...(list[idx].rma || {}), status, note: note || '', completedAt: Date.now() };
  const next = { ...list[idx], rma };
  list[idx] = next;
  writeOrders(list);
  return next;
}

export function removeAllOrders() {
  writeOrders([]);
}
