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
      <div className="p-4 space-y-3">
        <PolyfillNotice webApis="navigator.onLine / navigator.connection" />

        <ApiCard
          name="getPlatformOS"
          description="SDK — 플랫폼 OS"
          params={[]}
          execute={async () => getPlatformOS()}
          snippet={getPlatformOSSnippet}
        />
        <ApiCard
          name="getOperationalEnvironment"
          description="SDK — 실행 환경"
          params={[]}
          execute={async () => getOperationalEnvironment()}
          snippet={getOperationalEnvironmentSnippet}
        />
        <ApiCard
          name="getNetworkStatus"
          description="SDK — 네트워크 상태"
          params={[]}
          execute={async () => await getNetworkStatus()}
          snippet={getNetworkStatusSnippet}
        />
        <ApiCard
          name="getTossAppVersion"
          description="토스 앱 버전"
          params={[]}
          execute={async () => getTossAppVersion()}
          snippet={getTossAppVersionSnippet}
        />
        <ApiCard
          name="isMinVersionSupported"
          description="최소 버전 지원 확인"
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
          description="현재 scheme URI"
          params={[]}
          execute={async () => getSchemeUri()}
          snippet={getSchemeUriSnippet}
        />
        <ApiCard
          name="getLocale"
          description="로케일"
          params={[]}
          execute={async () => getLocale()}
          snippet={getLocaleSnippet}
        />
        <ApiCard
          name="getDeviceId"
          description="디바이스 ID"
          params={[]}
          execute={async () => getDeviceId()}
          snippet={getDeviceIdSnippet}
        />
        <ApiCard
          name="getGroupId"
          description="그룹 ID"
          params={[]}
          execute={async () => getGroupId()}
          snippet={getGroupIdSnippet}
        />
        <ApiCard
          name="getServerTime"
          description="서버 시간"
          params={[]}
          execute={async () => await getServerTime()}
          snippet={getServerTimeSnippet}
        />
        <ApiCard
          name="env.getDeploymentId"
          description="배포 ID"
          params={[]}
          execute={async () => env.getDeploymentId()}
          snippet={envGetDeploymentIdSnippet}
        />
        <ApiCard
          name="getAppsInTossGlobals"
          description="앱인토스 글로벌 설정"
          params={[]}
          execute={async () => getAppsInTossGlobals()}
          snippet={getAppsInTossGlobalsSnippet}
        />
        <ApiCard
          name="SafeAreaInsets.get"
          description="Safe Area Insets"
          params={[]}
          execute={async () => SafeAreaInsets.get()}
          snippet={safeAreaInsetsGetSnippet}
        />
        <ApiCard
          name="getSafeAreaInsets"
          description="Safe Area Insets (legacy)"
          params={[]}
          execute={async () => getSafeAreaInsets()}
          snippet={getSafeAreaInsetsSnippet}
        />

        <ApiCard
          name="navigator.onLine"
          description="표준 Web API (via @ait-co/polyfill)"
          params={[]}
          execute={async () => navigator.onLine}
          snippet={navigatorOnlineSnippet}
        />
        <ApiCard
          name="navigator.connection"
          description="표준 Web API (via @ait-co/polyfill) — NetworkInformation snapshot"
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
