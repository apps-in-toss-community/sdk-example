import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { NavigationPage } from './pages/NavigationPage';
import { EnvironmentPage } from './pages/EnvironmentPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { StoragePage } from './pages/StoragePage';
import { LocationPage } from './pages/LocationPage';
import { CameraPage } from './pages/CameraPage';
import { ContactsPage } from './pages/ContactsPage';
import { ClipboardPage } from './pages/ClipboardPage';
import { HapticPage } from './pages/HapticPage';
import { IAPPage } from './pages/IAPPage';
import { AdsPage } from './pages/AdsPage';
import { GamePage } from './pages/GamePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PartnerPage } from './pages/PartnerPage';
import { EventsPage } from './pages/EventsPage';

export function App() {
  // Honors Vite's BASE_URL so Pages (e.g. /sdk-example/) and 앱인토스 배포 (/) both work.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
