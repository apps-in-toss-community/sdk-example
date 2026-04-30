import { appLogin } from '@apps-in-toss/web-framework';

// Step 1: get a Toss authorizationCode from the SDK.
const { authorizationCode } = await appLogin();

// Step 2: exchange it via the oidc-bridge `/verify` endpoint.
// `referrer` is `"DEFAULT"` for production, `"SANDBOX"` for the dev sandbox.
const baseUrl = import.meta.env.VITE_OIDC_BRIDGE_URL;
const response = await fetch(`${baseUrl}/verify`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ authorizationCode, referrer: 'DEFAULT' }),
});
const data = await response.json();
// → { sub, provider: "toss", claims, tossAccessTokenExpiresAt }
