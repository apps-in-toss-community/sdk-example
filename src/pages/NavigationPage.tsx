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
import { PolyfillNotice } from '../components/PolyfillNotice';
import closeViewSnippet from '../snippets/navigation/closeView.ts?raw';
import getTossShareLinkSnippet from '../snippets/navigation/getTossShareLink.ts?raw';
import navigatorShareSnippet from '../snippets/navigation/navigatorShare.ts?raw';
import openURLSnippet from '../snippets/navigation/openURL.ts?raw';
import requestReviewSnippet from '../snippets/navigation/requestReview.ts?raw';
import setDeviceOrientationSnippet from '../snippets/navigation/setDeviceOrientation.ts?raw';
import setIosSwipeGestureEnabledSnippet from '../snippets/navigation/setIosSwipeGestureEnabled.ts?raw';
import setScreenAwakeModeSnippet from '../snippets/navigation/setScreenAwakeMode.ts?raw';
import setSecureScreenSnippet from '../snippets/navigation/setSecureScreen.ts?raw';
import shareSnippet from '../snippets/navigation/share.ts?raw';

export function NavigationPage() {
  return (
    <div>
      <PageHeader title="Navigation" />
      <div className="p-4 space-y-3">
        <PolyfillNotice webApis="navigator.share" />

        <ApiCard
          name="closeView"
          description="SDK — 현재 뷰 닫기"
          params={[]}
          execute={async () => {
            closeView();
          }}
          snippet={closeViewSnippet}
        />
        <ApiCard
          name="openURL"
          description="SDK — URL 열기"
          params={[{ name: 'url', label: 'URL', placeholder: 'https://example.com' }]}
          execute={async (p) => {
            openURL(p.url);
          }}
          snippet={openURLSnippet}
        />
        <ApiCard
          name="share"
          description="SDK — 메시지 공유"
          params={[{ name: 'message', label: 'Message', placeholder: '공유할 메시지' }]}
          execute={async (p) => {
            await share({ message: p.message });
          }}
          snippet={shareSnippet}
        />
        <ApiCard
          name="getTossShareLink"
          description="토스 공유 링크 생성"
          params={[
            { name: 'path', label: 'Path', placeholder: '/some/path' },
            { name: 'ogImageUrl', label: 'OG Image URL (optional)', placeholder: 'https://...' },
          ]}
          execute={(p) => getTossShareLink(p.path, p.ogImageUrl || undefined)}
          snippet={getTossShareLinkSnippet}
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
          snippet={setIosSwipeGestureEnabledSnippet}
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
          snippet={setDeviceOrientationSnippet}
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
          execute={(p) => setScreenAwakeMode({ enabled: p.enabled })}
          snippet={setScreenAwakeModeSnippet}
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
          execute={(p) => setSecureScreen({ enabled: p.enabled })}
          snippet={setSecureScreenSnippet}
        />
        <ApiCard
          name="requestReview"
          description="앱 리뷰 요청"
          params={[]}
          execute={async () => {
            await requestReview();
          }}
          snippet={requestReviewSnippet}
        />

        <ApiCard
          name="navigator.share"
          description="표준 Web API (via @ait-co/polyfill)"
          params={[
            { name: 'title', label: 'Title (optional)', placeholder: '공유 제목' },
            { name: 'text', label: 'Text', placeholder: '공유할 본문' },
            { name: 'url', label: 'URL (optional)', placeholder: 'https://example.com' },
          ]}
          execute={async (p) => {
            const payload: ShareData = {};
            if (p.title) payload.title = p.title;
            if (p.text) payload.text = p.text;
            if (p.url) payload.url = p.url;
            await navigator.share(payload);
          }}
          snippet={navigatorShareSnippet}
        />
      </div>
    </div>
  );
}
