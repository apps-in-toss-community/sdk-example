interface CodeSnippetProps {
  code: string;
  /** Optional aria label for the code panel. Defaults to "Source snippet". */
  label?: string;
}

/**
 * Plain-text source snippet panel. No syntax highlighter — keeps bundle small
 * and avoids the "AI generic chrome" look. Mono font + subtle darker bg.
 *
 * Loaded via Vite `?raw` imports at the call site, so the displayed code is
 * the actual file content, not a string we keep in sync by hand.
 */
export function CodeSnippet({ code, label = 'Source snippet' }: CodeSnippetProps) {
  return (
    <figure aria-label={label} className="m-0">
      <pre
        // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region needs keyboard reachability per WAI-ARIA APG
        tabIndex={0}
        className="m-0 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
      >
        <code>{code.replace(/\n+$/, '')}</code>
      </pre>
    </figure>
  );
}
