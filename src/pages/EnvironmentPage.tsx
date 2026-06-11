import {
  env,
  getAppsInTossGlobals,
  getDeviceId,
  getGroupId,
  getLocale,
  getNetworkStatus,
  getOperationalEnvironment,
  getPlatformOS,
  getSafeAreaInsets,
  getSchemeUri,
  getServerTime,
  getTossAppVersion,
  isMinVersionSupported,
  SafeAreaInsets,
} from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { PolyfillNotice } from '../components/PolyfillNotice';
import { t } from '../i18n';
import envGetDeploymentIdSnippet from '../snippets/environment/envGetDeploymentId.ts?raw';
import getAppsInTossGlobalsSnippet from '../snippets/environment/getAppsInTossGlobals.ts?raw';
import getDeviceIdSnippet from '../snippets/environment/getDeviceId.ts?raw';
import getGroupIdSnippet from '../snippets/environment/getGroupId.ts?raw';
import getLocaleSnippet from '../snippets/environment/getLocale.ts?raw';
import getNetworkStatusSnippet from '../snippets/environment/getNetworkStatus.ts?raw';
import getOperationalEnvironmentSnippet from '../snippets/environment/getOperationalEnvironment.ts?raw';
import getPlatformOSSnippet from '../snippets/environment/getPlatformOS.ts?raw';
import getSafeAreaInsetsSnippet from '../snippets/environment/getSafeAreaInsets.ts?raw';
import getSchemeUriSnippet from '../snippets/environment/getSchemeUri.ts?raw';
import getServerTimeSnippet from '../snippets/environment/getServerTime.ts?raw';
import getTossAppVersionSnippet from '../snippets/environment/getTossAppVersion.ts?raw';
import isMinVersionSupportedSnippet from '../snippets/environment/isMinVersionSupported.ts?raw';
import navigatorConnectionSnippet from '../snippets/environment/navigatorConnection.ts?raw';
import navigatorOnlineSnippet from '../snippets/environment/navigatorOnline.ts?raw';
import safeAreaInsetsGetSnippet from '../snippets/environment/safeAreaInsetsGet.ts?raw';

export function EnvironmentPage() {
  return (
    <div>
      <PageHeader title="Environment" />
      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
        <PolyfillNotice webApis="navigator.onLine / navigator.connection" />

        <ApiCard
          name="getPlatformOS"
          description={t('pages.environment.getPlatformOS.description')}
          params={[]}
          execute={async () => getPlatformOS()}
          snippet={getPlatformOSSnippet}
        />
        <ApiCard
          name="getOperationalEnvironment"
          description={t('pages.environment.getOperationalEnvironment.description')}
          params={[]}
          execute={async () => getOperationalEnvironment()}
          snippet={getOperationalEnvironmentSnippet}
        />
        <ApiCard
          name="getNetworkStatus"
          description={t('pages.environment.getNetworkStatus.description')}
          params={[]}
          execute={() => getNetworkStatus()}
          snippet={getNetworkStatusSnippet}
        />
        <ApiCard
          name="getTossAppVersion"
          description={t('pages.environment.getTossAppVersion.description')}
          params={[]}
          execute={async () => getTossAppVersion()}
          snippet={getTossAppVersionSnippet}
        />
        <ApiCard
          name="isMinVersionSupported"
          description={t('pages.environment.isMinVersionSupported.description')}
          params={[
            { name: 'android', label: 'Android', placeholder: '5.0.0', defaultValue: '5.0.0' },
            { name: 'ios', label: 'iOS', placeholder: '5.0.0', defaultValue: '5.0.0' },
          ]}
          execute={async (p) =>
            isMinVersionSupported({
              android: p.android as `${number}.${number}.${number}` | 'always' | 'never',
              ios: p.ios as `${number}.${number}.${number}` | 'always' | 'never',
            })
          }
          snippet={isMinVersionSupportedSnippet}
        />
        <ApiCard
          name="getSchemeUri"
          description={t('pages.environment.getSchemeUri.description')}
          params={[]}
          execute={async () => getSchemeUri()}
          snippet={getSchemeUriSnippet}
        />
        <ApiCard
          name="getLocale"
          description={t('pages.environment.getLocale.description')}
          params={[]}
          execute={async () => getLocale()}
          snippet={getLocaleSnippet}
        />
        <ApiCard
          name="getDeviceId"
          description={t('pages.environment.getDeviceId.description')}
          params={[]}
          execute={async () => getDeviceId()}
          snippet={getDeviceIdSnippet}
        />
        <ApiCard
          name="getGroupId"
          description={t('pages.environment.getGroupId.description')}
          params={[]}
          execute={async () => getGroupId()}
          snippet={getGroupIdSnippet}
        />
        <ApiCard
          name="getServerTime"
          description={t('pages.environment.getServerTime.description')}
          params={[]}
          execute={() => getServerTime()}
          snippet={getServerTimeSnippet}
        />
        <ApiCard
          name="env.getDeploymentId"
          description={t('pages.environment.envGetDeploymentId.description')}
          params={[]}
          execute={async () => env.getDeploymentId()}
          snippet={envGetDeploymentIdSnippet}
        />
        <ApiCard
          name="getAppsInTossGlobals"
          description={t('pages.environment.getAppsInTossGlobals.description')}
          params={[]}
          execute={async () => getAppsInTossGlobals()}
          snippet={getAppsInTossGlobalsSnippet}
        />
        <ApiCard
          name="SafeAreaInsets.get"
          description={t('pages.environment.safeAreaInsetsGet.description')}
          notes={[
            t('pages.environment.safeAreaInsetsGet.notes.partnerTop'),
            t('pages.environment.safeAreaInsetsGet.notes.subscribeStale'),
          ]}
          params={[]}
          execute={async () => SafeAreaInsets.get()}
          snippet={safeAreaInsetsGetSnippet}
        />
        <ApiCard
          name="getSafeAreaInsets"
          description={t('pages.environment.getSafeAreaInsets.description')}
          params={[]}
          execute={async () => getSafeAreaInsets()}
          snippet={getSafeAreaInsetsSnippet}
        />

        <ApiCard
          name="navigator.onLine"
          description={t('pages.environment.navigatorOnline.description')}
          params={[]}
          execute={async () => navigator.onLine}
          snippet={navigatorOnlineSnippet}
        />
        <ApiCard
          name="navigator.connection"
          description={t('pages.environment.navigatorConnection.description')}
          params={[]}
          execute={async () => {
            const c = navigator.connection;
            if (!c) return { available: false };
            return {
              available: true,
              type: c.type,
              effectiveType: c.effectiveType,
              downlink: c.downlink,
              rtt: c.rtt,
              saveData: c.saveData,
            };
          }}
          snippet={navigatorConnectionSnippet}
        />
      </div>
    </div>
  );
}
