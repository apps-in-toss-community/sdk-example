import { useNavigate } from 'react-router-dom';

export function PageHeader({ title }: { title: string }) {
  const navigate = useNavigate();

  return (
    <nav aria-label="페이지 헤더">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="뒤로가기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </header>
    </nav>
  );
}
