// Local membership plans and subscriptions
// Stores plan catalog and per-user membership status in LocalStorage

import { useAuth } from 'state/AuthContext';

const PLANS_KEY = 'membership:plans:v1';
const STATUS_KEY = 'membership:status:v1';

const defaultPlans = [
  {
    id: 'prime-monthly',
    name: 'Prime Monthly',
    price: 7.99,
    interval: 'month',
    durationDays: 30,
    perks: [
      'Free delivery on all orders',
      'Early access to sales',
      '5% member discount',
      'Exclusive collections access',
    ],
    discountPercent: 5,
    freeDelivery: true,
    earlyAccess: true,
    exclusiveAccess: true,
  },
  {
    id: 'prime-annual',
    name: 'Prime Annual',
    price: 79.0,
    interval: 'year',
    durationDays: 365,
    perks: [
      'Free delivery on all orders',
      'Early access to sales',
      '10% member discount',
      'Exclusive collections access',
    ],
    discountPercent: 10,
    freeDelivery: true,
    earlyAccess: true,
    exclusiveAccess: true,
  },
];

function readPlans() {
  try { const raw = localStorage.getItem(PLANS_KEY); const arr = raw ? JSON.parse(raw) : null; return Array.isArray(arr) && arr.length ? arr : defaultPlans; } catch { return defaultPlans; }
}
function writePlans(plans) { try { localStorage.setItem(PLANS_KEY, JSON.stringify(plans)); } catch {} }

function readStatusMap() { try { return JSON.parse(localStorage.getItem(STATUS_KEY)) || {}; } catch { return {}; } }
function writeStatusMap(map) { try { localStorage.setItem(STATUS_KEY, JSON.stringify(map || {})); } catch {} }

export function getPlans() { return readPlans(); }
export function savePlans(plans) { writePlans(plans); }

function keyForUser(user) { return (user?.email || 'guest').toLowerCase(); }

export function getMembership(user) {
  const map = readStatusMap();
  const key = keyForUser(user);
  const rec = map[key];
  if (!rec) return null;
  if (rec.expiresAt && Date.now() > rec.expiresAt) return null;
  return rec;
}

export function isMember(user) { return !!getMembership(user); }

export function subscribe(planId, user) {
  const plans = readPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) throw new Error('Plan not found');
  const expiresAt = Date.now() + plan.durationDays * 86400000;
  const map = readStatusMap();
  map[keyForUser(user)] = { planId: plan.id, startedAt: Date.now(), expiresAt, perks: { discountPercent: plan.discountPercent, freeDelivery: plan.freeDelivery, earlyAccess: plan.earlyAccess, exclusiveAccess: plan.exclusiveAccess } };
  writeStatusMap(map);
  return map[keyForUser(user)];
}

export function cancel(user) {
  const map = readStatusMap();
  delete map[keyForUser(user)];
  writeStatusMap(map);
}

export function getMemberPerks(user) {
  const sub = getMembership(user); if (!sub) return { freeDelivery: false, discountPercent: 0, earlyAccess: false, exclusiveAccess: false };
  return sub.perks || { freeDelivery: false, discountPercent: 0, earlyAccess: false, exclusiveAccess: false };
}

export function getDiscountPercent(user) { return getMemberPerks(user).discountPercent || 0; }
export function hasFreeDelivery(user) { return !!getMemberPerks(user).freeDelivery; }

// Helper calculate
export function applyMemberBenefits({ subtotal, shipping }, user) {
  const perks = getMemberPerks(user);
  const discount = perks.discountPercent ? (subtotal * (perks.discountPercent / 100)) : 0;
  const shippingCost = perks.freeDelivery ? 0 : shipping;
  return { discount, shipping: shippingCost, total: Math.max(0, subtotal - discount + shippingCost) };
}
