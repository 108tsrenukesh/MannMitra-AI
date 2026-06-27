// storage.js — local-first, private persistence. Nothing leaves the device here.
// Entries and profile live in localStorage under a single namespace, with export/delete.

const KEY_ENTRIES = "mm_entries";
const KEY_PROFILE = "mm_profile";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Profile: { exam, language, nickname } — no real identity required. */
export function getProfile() {
  return read(KEY_PROFILE, null);
}
export function saveProfile(profile) {
  return write(KEY_PROFILE, profile);
}

/** Entry: { id, ts, mood (1-5), text, analysis } */
export function getEntries() {
  return read(KEY_ENTRIES, []);
}

export function addEntry(entry) {
  const entries = getEntries();
  const record = {
    id: cryptoId(),
    ts: Date.now(),
    mood: entry.mood,
    text: entry.text,
    analysis: entry.analysis || null,
  };
  entries.push(record);
  write(KEY_ENTRIES, entries);
  return record;
}

export function updateEntryAnalysis(id, analysis) {
  const entries = getEntries();
  const e = entries.find((x) => x.id === id);
  if (e) {
    e.analysis = analysis;
    write(KEY_ENTRIES, entries);
  }
  return e;
}

/** Export everything as a downloadable JSON blob URL. */
export function exportData() {
  const payload = { profile: getProfile(), entries: getEntries(), exportedAt: new Date().toISOString() };
  return JSON.stringify(payload, null, 2);
}

/** Wipe all locally stored data. */
export function deleteAll() {
  localStorage.removeItem(KEY_ENTRIES);
  localStorage.removeItem(KEY_PROFILE);
}

function cryptoId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}
