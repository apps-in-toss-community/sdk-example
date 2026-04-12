import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import {
  getPlatformOS,
  getOperationalEnvironment,
  getNetworkStatus,
  getTossAppVersion,
  isMinVersionSupported,
  getSchemeUri,
  getLocale,
  getDeviceId,
  getGroupId,
  getServerTime,
  env,
  getAppsInTossGlobals,
  SafeAreaInsets,
  getSafeAreaInsets,
} from '@apps-in-toss/web-framework';

export function EnvironmentPage() {
  return (
    <div>
      <PageHeader title="Environment" />
      <div className="p-4 space-y-3">
        <ApiCard name="getPlatformOS" description="플랫폼 OS" execute={async () => getPlatformOS()} />
        <ApiCard name="getOperationalEnvironment" description="실행 환경" execute={async () => getOperationalEnvironment()} />
        <ApiCard name="getNetworkStatus" description="네트워크 상태" execute={async () => await getNetworkStatus()} />
        <ApiCard name="getTossAppVersion" description="토스 앱 버전" execute={async () => getTossAppVersion()} />
        <ApiCard
          name="isMinVersionSupported"
          description="최소 버전 지원 확인"
          params={[
            { name: 'android', label: 'Android', placeholder: '5.0.0', defaultValue: '5.0.0' },
            { name: 'ios', label: 'iOS', placeholder: '5.0.0', defaultValue: '5.0.0' },
          ]}
          execute={async (p) => isMinVersionSupported({
            android: p.android as `${number}.${number}.${number}` | 'always' | 'never',
            ios: p.ios as `${number}.${number}.${number}` | 'always' | 'never',
          })}
        />
        <ApiCard name="getSchemeUri" description="현재 scheme URI" execute={async () => getSchemeUri()} />
        <ApiCard name="getLocale" description="로케일" execute={async () => getLocale()} />
        <ApiCard name="getDeviceId" description="디바이스 ID" execute={async () => getDeviceId()} />
        <ApiCard name="getGroupId" description="그룹 ID" execute={async () => getGroupId()} />
        <ApiCard name="getServerTime" description="서버 시간" execute={async () => await getServerTime()} />
        <ApiCard name="env.getDeploymentId" description="배포 ID" execute={async () => env.getDeploymentId()} />
        <ApiCard name="getAppsInTossGlobals" description="앱인토스 글로벌 설정" execute={async () => getAppsInTossGlobals()} />
        <ApiCard name="SafeAreaInsets.get" description="Safe Area Insets" execute={async () => SafeAreaInsets.get()} />
        <ApiCard name="getSafeAreaInsets" description="Safe Area Insets (legacy)" execute={async () => getSafeAreaInsets()} />
      </div>
    </div>
  );
}
