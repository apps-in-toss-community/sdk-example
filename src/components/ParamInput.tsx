interface ParamInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'toggle' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export function ParamInput({ label, value, onChange, type = 'text', options, placeholder }: ParamInputProps) {
  if (type === 'toggle') {
    return (
      <label className="flex items-center justify-between py-1.5">
        <span className="text-sm text-gray-700">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={value === 'true'}
          onClick={() => onChange(value === 'true' ? 'false' : 'true')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value === 'true' ? 'bg-gray-900' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${value === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </label>
    );
  }

  if (type === 'select' && options) {
    return (
      <label className="block py-1.5">
        <span className="text-sm text-gray-700">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block py-1.5">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type={type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
      />
    </label>
  );
}
