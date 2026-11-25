"use client";
import { useSyncExternalStore } from "react";

// The cart lives in the visitor's browser: only the ids of chosen sizes. Prices and availability are always re-read
// from the server, so editing this storage can never change a price.
const KEY = "sk_cart";
const EVT = "sk-cart-change";

function read(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((n) => Number.isInteger(n) && n > 0).slice(0, 10) : [];
  } catch { return []; }
}
let snapshot = "[]";
function getSnapshot() { const s = JSON.stringify(read()); if (s !== snapshot) snapshot = s; return snapshot; }
function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb); window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); };
}
function write(ids: number[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVT));
}

export function useCartIds(): number[] {
  const s = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  return JSON.parse(s) as number[];
}
export const cartAdd = (id: number) => { const c = read(); if (!c.includes(id)) write([...c, id]); };
export const cartRemove = (id: number) => write(read().filter((x) => x !== id));
export const cartClear = () => write([]);
export const cartHas = (id: number) => read().includes(id);
