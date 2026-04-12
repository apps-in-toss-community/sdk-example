interface ResultViewProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: unknown;
  error?: string;
}

export function ResultView({ status, data, error }: ResultViewProps) {
  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  const isError = status === 'error';

  return (
    <div className={`mt-2 rounded-lg border px-3 py-2 ${isError ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
        {isError ? 'Error' : 'Success'}
      </span>
      <pre className="mt-1 text-xs text-gray-800 whitespace-pre-wrap break-all overflow-auto max-h-48">
        {isError ? error : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
