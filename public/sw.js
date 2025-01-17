self.addEventListener("install", (event) => {
	console.log("Service Worker installing...");
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	console.log("Service Worker activated!");
	event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
	return event.respondWith(
		(async () => {
			const cache = await caches.open("tsvfs");
			const { pathname: fileName } = new URL(event.request.url);
			const match = await cache.match(fileName);
			if (match) {
				return match;
			}

			return fetch(event.request).catch((error) => {
				console.error("Fetch failed; returning offline page.", error);
				return new Response("You are offline.", {
					headers: { "Content-Type": "text/plain" },
				});
			});
		})(),
	);
});
