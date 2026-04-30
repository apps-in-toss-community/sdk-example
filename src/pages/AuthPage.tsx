import {
  appLogin,
  appsInTossSignTossCert,
  getIsTossLoginIntegratedService,
  getUserKeyForGame,
} from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { OidcBridgeSection } from '../components/OidcBridgeSection';
import { PageHeader } from '../components/PageHeader';
import appLoginSnippet from '../snippets/auth/appLogin.ts?raw';
import appsInTossSignTossCertSnippet from '../snippets/auth/appsInTossSignTossCert.ts?raw';
import getIsTossLoginIntegratedServiceSnippet from '../snippets/auth/getIsTossLoginIntegratedService.ts?raw';
import getUserKeyForGameSnippet from '../snippets/auth/getUserKeyForGame.ts?raw';

export function AuthPage() {
  // Trim trailing slash so a self-host URL like `https://oidc-bridge.example.com/`
  // doesn't produce `//verify` paths — strict reverse proxies 404 on those.
  const bridgeUrl = import.meta.env.VITE_OIDC_BRIDGE_URL?.replace(/\/$/, '');
  return (
    <div>
      <PageHeader title="Auth" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="appLogin"
          description="앱 로그인, authorizationCode 반환"
          params={[]}
          execute={async () => await appLogin()}
          snippet={appLoginSnippet}
        />
        <ApiCard
          name="getIsTossLoginIntegratedService"
          description="토스 로그인 연동 서비스 여부"
          params={[]}
          execute={async () => getIsTossLoginIntegratedService()}
          snippet={getIsTossLoginIntegratedServiceSnippet}
        />
        <ApiCard
          name="getUserKeyForGame"
          description="게임용 유저 해시 키"
          params={[]}
          execute={async () => await getUserKeyForGame()}
          snippet={getUserKeyForGameSnippet}
        />
        <ApiCard
          name="appsInTossSignTossCert"
          description="토스 인증서 서명"
          params={[{ name: 'txId', label: 'txId', placeholder: 'transaction-id' }]}
          execute={async (p) => await appsInTossSignTossCert({ txId: p.txId })}
          snippet={appsInTossSignTossCertSnippet}
        />
        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <OidcBridgeSection baseUrl={bridgeUrl} />
        </div>
      </div>
    </div>
  );
}
