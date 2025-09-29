// LocalStorage-backed support chat store with simple rule-based bot
// Sessions keyed per user (anonymous allowed), messages stored with direction: 'user'|'bot'|'agent'
// Broadcasts updates via window event 'support:updated'

import { getOrderById, getAllOrders } from 'services/ordersStore';
import { getAllProducts } from 'services/productsStore';
import { getRecommendations } from 'services/recommendations';

const STORE_KEY = 'support:sessions:v1';
const ANALYTICS_KEY = 'support:analytics:v1';

function read() {
  try { const raw = localStorage.getItem(STORE_KEY); const obj = raw ? JSON.parse(raw) : {}; return obj && typeof obj === 'object' ? obj : {}; } catch { return {}; }
}
function write(obj) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(obj || {})); } catch {}
  try { window.dispatchEvent(new CustomEvent('support:updated')); } catch {}
}

function readAnalytics() {
  try { const raw = localStorage.getItem(ANALYTICS_KEY); const obj = raw ? JSON.parse(raw) : {}; return obj && typeof obj === 'object' ? obj : {}; } catch { return {}; }
}
function writeAnalytics(a) { try { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a || {})); } catch {} }

function newSession(user) {
  const id = Date.now().toString(36);
  return {
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    user: user ? { id: user.id, name: user.name, email: user.email } : null,
    status: 'open', // open | escalated | closed
    messages: [
      { id: `${id}-welcome`, from: 'bot', ts: Date.now(), type: 'text', text: 'Hi! I\'m your assistant. I can help with order status, returns, and product info. Ask me anything.' },
      quickActions(),
    ],
  };
}

export function getOrCreateSession(user) {
  const db = read();
  // Single session per browser for now; pick the most recent open session
  const sessions = Object.values(db);
  let sess = sessions.sort((a,b)=>b.updatedAt-a.updatedAt).find(s => s.status !== 'closed');
  if (!sess) {
    sess = newSession(user);
    db[sess.id] = sess;
    write(db);
  }
  return sess;
}

export function getAllSessions() {
  return Object.values(read()).sort((a,b)=>b.updatedAt-a.updatedAt);
}

export function getSession(id) {
  return read()[id] || null;
}

export function addUserMessage(sessionId, text) {
  const db = read();
  const s = db[sessionId]; if (!s || s.status === 'closed') return null;
  const msg = { id: `${sessionId}-${Date.now()}`, from: 'user', ts: Date.now(), type: 'text', text };
  s.messages.push(msg); s.updatedAt = Date.now();
  db[sessionId] = s; write(db);
  // Generate bot response
  setTimeout(() => runBot(sessionId, text), 150);
  return msg;
}

export function addAgentMessage(sessionId, text, agentName = 'Support Agent') {
  const db = read(); const s = db[sessionId]; if (!s) return null;
  const msg = { id: `${sessionId}-${Date.now()}`, from: 'agent', ts: Date.now(), type: 'text', text, agent: agentName };
  s.messages.push(msg); s.updatedAt = Date.now();
  db[sessionId] = s; write(db); return msg;
}

export function escalate(sessionId) {
  const db = read(); const s = db[sessionId]; if (!s) return null;
  s.status = 'escalated'; s.updatedAt = Date.now();
  s.messages.push({ id: `${sessionId}-${Date.now()}`, from: 'bot', ts: Date.now(), type: 'text', text: 'I\'ve connected you to a support specialist. Please wait…' });
  bumpAnalytics({ escalations: 1 });
  db[sessionId] = s; write(db); return s;
}

export function closeSession(sessionId) {
  const db = read(); const s = db[sessionId]; if (!s) return null;
  s.status = 'closed'; s.updatedAt = Date.now();
  db[sessionId] = s; write(db); return s;
}

// Simple intent matcher
function runBot(sessionId, userText) {
  const text = String(userText || '').toLowerCase();
  const db = read(); const s = db[sessionId]; if (!s) return;
  bumpAnalytics({ total: 1 });
  let reply = '';

  // Quick command buttons
  if (['help','menu','start'].some(k => text === k)) {
    s.messages.push(quickActions());
    s.updatedAt = Date.now(); db[sessionId] = s; write(db); return;
  }

  // Order status intent: look for order id in text
  const orderIdMatch = text.match(/#?(\d{6,})/);
  if (text.includes('order') && orderIdMatch) {
    const oid = orderIdMatch[1];
    const o = getOrderById(oid);
    if (o) {
      reply = `Order #${o.id} is currently ${o.status}. Placed on ${new Date(o.createdAt).toLocaleDateString()}.`;
      s.messages.push({ id: mid(sessionId), from: 'bot', ts: Date.now(), type: 'text', text: reply });
      s.messages.push(orderActions(oid));
      s.updatedAt = Date.now(); db[sessionId] = s; write(db); bumpAnalytics({ solved: 1 }); return;
    } else {
      reply = `I couldn\'t find order #${oid}. Please verify the number.`;
    }
  }

  // Returns / refund intent
  if (!reply && (text.includes('return') || text.includes('refund') || text.includes('exchange'))) {
    reply = 'You can request a return or exchange within 30 days of delivery. Share your order #, and I\'ll prepare the request.';
  }

  // Product info intent: title keyword search
  if (!reply && (text.includes('details') || text.includes('spec') || text.includes('stock') || text.includes('price') || text.includes('show') || text.includes('buy') || text.includes('find'))) {
    const words = text.split(/[^a-z0-9]+/).filter(w => w.length > 2);
    const all = getAllProducts();
    const found = all.filter(p => words.some(w => String(p.title).toLowerCase().includes(w))).slice(0, 6);
    if (found.length) {
      s.messages.push({ id: mid(sessionId), from: 'bot', ts: Date.now(), type: 'text', text: 'Here are some items I found:' });
      s.messages.push(productCards(found));
      s.updatedAt = Date.now(); db[sessionId] = s; write(db); bumpAnalytics({ solved: 1 }); return;
    }
  }

  // Recommendations personalized
  if (!reply && text.includes('recommend')) {
    const exclude = [];
    const recs = getRecommendations({ limit: 6, excludeIds: exclude });
    if (recs.length) {
      s.messages.push({ id: mid(sessionId), from: 'bot', ts: Date.now(), type: 'text', text: 'You may also like:' });
      s.messages.push(productCards(recs));
      s.updatedAt = Date.now(); db[sessionId] = s; write(db); bumpAnalytics({ solved: 1 }); return;
    }
  }

  // Default fallback
  // FAQs
  if (!reply) {
    const faq = faqAnswer(text);
    if (faq) reply = faq;
  }

  if (!reply) {
    reply = 'I\'m here to help with order status, returns, shipping, payments, and product details. Try the quick actions below or ask me about an order # (e.g., 123456).';
    s.messages.push({ id: mid(sessionId), from: 'bot', ts: Date.now(), type: 'text', text: reply });
    s.messages.push(quickActions());
    db[sessionId] = s; write(db); return;
  }

  s.messages.push({ id: mid(sessionId), from: 'bot', ts: Date.now(), type: 'text', text: reply });
  s.updatedAt = Date.now();
  db[sessionId] = s; write(db);
}

// ---------- Rich message helpers ----------
function productCards(products) {
  return {
    id: `cards-${Date.now()}`,
    from: 'bot',
    ts: Date.now(),
    type: 'cards',
    items: products.map((p) => ({
      id: p.id,
      title: p.title,
      price: Number(p.price),
      image: (p.images && p.images[0]) || null,
      category: p.category,
    })),
  };
}

function quickActions() {
  return {
    id: `actions-${Date.now()}`,
    from: 'bot', ts: Date.now(), type: 'actions',
    actions: [
      { id: 'track', label: 'Track Order', payload: 'track order' },
      { id: 'deals', label: 'Browse Deals', payload: 'show deals' },
      { id: 'recommend', label: 'Recommendations', payload: 'recommend' },
      { id: 'agent', label: 'Talk to Support', payload: 'escalate' },
    ],
  };
}

function orderActions(orderId) {
  return {
    id: `actions-${Date.now()}`,
    from: 'bot', ts: Date.now(), type: 'actions',
    actions: [
      { id: 'track', label: `Open Order #${orderId}`, payload: `open order ${orderId}` },
      { id: 'faq-returns', label: 'Returns & Refunds', payload: 'returns' },
      { id: 'agent', label: 'Talk to Support', payload: 'escalate' },
    ],
  };
}

function faqAnswer(text) {
  const t = text.toLowerCase();
  if (t.includes('shipping') || t.includes('delivery')) return 'Shipping: Standard (3-5 days, Free for members). Express (1-2 days) $14.99. Next-day $24.99.';
  if (t.includes('return') || t.includes('refund') || t.includes('exchange')) return 'Returns & Refunds: 30-day returns window after delivery. Start by sharing your order # and reason. Refunds processed to original payment method.';
  if (t.includes('payment') || t.includes('methods') || t.includes('pay')) return 'Payment Methods: Card, UPI, Net Banking, Wallet, PayPal, Stripe, and Cash on Delivery (select regions).';
  if (t.includes('loyalty') || t.includes('points') || t.includes('membership')) return 'Membership: Prime Monthly/Annual with free delivery, early access, and 5-10% discounts. Join at /membership for perks.';
  if (t.includes('deal') || t.includes('sale')) return 'Deals: Visit /products and sort by price or check New Arrivals for current promotions.';
  return '';
}

function mid(sessionId) { return `${sessionId}-${Date.now()}`; }

// ---------- Analytics ----------
function bumpAnalytics(partial) {
  const a = readAnalytics();
  a.total = (a.total || 0) + (partial.total || 0);
  a.escalations = (a.escalations || 0) + (partial.escalations || 0);
  a.solved = (a.solved || 0) + (partial.solved || 0);
  writeAnalytics(a);
}

export function getAnalytics() {
  const a = readAnalytics();
  const total = a.total || 0; const solved = a.solved || 0; const escalations = a.escalations || 0;
  const successRate = total ? Math.round((solved / total) * 100) : 0;
  return { total, solved, escalations, successRate };
}

// Proactive notifications
export function pushNotification(sessionId, text) {
  const db = read(); const s = db[sessionId]; if (!s) return null;
  const msg = { id: mid(sessionId), from: 'bot', ts: Date.now(), type: 'text', text };
  s.messages.push(msg); s.updatedAt = Date.now(); db[sessionId] = s; write(db); return msg;
}

export function notifyOrderUpdate(order) {
  // naive: notify sessions with same email
  const db = read();
  const email = order?.user?.email;
  if (!email) return;
  Object.values(db).forEach((s) => {
    if (s.user?.email === email) {
      s.messages.push({ id: mid(s.id), from: 'bot', ts: Date.now(), type: 'text', text: `Update: Your order #${order.id} is now ${order.status}.` });
      s.updatedAt = Date.now();
    }
  });
  write(db);
}
