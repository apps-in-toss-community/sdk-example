import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  handleGoHome = () => {
    window.location.href = import.meta.env.BASE_URL;
  };

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-[430px] min-h-screen bg-white shadow-sm flex items-center justify-center p-4">
          <div className="w-full rounded-xl border border-gray-200 bg-white p-5">
            <h1 className="text-base font-semibold text-gray-900">문제가 발생했어요</h1>
            <p className="mt-1 text-xs text-gray-500">
              렌더링 중 예기치 않은 에러가 발생했습니다.
            </p>
            <pre className="mt-3 bg-gray-50 rounded p-3 text-sm text-red-600 overflow-auto whitespace-pre-wrap font-mono">
              {error.message}
            </pre>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                다시 시도
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
