// Standard Web API (via @ait-co/polyfill)
const payload: ShareData = {};
if (title) payload.title = title;
if (text) payload.text = text;
if (url) payload.url = url;
await navigator.share(payload);
