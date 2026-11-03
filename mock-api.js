// Dette er vores lille lokale "server": den svarer på POST /api/tjek.
self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", event => {
  const request = event.request;
  const apiPath = new URL("api/tjek", self.registration.scope).pathname;

  if (request.method !== "POST" || new URL(request.url).pathname !== apiPath) return;

  event.respondWith((async () => {
    let data;
    try {
      data = await request.json();
    } catch {
      data = {};
    }

    const hasName = typeof data.name === "string" && data.name.trim() !== "";
    const answer = hasName
      ? { besked: `Hej ${data.name}! Din request er godkendt.` }
      : { fejl: "Navn mangler. Skriv et navn for at fortsætte." };

    return new Response(JSON.stringify(answer), {
      status: hasName ? 200 : 400,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  })());
});
