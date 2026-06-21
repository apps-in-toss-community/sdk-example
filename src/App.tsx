import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
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

/**
 * iOS swipe-back 가드를 Router context 안에서 마운트하기 위한 지점. UI 렌더 없음.
 * useNavigate는 BrowserRouter 자식에서만 호출 가능하므로 가드를 이 컴포넌트로 감싼다.
 */
function SwipeBackGuard(): null {
  const navigate = useNavigate();
  useIosSwipeBackGuard(navigate);
  return null;
}

export function App() {
  // Honors Vite's BASE_URL so Pages (e.g. /sdk-example/) and 앱인토스 배포 (/) both work.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
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
