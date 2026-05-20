// Supabase Edge Function (Deno) — the consumer backend for the OIDC bridge flow.
//
// The mini-app runs `appLogin()` in the Toss WebView to get a short-lived
// `authorizationCode`, then POSTs it here. This function exchanges that code at
// the oidc-bridge `/oidc/token` endpoint (authorization_code grant) using the
// app's registered `client_id`, and returns the bridge-issued `id_token` to the
// client. The client then calls `supabase.auth.signInWithIdToken(...)` with it.
//
// Why a backend hop instead of calling the bridge from the browser: the bridge
// authenticates the caller per registered app (Origin allow-list for public
// clients, or `client_secret` for confidential clients). Keeping the exchange
// server-side lets confidential apps hold their secret off the client, and
// keeps the `client_id` ↔ allowed-origin contract in one place.
//
// Required env (set with `supabase secrets set`):
//   OIDC_BRIDGE_BASE_URL   e.g. https://oidc-bridge.aitc.dev
//   OIDC_BRIDGE_CLIENT_ID  the app's registered client_id at the bridge
//   OIDC_BRIDGE_CLIENT_SECRET (optional) only for confidential clients
//
// Deploy: `supabase functions deploy toss-login --no-verify-jwt`
// (the caller is an unauthenticated mini-app, so the platform JWT check is off;
// the bridge itself authenticates the app.)

interface ExchangeRequest {
  authorizationCode: string;
  referrer?: 'DEFAULT' | 'SANDBOX';
}

interface BridgeTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

interface OAuthErrorBody {
  error: string;
  error_description?: string;
}

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const baseUrl = Deno.env.get('OIDC_BRIDGE_BASE_URL');
  const clientId = Deno.env.get('OIDC_BRIDGE_CLIENT_ID');
  const clientSecret = Deno.env.get('OIDC_BRIDGE_CLIENT_SECRET');
  if (!baseUrl || !clientId) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  let payload: ExchangeRequest;
  try {
    payload = (await req.json()) as ExchangeRequest;
  } catch {
    return json({ error: 'invalid_request', error_description: 'body must be JSON' }, 400);
  }
  if (!payload.authorizationCode) {
    return json({ error: 'invalid_request', error_description: 'authorizationCode required' }, 400);
  }

  const tokenRequest: Record<string, string> = {
    grant_type: 'authorization_code',
    code: payload.authorizationCode,
    client_id: clientId,
    referrer: payload.referrer ?? 'DEFAULT',
  };
  if (clientSecret) {
    tokenRequest.client_secret = clientSecret;
  }

  let bridgeResponse: Response;
  try {
    bridgeResponse = await fetch(`${baseUrl}/oidc/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(tokenRequest),
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    return json({ error: 'bridge_unreachable', error_description: cause }, 502);
  }

  const text = await bridgeResponse.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    return json(
      { error: 'bridge_bad_response', error_description: text.slice(0, 200) },
      502,
    );
  }

  if (!bridgeResponse.ok) {
    // Pass the bridge's OAuth error envelope straight through.
    const errorBody = parsed as Partial<OAuthErrorBody>;
    return json(
      {
        error: errorBody.error ?? `bridge_http_${bridgeResponse.status}`,
        error_description: errorBody.error_description,
      },
      bridgeResponse.status,
    );
  }

  const tokens = parsed as BridgeTokenResponse;
  // Return only what the client needs to sign in. The opaque access/refresh
  // tokens stay server-side unless the app explicitly wants to manage refresh.
  return json(
    { id_token: tokens.id_token, expires_in: tokens.expires_in, scope: tokens.scope },
    200,
  );
});
