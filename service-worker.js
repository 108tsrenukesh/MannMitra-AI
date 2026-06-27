// service-worker.js — offline-first shell so the toolkit & UI work without network.
const CACHE_NAME = "mannmitra-v3";
const ASSETS = [
  "./","./index.html","./manifest.json","./assets/css/styles.css",
  "./assets/js/app.js","./assets/js/config.js","./assets/js/safety.js",
  "./assets/js/storage.js","./assets/js/analysis.js","./assets/js/insights.js",
  "./assets/js/ai.js","./assets/js/i18n.js","./assets/js/auth.js","./icons/icon.svg"
];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.hostname.includes("googleapis.com") || url.hostname.includes("groq.com")) return;
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((res) => { const c = res.clone(); caches.open(CACHE_NAME).then((cc) => cc.put(e.request, c)); return res; }).catch(() => caches.match(e.request)));
});
