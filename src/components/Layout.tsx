import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-[430px] min-h-screen bg-white shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}
