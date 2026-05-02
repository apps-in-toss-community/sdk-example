/**
 * AITC.DEV brand mark for the sdk-example app header.
 *
 * Inline SVG mirrors `meta/brand/aitc-mark.svg` (rect rx≈20%, Pretendard
 * ExtraBold "AITC", #3182f6 background) so the wordmark stays visually
 * aligned with favicon / OG image / mini-app screenshots.
 */
export function BrandMark() {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100 dark:bg-gray-900 dark:border-gray-800">
      <svg
        width="22"
        height="22"
        viewBox="0 0 512 512"
        role="img"
        aria-label="AITC"
        className="shrink-0"
      >
        <title>AITC</title>
        <rect width="512" height="512" rx="102" ry="102" fill="#3182f6" />
        <text
          x="256"
          y="256"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontWeight={800}
          fontSize={200}
          letterSpacing={-6}
          fill="#ffffff"
        >
          AITC
        </text>
      </svg>
      <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        <span className="text-[#3182f6] dark:text-[#5b9cff]">AITC.DEV</span>
        <span className="text-gray-400 dark:text-gray-500 mx-1.5">·</span>
        <span>SDK Example</span>
      </span>
    </div>
  );
}
