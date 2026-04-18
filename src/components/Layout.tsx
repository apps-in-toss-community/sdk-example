import { Outlet } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets';

export function Layout() {
  const insets = useSafeAreaInsets();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div
        className="mx-auto max-w-[430px] min-h-screen bg-white shadow-sm dark:bg-gray-900 dark:shadow-none"
        style={{
          paddingTop: `max(${insets.top}px, env(safe-area-inset-top))`,
          paddingBottom: `max(${insets.bottom}px, env(safe-area-inset-bottom))`,
          paddingLeft: `max(${insets.left}px, env(safe-area-inset-left))`,
          paddingRight: `max(${insets.right}px, env(safe-area-inset-right))`,
        }}
      >
        <DemoBanner />
        <Outlet />
      </div>
    </div>
  );
}
