import { appLogin } from '@apps-in-toss/web-framework';
import oidcFirebaseTokenSnippet from '../snippets/auth/oidcFirebaseToken.ts?raw';
import oidcVerifySnippet from '../snippets/auth/oidcVerify.ts?raw';
import { ApiCard } from './ApiCard';

const BRIDGE_REPO_URL = 'https://github.com/apps-in-toss-community/oidc-bridge';
export const OIDC_BRIDGE_BASE_URL = 'https://oidc-bridge.aitc.dev';

/** Shape documented by oidc-bridge `POST /verify`. */
interface VerifyResponse {
  sub: string;
  provider: 'toss';
  claims: Record<string, unknown>;
  tossAccessTokenExpiresAt: number;
}

/** OAuth 2.0 / OIDC error envelope used by every oidc-bridge endpoint. */
interface OAuthErrorBody {
  error: string;
  error_description?: string;
}

/**
 * Distinguish bridge-side errors (HTTP non-2xx with structured body) from
 * client-side network failures (fetch rejection, CORS, DNS, bridge down).
 * Both surface in the standard ApiCard error panel via `Error.message`.
 */
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
      `Network error contacting oidc-bridge (${cause}). Is it reachable from this origin? Check CORS/ALLOWED_ORIGINS.`,
    );
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    throw new Error(`oidc-bridge returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    const errorBody = parsed as Partial<OAuthErrorBody>;
    const code = errorBody.error ?? `http_${response.status}`;
    const description = errorBody.error_description ?? response.statusText;
    throw new Error(`${code}: ${description}`);
  }
  return parsed as T;
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
        <code className="font-mono">authorizationCode</code> into normalized OIDC claims (and, when
        self-hosted with a Firebase service account, a Firebase custom token). Best-effort, no SLA —
        security-sensitive workloads should self-host.
      </p>
      <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
        Bridge: <span className="font-mono">{OIDC_BRIDGE_BASE_URL}</span>
      </p>
      <ApiCard
        name="POST /verify"
        description="appLogin() → exchange authorizationCode for normalized claims"
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
        execute={async ({ referrer }) => {
          const { authorizationCode } = await appLogin();
          return await postJson<VerifyResponse>(`${OIDC_BRIDGE_BASE_URL}/verify`, {
            authorizationCode,
            referrer,
          });
        }}
        snippet={oidcVerifySnippet}
      />
      <ApiCard
        name="POST /firebase-token"
        description="Self-host only. Public instance responds 501 not_configured."
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
        execute={async ({ referrer }) => {
          const { authorizationCode } = await appLogin();
          return await postJson<unknown>(`${OIDC_BRIDGE_BASE_URL}/firebase-token`, {
            authorizationCode,
            referrer,
          });
        }}
        snippet={oidcFirebaseTokenSnippet}
      />
    </section>
  );
}
