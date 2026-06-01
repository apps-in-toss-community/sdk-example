import { appsInTossEvent } from '@apps-in-toss/web-framework';

// `AppsInTossEvent` is currently `{}` in @apps-in-toss/web-framework@3.0.0-beta.9d42c0b,
// so there are no event keys to subscribe to yet — this namespace is reserved
// for future platform events. When keys land, usage will look like:
//
// const unsubscribe = appsInTossEvent.addEventListener('someEvent', {
//   onEvent: (payload) => { console.log(payload); },
//   onError: (err) => { console.error(err); },
// });
// unsubscribe(); // call to detach

// Probe the export surface at runtime (no subscription side effects).
console.log(typeof appsInTossEvent.addEventListener);
