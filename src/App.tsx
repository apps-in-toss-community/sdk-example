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
// 근본 원인 (#136): BrowserRouter SPA는 WKWebView history entry가 1개뿐이어서
// edge-swipe가 WKWebView 밖(셸)으로 pop → 미니앱 종료.
//
// 수정: backEvent/popstate를 가로채지 않는다 — edge-swipe는 JS 경로를 안 거친다
// (prod.ios.rn84.js 디스어셈블 확인). 대신 매 navigation마다 setIosSwipeGestureEnabled로
// 네이티브 제스처를 깊이별로 재확정한다:
//   root(idx=0)  → enabled  (swipe = 미니앱 정상 종료)
//   deep(idx≥1) → disabled (셸 밖 pop 방지, in-app 뒤로는 PageHeader 버튼)
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
