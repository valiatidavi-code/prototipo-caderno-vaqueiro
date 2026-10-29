// Caderno do Vaqueiro — service worker: guarda o app no celular para abrir sem sinal.
// Ao mudar qualquer arquivo do app, aumente a versão abaixo para os celulares baixarem a nova.
const VERSAO = "caderno-v1";
const ARQUIVOS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fontes do Google: usa a cópia guardada; se não tiver, baixa e guarda.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(VERSAO).then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit))
      )
    );
    return;
  }

  // Páginas: tenta a internet (para pegar atualização) e cai na cópia guardada sem sinal.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copia = res.clone(); caches.open(VERSAO).then((c) => c.put("index.html", copia)); return res; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // Demais arquivos do app: cópia guardada primeiro.
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
