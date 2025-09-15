// Centralized products store backed by localStorage, with static defaults
import baseProducts, { facets as staticFacets } from 'shared/data/products';

const LS_KEY = 'products:custom';
const LS_DELETED_KEY = 'products:deleted'; // tombstones for base products (ids)
const LS_TRASH_KEY = 'products:trash'; // full objects for deleted custom products

function readCustom() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function readTrash() {
  try {
    const raw = localStorage.getItem(LS_TRASH_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function writeTrash(list) {
  try {
    localStorage.setItem(LS_TRASH_KEY, JSON.stringify(list || []));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('products:updated'));
    }
  } catch {}
}

function writeCustom(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list || []));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('products:updated'));
    }
  } catch {
    // ignore write errors
  }
}

function readDeleted() {
  try {
    const raw = localStorage.getItem(LS_DELETED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function writeDeleted(ids) {
  try {
    localStorage.setItem(LS_DELETED_KEY, JSON.stringify(ids || []));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('products:updated'));
    }
  } catch {
    // ignore write errors
  }
}

export function getAllProducts() {
  const custom = readCustom();
  const deleted = new Set(readDeleted());
  // Custom first, then base (avoid duplicate ids by preferring custom)
  const merged = [...custom.filter((p) => !deleted.has(String(p.id)))];
  for (const p of baseProducts) {
    const id = String(p.id);
    if (deleted.has(id)) continue;
    if (!custom.some((c) => String(c.id) === id)) merged.push(p);
  }
  return merged;
}

export function upsertProduct(product) {
  const list = readCustom();
  const id = product.id ?? Date.now();
  const next = { ...product, id };
  const exists = list.some((p) => String(p.id) === String(id));
  const updated = exists ? list.map((p) => (String(p.id) === String(id) ? next : p)) : [next, ...list];
  writeCustom(updated);
  return next;
}

export function removeProduct(id) {
  const list = readCustom();
  const sid = String(id);
  const existsInCustom = list.some((p) => String(p.id) === sid);
  if (existsInCustom) {
    const removed = list.find((p) => String(p.id) === sid);
    const updated = list.filter((p) => String(p.id) !== sid);
    writeCustom(updated);
    // move to trash for potential restore
    const trash = readTrash();
    writeTrash([{ ...removed, _deletedAt: Date.now() }, ...trash.filter((t) => String(t.id) !== sid)]);
  } else {
    // Base product: tombstone it
    const deleted = readDeleted();
    if (!deleted.includes(sid)) {
      deleted.push(sid);
      writeDeleted(deleted);
    } else {
      // still dispatch so UI refreshes
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('products:updated'));
      }
    }
  }
}

export function replaceAllCustomProducts(items) {
  writeCustom(items || []);
}

export function getFacets() {
  // Optionally compute from dynamic data; fallback to static facets for now.
  return staticFacets;
}

export function getAllTitles() {
  return getAllProducts().map((p) => p.title);
}

// Recycle Bin APIs
export function getRecycleBinItems() {
  const deletedIds = new Set(readDeleted());
  const trash = readTrash(); // custom products
  // map base deleted ids to product objects from baseProducts for display
  const baseDeleted = baseProducts.filter((p) => deletedIds.has(String(p.id))).map((p) => ({ ...p, _tombstone: true, _deletedAt: null }));
  return [...trash, ...baseDeleted];
}

export function restoreProduct(id) {
  const sid = String(id);
  // try trash first
  const trash = readTrash();
  const hit = trash.find((t) => String(t.id) === sid);
  if (hit) {
    // put back into custom list
    const list = readCustom();
    const updatedList = [hit, ...list.filter((p) => String(p.id) !== sid)];
    writeCustom(updatedList);
    writeTrash(trash.filter((t) => String(t.id) !== sid));
    return { restored: 'custom', item: hit };
  }
  // else remove tombstone for base
  const deleted = readDeleted();
  if (deleted.includes(sid)) {
    const next = deleted.filter((d) => d !== sid);
    writeDeleted(next);
    return { restored: 'base', id: sid };
  }
  return { restored: false };
}

export function emptyRecycleBin() {
  writeTrash([]);
}
