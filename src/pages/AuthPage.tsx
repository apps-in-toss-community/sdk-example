import {
  appLogin,
  appsInTossSignTossCert,
  getIsTossLoginIntegratedService,
  getUserKeyForGame,
} from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { OidcBridgeSection } from '../components/OidcBridgeSection';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import appLoginSnippet from '../snippets/auth/appLogin.ts?raw';
import appsInTossSignTossCertSnippet from '../snippets/auth/appsInTossSignTossCert.ts?raw';
import getIsTossLoginIntegratedServiceSnippet from '../snippets/auth/getIsTossLoginIntegratedService.ts?raw';
import getUserKeyForGameSnippet from '../snippets/auth/getUserKeyForGame.ts?raw';

export function AuthPage() {
  return (
    <div>
      <PageHeader title="Auth" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="appLogin"
          description={t('pages.auth.appLogin.description')}
          params={[]}
          execute={() => appLogin()}
          snippet={appLoginSnippet}
        />
        <ApiCard
          name="getIsTossLoginIntegratedService"
          description={t('pages.auth.getIsTossLoginIntegratedService.description')}
          params={[]}
          execute={async () => getIsTossLoginIntegratedService()}
          snippet={getIsTossLoginIntegratedServiceSnippet}
        />
        <ApiCard
          name="getUserKeyForGame"
          description={t('pages.auth.getUserKeyForGame.description')}
          params={[]}
          execute={() => getUserKeyForGame()}
          snippet={getUserKeyForGameSnippet}
        />
        <ApiCard
          name="appsInTossSignTossCert"
          description={t('pages.auth.appsInTossSignTossCert.description')}
          params={[{ name: 'txId', label: 'txId', placeholder: 'transaction-id' }]}
          execute={(p) => appsInTossSignTossCert({ txId: p.txId })}
          snippet={appsInTossSignTossCertSnippet}
        />
        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <OidcBridgeSection />
        </div>
      </div>
    </div>
  );
}
