"use strict";

/* Cambiare CACHE solo se cambia l'elenco dei file di SHELL.
   I contenuti si aggiornano da soli: ogni risorsa viene servita dalla cache
   e rinfrescata in background, quindi una modifica appare alla visita successiva. */
const CACHE = "velisario-v5";
const SHELL = [
  "./",
  "index.html",
  "style.css",
  "testi.js",
  "app.js",
  "data/voci.json",
  "data/voci-es.json",
  "data/fonti.json",
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((chiavi) =>
        Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const inCache = await cache.match(req);
      const rete = fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      e.waitUntil(rete);
      return inCache || (await rete) || new Response("Offline", { status: 503 });
    })
  );
});
