import { appLogin } from '@apps-in-toss/web-framework';
import { createClient } from '@supabase/supabase-js';

// The mini-app never calls the bridge directly. It POSTs the Toss
// authorizationCode to its own backend (here a Supabase Edge Function,
// `supabase/functions/toss-login`), which exchanges the code at the bridge
// `/oidc/token` endpoint and returns a standard OIDC id_token. The browser
// then signs in with that id_token.

// Step 1: get a Toss authorizationCode from the SDK.
const { authorizationCode } = await appLogin();

// Step 2: hand it to your backend, which calls the bridge `/oidc/token`.
// `referrer` is "DEFAULT" for production, "SANDBOX" for the dev sandbox.
const res = await fetch('/functions/v1/toss-login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ authorizationCode, referrer: 'DEFAULT' }),
});
const { id_token } = await res.json();
// → { id_token, expires_in, scope }

// Step 3: sign in to Supabase with the OIDC id_token.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
const { data, error } = await supabase.auth.signInWithIdToken({
  provider: 'oidc',
  token: id_token,
});
