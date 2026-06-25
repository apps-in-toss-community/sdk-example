import { appLogin } from '@apps-in-toss/web-framework';
import oidcExchangeSnippet from '../snippets/auth/oidcExchange.ts?raw';
import oidcFirebaseSnippet from '../snippets/auth/oidcFirebaseToken.ts?raw';
import { ApiCard } from './ApiCard';

const BRIDGE_REPO_URL = 'https://github.com/apps-in-toss-community/oidc-bridge';
export const OIDC_BRIDGE_BASE_URL = 'https://oidc-bridge.aitc.dev';

/**
 * Backend endpoint that performs the bridge exchange. In a real app this is
 * your own consumer backend (e.g. a Supabase Edge Function); see
 * `supabase/functions/toss-login`. The mini-app never calls the bridge
 * `/oidc/token` endpoint directly — the bridge authenticates the caller per
 * registered app, so the exchange stays server-side.
 */
const EXCHANGE_ENDPOINT = '/functions/v1/toss-login';

/** What the backend returns after a successful `/oidc/token` exchange. */
interface ExchangeResponse {
  id_token: string;
  expires_in: number;
  scope: string;
}

/** OAuth 2.0 / OIDC error envelope, passed through from the bridge. */
interface OAuthErrorBody {
  error: string;
  error_description?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Network error reaching the exchange backend (${cause}). On the static sdk-example site this endpoint is not deployed — see the snippet for the real flow.`,
    );
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Exchange backend returned non-JSON (${response.status}): ${text.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    const errorBody = parsed as Partial<OAuthErrorBody>;
    const code = errorBody.error ?? `http_${response.status}`;
    const description = errorBody.error_description ?? response.statusText;
    throw new Error(`${code}: ${description}`);
  }
  return parsed as T;
}

async function exchange(referrer: string): Promise<ExchangeResponse> {
  const { authorizationCode } = await appLogin();
  return await postJson<ExchangeResponse>(EXCHANGE_ENDPOINT, { authorizationCode, referrer });
}

export function OidcBridgeSection() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">OIDC bridge demo</h2>
        <a
          href={BRIDGE_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          oidc-bridge repo →
        </a>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Community-operated bridge that turns a Toss{' '}
        <code className="font-mono">authorizationCode</code> into a standard OIDC{' '}
        <code className="font-mono">id_token</code>, which you exchange for a session on Supabase,
        Firebase, Auth0, or any OIDC-aware backend. Best-effort, no SLA — security-sensitive
        workloads should self-host.
      </p>
      <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
        Flow: <code className="font-mono">appLogin()</code> → your backend (
        <code className="font-mono">{EXCHANGE_ENDPOINT}</code>) → bridge{' '}
        <code className="font-mono">{OIDC_BRIDGE_BASE_URL}/t/&lt;tenantId&gt;/oidc/token</code> →{' '}
        <code className="font-mono">id_token</code>. The consumer-backend endpoint (
        <code className="font-mono">{EXCHANGE_ENDPOINT}</code>) is not deployed on the static
        sdk-example site, so the card is demo-only — it surfaces the bridge/flow shape rather than a
        live exchange. See{' '}
        <a
          href="https://docs.aitc.dev/guides/oidc-bridge"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          the consumer-backend pattern guide
        </a>{' '}
        to wire up your own backend.
      </p>
      <ApiCard
        name="appLogin → /oidc/token"
        description="Exchange a Toss authorizationCode for an OIDC id_token via your backend"
        params={[
          {
            name: 'referrer',
            label: 'referrer',
            type: 'select',
            defaultValue: 'DEFAULT',
            options: [
              { label: 'DEFAULT', value: 'DEFAULT' },
              { label: 'SANDBOX', value: 'SANDBOX' },
            ],
          },
        ]}
        execute={({ referrer }) => exchange(referrer)}
        snippet={oidcExchangeSnippet}
      />
      <ApiCard
        name="Firebase (OIDC provider)"
        description="Same id_token, consumed via Firebase Identity Platform's OIDC provider"
        params={[
          {
            name: 'referrer',
            label: 'referrer',
            type: 'select',
            defaultValue: 'DEFAULT',
            options: [
              { label: 'DEFAULT', value: 'DEFAULT' },
              { label: 'SANDBOX', value: 'SANDBOX' },
            ],
          },
        ]}
        execute={({ referrer }) => exchange(referrer)}
        snippet={oidcFirebaseSnippet}
      />
    </section>
  );
}
