import {
  closeView,
  getTossShareLink,
  openURL,
  requestReview,
  setDeviceOrientation,
  setIosSwipeGestureEnabled,
  setScreenAwakeMode,
  setSecureScreen,
  share,
} from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';

export function NavigationPage() {
  return (
    <div>
      <PageHeader title="Navigation" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="closeView"
          description="현재 뷰 닫기"
          params={[]}
          execute={async () => {
            closeView();
          }}
        />
        <ApiCard
          name="openURL"
          description="URL 열기"
          params={[{ name: 'url', label: 'URL', placeholder: 'https://example.com' }]}
          execute={async (p) => {
            openURL(p.url);
          }}
        />
        <ApiCard
          name="share"
          description="메시지 공유"
          params={[{ name: 'message', label: 'Message', placeholder: '공유할 메시지' }]}
          execute={async (p) => {
            await share({ message: p.message });
          }}
        />
        <ApiCard
          name="getTossShareLink"
          description="토스 공유 링크 생성"
          params={[
            { name: 'path', label: 'Path', placeholder: '/some/path' },
            { name: 'ogImageUrl', label: 'OG Image URL (optional)', placeholder: 'https://...' },
          ]}
          execute={async (p) => await getTossShareLink(p.path, p.ogImageUrl || undefined)}
        />
        <ApiCard
          name="setIosSwipeGestureEnabled"
          description="iOS 스와이프 제스처 활성화"
          params={[
            {
              name: 'isEnabled',
              label: 'Enabled',
              type: 'toggle',
              defaultValue: 'true',
              parse: (v) => v === 'true',
            },
          ]}
          execute={async (p) => {
            setIosSwipeGestureEnabled({ isEnabled: p.isEnabled });
          }}
        />
        <ApiCard
          name="setDeviceOrientation"
          description="화면 방향 설정"
          params={[
            {
              name: 'type',
              label: 'Orientation',
              type: 'select',
              // SDK only supports 'portrait' | 'landscape'
              options: [
                { label: 'Portrait', value: 'portrait' },
                { label: 'Landscape', value: 'landscape' },
              ],
              defaultValue: 'portrait',
              parse: (v) => v as 'portrait' | 'landscape',
            },
          ]}
          execute={async (p) => {
            setDeviceOrientation({ type: p.type });
          }}
        />
        <ApiCard
          name="setScreenAwakeMode"
          description="화면 꺼짐 방지"
          params={[
            {
              name: 'enabled',
              label: 'Enabled',
              type: 'toggle',
              defaultValue: 'true',
              parse: (v) => v === 'true',
            },
          ]}
          execute={async (p) => await setScreenAwakeMode({ enabled: p.enabled })}
        />
        <ApiCard
          name="setSecureScreen"
          description="보안 화면 설정"
          params={[
            {
              name: 'enabled',
              label: 'Enabled',
              type: 'toggle',
              defaultValue: 'true',
              parse: (v) => v === 'true',
            },
          ]}
          execute={async (p) => await setSecureScreen({ enabled: p.enabled })}
        />
        <ApiCard
          name="requestReview"
          description="앱 리뷰 요청"
          params={[]}
          execute={async () => {
            await requestReview();
          }}
        />
      </div>
    </div>
  );
}
