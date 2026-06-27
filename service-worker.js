// service-worker.js — offline-first shell so the toolkit & UI work without network.
// Bump CACHE_NAME on each release to avoid stale assets.
const CACHE_NAME = "mannmitra-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./assets/js/config.js",
  "./assets/js/safety.js",
  "./assets/js/storage.js",
  "./assets/js/analysis.js",
  "./assets/js/insights.js",
  "./assets/js/ai.js",
  "./icons/icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache AI API calls.
  if (url.hostname.includes("googleapis.com") || url.hostname.includes("groq.com")) return;
  if (e.request.method !== "GET") return;
  // Network-first, fall back to cache (keeps content fresh, works offline).
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
