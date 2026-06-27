// auth.js — optional device-only screen-lock PIN.
// Honest scope: a 4-digit PIN hashed with SHA-256 deters casual snooping on a shared
// phone (the real use-case for this audience). It is NOT strong security on its own —
// the real privacy guarantee is that no data ever leaves the device.

const SALT = "mannmitra_pin_v1";
const KEY = "mm_pin_hash";

async function sha256(text) {
  const data = new TextEncoder().encode(text + SALT);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hasPin() {
  return Boolean(localStorage.getItem(KEY));
}

export async function setPin(pin) {
  if (!/^\d{4}$/.test(pin)) return false;
  localStorage.setItem(KEY, await sha256(pin));
  return true;
}

export async function verifyPin(pin) {
  const stored = localStorage.getItem(KEY);
  if (!stored) return true; // no PIN set → always "unlocked"
  return (await sha256(pin)) === stored;
}

export function clearPin() {
  localStorage.removeItem(KEY);
}
