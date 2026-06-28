import {
  closeView,
  getTossShareLink,
  openPDFViewer,
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
import { t } from '../i18n';
import closeViewSnippet from '../snippets/navigation/closeView.ts?raw';
import getTossShareLinkSnippet from '../snippets/navigation/getTossShareLink.ts?raw';
import navigatorShareSnippet from '../snippets/navigation/navigatorShare.ts?raw';
import openPDFViewerSnippet from '../snippets/navigation/openPDFViewer.ts?raw';
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
      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
        <PolyfillNotice webApis="navigator.share" />

        <ApiCard
          name="closeView"
          description={t('pages.navigation.closeView.description')}
          params={[]}
          execute={async () => {
            closeView();
          }}
          snippet={closeViewSnippet}
        />
        <ApiCard
          name="openURL"
          description={t('pages.navigation.openURL.description')}
          params={[{ name: 'url', label: 'URL', placeholder: 'https://example.com' }]}
          execute={async (p) => {
            await openURL(p.url);
          }}
          snippet={openURLSnippet}
        />
        <ApiCard
          name="openPDFViewer"
          description={t('pages.navigation.openPDFViewer.description')}
          params={[
            {
              name: 'data',
              label: 'Base64 PDF data',
              defaultValue: 'JVBERi0xLjQK',
            },
            {
              name: 'filename',
              label: 'Filename (optional)',
              defaultValue: 'document.pdf',
            },
          ]}
          execute={(p) => openPDFViewer({ data: p.data, filename: p.filename || undefined })}
          snippet={openPDFViewerSnippet}
        />
        <ApiCard
          name="share"
          description={t('pages.navigation.share.description')}
          params={[{ name: 'message', label: 'Message', placeholder: '공유할 메시지' }]}
          execute={async (p) => {
            await share({ message: p.message });
          }}
          snippet={shareSnippet}
        />
        <ApiCard
          name="getTossShareLink"
          description={t('pages.navigation.getTossShareLink.description')}
          params={[
            {
              name: 'path',
              label: 'Path',
              // intoss:// 형식의 딥링크 URI가 필요하다. 앱 이름 그대로가 기본값.
              defaultValue: 'intoss://aitc-sdk-example',
              placeholder: 'intoss://aitc-sdk-example',
            },
            { name: 'ogImageUrl', label: 'OG Image URL (optional)', placeholder: 'https://...' },
          ]}
          execute={(p) => getTossShareLink(p.path, p.ogImageUrl || undefined)}
          snippet={getTossShareLinkSnippet}
        />
        <ApiCard
          name="setIosSwipeGestureEnabled"
          description={t('pages.navigation.setIosSwipeGestureEnabled.description')}
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
          description={t('pages.navigation.setDeviceOrientation.description')}
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
          description={t('pages.navigation.setScreenAwakeMode.description')}
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
          description={t('pages.navigation.setSecureScreen.description')}
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
          description={t('pages.navigation.requestReview.description')}
          params={[]}
          execute={async () => {
            await requestReview();
          }}
          snippet={requestReviewSnippet}
        />

        <ApiCard
          name="navigator.share"
          description={t('pages.navigation.navigatorShare.description')}
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
