import { getOperationalEnvironment, setIosSwipeGestureEnabled } from '@apps-in-toss/web-framework';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
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

// iOS swipe-back races with react-router history pop, exiting the mini-app
// after a couple of pops. SDK exposes
// setIosSwipeGestureEnabled exactly for apps that own their own navigation,
// so disable the native gesture and rely on PageHeader's back button.
// NavigationPage's demo card can still toggle it back on for inspection.
//
// Detection strategy — two layers:
//   1. getOperationalEnvironment() === 'toss'  (SDK constant bridge, primary)
//   2. 'ReactNativeWebView' in window           (RN bridge marker, fallback)
// Layer 1 reads __CONSTANT_HANDLER_MAP synchronously; if that map is not yet
// injected when the effect fires (rare WebView init race), layer 2 catches the
// gap. Both checks are synchronous and safe from useEffect.
function useDisableIosSwipeGestureInToss(): void {
  useEffect(() => {
    let isToss = false;
    try {
      isToss = getOperationalEnvironment() === 'toss';
    } catch {
      // __CONSTANT_HANDLER_MAP not yet populated — fall back to the RN bridge
      // presence marker that the Toss WebView always injects before JS runs.
      isToss = typeof window !== 'undefined' && 'ReactNativeWebView' in window;
    }
    if (!isToss) return;
    setIosSwipeGestureEnabled({ isEnabled: false }).catch(() => {});
  }, []);
}

export function App() {
  useDisableIosSwipeGestureInToss();
  // Honors Vite's BASE_URL so Pages (e.g. /sdk-example/) and 앱인토스 배포 (/) both work.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
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
