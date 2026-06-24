import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { useIosSwipeBackGuard } from './hooks/useIosSwipeBackGuard';
// SCAFFOLD_DOMAIN_IMPORTS_BEGIN
import { AdsPage } from './pages/AdsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuthPage } from './pages/AuthPage';
import { CameraPage } from './pages/CameraPage';
import { ClipboardPage } from './pages/ClipboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { EnvironmentPage } from './pages/EnvironmentPage';
import { EventsPage } from './pages/EventsPage';
import { GamePage } from './pages/GamePage';
import { HapticPage } from './pages/HapticPage';
import { HomePage } from './pages/HomePage';
import { IAPPage } from './pages/IAPPage';
import { LocationPage } from './pages/LocationPage';
import { NavigationPage } from './pages/NavigationPage';
import { NotificationPage } from './pages/NotificationPage';
import { PartnerPage } from './pages/PartnerPage';
import { PaymentPage } from './pages/PaymentPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { StoragePage } from './pages/StoragePage';

// SCAFFOLD_DOMAIN_IMPORTS_END

// iOS edge-swipe-back 가드 — granite CanGoBackGuard 이식 (깊이별 네이티브 제스처 토글).
//
// 근본 원인 (#136): WKWebView는 실-document 로드와 react-router pushState 엔트리를
// 하나의 통합 세션 히스토리로 관리한다. pushState는 이 히스토리를 키우므로
// (실측: /environment에서 window.history.length === 2) WKWebView history entry가
// "1개뿐"이라는 건 사실이 아니다.
//
// edge-swipe가 pushState 스택 내부를 pop할 때는 popstate 이벤트가 발생하고
// react-router가 same-document in-app 뒤로를 처리한다(reload 없음). 문제는
// 스택 바닥의 document 경계(cold-load 문서 + scripts/build-route-html.ts가 생성하는
// 라우트별 실 HTML)를 넘어 pop할 때 발생한다 — WKWebView가 full document 로드
// (= 페이지 새로고침)를 수행하고, 바닥에서 한 번 더 pop하면 셸 밖 pop = 미니앱 종료.
// 이게 사용자가 보는 "swipe 시 새로고침/앱 종료"의 실제 원인이다.
//
// 이 SPA에서 "모든 깊이 swipe = in-app 뒤로"는 구조적으로 불가하다 — floor pop은
// 항상 document 로드이므로 JS로 가로챌 수 없다.
//
// 수정: 매 navigation마다 setIosSwipeGestureEnabled로 깊이별 제스처를 재확정한다:
//   root(idx=0)  → enabled  (swipe = 미니앱 정상 종료)
//   deep(idx≥1) → disabled (document 경계 도달 차단. in-app 뒤로는 PageHeader 버튼)
// 자세한 설계는 useIosSwipeBackGuard.ts 참조.

function SwipeBackGuard(): null {
  useIosSwipeBackGuard();
  return null;
}

export function App() {
  // Honors Vite's BASE_URL so Pages (e.g. /sdk-example/) and 앱인토스 배포 (/) both work.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        {/* SwipeBackGuard는 BrowserRouter 자식이어야 useLocation이 동작한다 */}
        <SwipeBackGuard />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            {/* SCAFFOLD_DOMAIN_ROUTES_BEGIN */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/navigation" element={<NavigationPage />} />
            <Route path="/environment" element={<EnvironmentPage />} />
            <Route path="/permissions" element={<PermissionsPage />} />
            <Route path="/storage" element={<StoragePage />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/clipboard" element={<ClipboardPage />} />
            <Route path="/haptic" element={<HapticPage />} />
            <Route path="/iap" element={<IAPPage />} />
            <Route path="/ads" element={<AdsPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/notification" element={<NotificationPage />} />
            {/* SCAFFOLD_DOMAIN_ROUTES_END */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
