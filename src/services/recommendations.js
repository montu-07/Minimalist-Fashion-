// Lightweight, local-first recommendation service backed by localStorage
// Signals considered: list view, quick view, add-to-cart, purchase.
// Heuristic scoring combines popularity and content similarity (category/brand).
// Replace with a backend service when ready.

import { getAllProducts } from 'services/productsStore';

const LS_EVENTS = 'rec:events:v1';
const MAX_EVENTS = 1000; // cap to avoid unbounded growth

function now() { return Date.now(); }

function readEvents() {
  try {
    const raw = localStorage.getItem(LS_EVENTS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeEvents(events) {
  try {
    localStorage.setItem(LS_EVENTS, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {}
}

export function trackEvent(evt) {
  // evt: { type: 'list_view'|'quick_view'|'add_to_cart'|'purchase'|'search'|'category_view', productId?, category?, meta? }
  const events = readEvents();
  const enriched = { ...evt, ts: now() };
  events.push(enriched);
  writeEvents(events);
}

function weightFor(type) {
  switch (type) {
    case 'list_view': return 0.5;
    case 'search': return 0.5;
    case 'category_view': return 0.75;
    case 'quick_view': return 1.5;
    case 'add_to_cart': return 2.5;
    case 'purchase': return 5;
    default: return 1;
  }
}

function getRecent(n = 200) {
  const ev = readEvents();
  return ev.slice(-n);
}

export function getRecommendations({ limit = 8, excludeIds = [], boost = {} } = {}) {
  const all = getAllProducts();
  const byId = new Map(all.map((p) => [String(p.id), p]));
  const scores = new Map();

  const events = getRecent(400);
  const recentProducts = new Set(events.map((e) => String(e.productId)).filter(Boolean));
  const recentCategories = new Set(events.filter(e => e.category).map(e => e.category));

  // Base popularity from events
  for (const e of events) {
    const id = String(e.productId || '');
    if (!id || !byId.has(id)) continue;
    const w = weightFor(e.type);
    scores.set(id, (scores.get(id) || 0) + w);
  }

  // Content-based boosts for items sharing categories/brand with recent
  const recent = [...recentProducts].map((id) => byId.get(id)).filter(Boolean);
  const recentBrands = new Set(recent.map((p) => (p.brand || '').toLowerCase()).filter(Boolean));
  const targetCategories = new Set([...(boost.categories || []), ...recentCategories, ...recent.map(p => p.category).filter(Boolean)]);

  for (const p of all) {
    const id = String(p.id);
    if (excludeIds.includes(p.id) || excludeIds.includes(id)) continue;
    let s = scores.get(id) || 0;
    // Boost for matching categories
    if (p.category && targetCategories.has(p.category)) s += 1.2;
    // Boost for matching brands
    if (p.brand && recentBrands.has(String(p.brand).toLowerCase())) s += 0.8;
    // Small popularity prior
    s += 0.1;
    scores.set(id, s);
  }

  // Rank and pick top-N
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => byId.get(id))
    .filter(Boolean);

  // Fallback: if not enough scored, append random others not excluded
  const pickedIds = new Set(ranked.map((p) => String(p.id)));
  const missing = limit - ranked.length;
  if (missing > 0) {
    for (const p of all) {
      const sid = String(p.id);
      if (pickedIds.has(sid)) continue;
      if (excludeIds.includes(p.id) || excludeIds.includes(sid)) continue;
      ranked.push(p);
      if (ranked.length >= limit) break;
    }
  }

  return ranked.slice(0, limit);
}

export function trackProductImpressions(productIds = []) {
  // Batch record of list impressions
  const cat = null;
  for (const pid of productIds) trackEvent({ type: 'list_view', productId: pid, category: cat });
}
