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

// iOS swipe-back guard — mechanism-agnostic root sentinel approach.
//
// Root cause: BrowserRouter shares window.history with the native edge-swipe.
// When the user swipes back past the first react-router entry (idx 0), the
// native layer pops the WebView history to a phantom floor and closes the
// mini-app. Disabling the gesture entirely (previous approach) fixed the crash
// but broke the expected UX (swipe → in-app back navigation).
//
// Fix: re-enable the native gesture and guard the history floor instead.
//   1. On mount, pin a sentinel entry below the real root so that one native
//      swipe-back always hits the sentinel rather than closing the app.
//   2. Listen for popstate. When the event lands on the sentinel (detected by
//      event.state?.idx being absent / < 0, i.e. not a valid react-router
//      entry), re-push the root entry to absorb the pop without navigating.
//   3. All other popstate events (idx >= 0) pass through untouched so that
//      react-router handles normal in-app back navigation.
//
// Opt-out: append ?noSwipeGuard=1 to the URL to skip the guard (sentinel is
// still pinned but popstate re-push is suppressed). Useful for debugging the
// guard itself in a browser where history inspection is easy.
//
// Environment gate: the guard is active only in the Toss WebView (detected
// via the same two-layer strategy as the previous approach). In the local
// browser (env-1) the gate is false → no sentinel, no listener, zero diff.
//
// Detection strategy — two layers:
//   1. getOperationalEnvironment() === 'toss'  (SDK constant bridge, primary)
//   2. 'ReactNativeWebView' in window           (RN bridge marker, fallback)

/**
 * Returns true when a popstate event should be absorbed (i.e. the pop went
 * below react-router's first real entry and must be re-pushed to avoid closing
 * the mini-app).
 *
 * react-router v7 BrowserRouter stamps every history entry with
 * `{ idx: number, key: string }`. A sentinel entry that we push manually has
 * no such state, so `state?.idx` is undefined. We treat idx < 0 or absent as
 * "below the app floor".
 *
 * Exported as a pure function so it can be unit-tested without a DOM.
 */
export function shouldAbsorbPop(state: unknown): boolean {
  if (state === null || state === undefined) return true;
  if (typeof state !== 'object') return true;
  const idx = (state as Record<string, unknown>).idx;
  if (idx === undefined || idx === null) return true;
  return typeof idx === 'number' && idx < 0;
}

function useEnableIosSwipeBackWithRootGuard(): void {
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

    // Re-enable the native iOS swipe-back gesture (was disabled before).
    setIosSwipeGestureEnabled({ isEnabled: true }).catch(() => {});

    // Pin a sentinel entry below the current root so that the first native
    // swipe-back always has something to land on. We push with a null state
    // so that shouldAbsorbPop() can distinguish it from real router entries.
    //
    // We do this *before* registering the popstate listener to avoid a
    // race where a very fast swipe fires before the listener is attached.
    window.history.pushState(null, '');
    // Restore the original entry on top so the router sees no change.
    window.history.go(1);

    const noGuard =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('noSwipeGuard') === '1';

    const handlePopState = (event: PopStateEvent) => {
      if (noGuard) return;
      if (shouldAbsorbPop(event.state)) {
        // We've hit the sentinel floor. Re-push the root to absorb the pop.
        window.history.pushState(event.state, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}

export function App() {
  useEnableIosSwipeBackWithRootGuard();
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
