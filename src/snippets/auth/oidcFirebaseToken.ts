import { appLogin } from '@apps-in-toss/web-framework';

// `/firebase-token` is a self-host-only endpoint built on top of `/verify`.
// The community public instance returns 501 not_configured because it
// deliberately does not hold end-user Firebase service accounts.
const { authorizationCode } = await appLogin();
const baseUrl = 'https://oidc-bridge.aitc.dev';
const response = await fetch(`${baseUrl}/firebase-token`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ authorizationCode, referrer: 'DEFAULT' }),
});
const data = await response.json();
// On a self-host with FIREBASE_SERVICE_ACCOUNT set:
//   → { firebaseToken: string, sub: string, ... }
// Use it on the client with `signInWithCustomToken(firebaseToken)`.
