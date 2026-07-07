// 측정 브랜치(qa/3x-cell) 전용 — 3.0 런타임에서 in-app debug gate가 무신호로
// 차단되는 층을 폰 화면에서 직접 읽기 위한 진단 오버레이 (sdk-example #284).
//
// devtools in-app gate는 ① location.hostname allowlist → ② `_deploymentId`
// → ③ `debug=1` → ④ `relay=wss` 순서로 검사하며, 전 단계가 2.x 런타임의
// "scheme 쿼리 → location.search 전파 + private-apps 호스트 서빙" 계약을
// 전제한다. 3.0 신규 로더(`host` 파라미터, `sources/` 레이아웃)가 그 계약을
// 지키는지 이 오버레이의 불리언만으로 판정한다.
//
// SECRET-HANDLING: 파라미터/호스트의 값은 절대 렌더하지 않는다 — 존재 여부
// Y/N, 라벨 수, 마지막 2라벨 suffix(공개 TLD 수준)까지만.
const PRIVATE_APPS_SUFFIX = '.private-apps.tossmini.com';
const PARAM_NAMES = ['_deploymentId', 'debug', 'relay', 'at', 'host'] as const;

function describeGateInputs(): string[] {
  const { hostname, protocol, search, hash } = window.location;
  const labels = hostname === '' ? [] : hostname.split('.');
  const params = new URLSearchParams(search);
  const hostAllow =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.trycloudflare.com') ||
    hostname.endsWith(PRIVATE_APPS_SUFFIX);
  return [
    `proto: ${protocol}`,
    `host-allow: ${hostAllow ? 'Y' : 'N'} (labels=${labels.length}, suffix2=${labels.slice(-2).join('.') || '(none)'})`,
    `search.len: ${search.length} hash.len: ${hash.length}`,
    `params: ${PARAM_NAMES.map((k) => `${k}=${params.has(k) ? 'Y' : 'N'}`).join(' ')}`,
  ];
}

function mountProbe(): void {
  const el = document.createElement('div');
  el.id = 'ait-gate-probe';
  el.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'right:0',
    'z-index:2147483647',
    'background:rgba(0,0,0,0.85)',
    'color:#7CFC00',
    'font:11px/1.6 ui-monospace,monospace',
    'padding:6px 8px',
    'pointer-events:none',
    'white-space:pre-wrap',
    'word-break:break-all',
  ].join(';');
  el.textContent = `[gate-probe]\n${describeGateInputs().join('\n')}`;
  document.body.appendChild(el);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountProbe, { once: true });
} else {
  mountProbe();
}

export {};
