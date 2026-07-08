// 측정 브랜치(qa/3x-cell) 전용 — 3.0 런타임에서 in-app debug gate가 무신호로
// 차단되는 층을 폰 화면에서 직접 읽기 위한 진단 오버레이 (sdk-example #284).
//
// devtools in-app gate는 ① location.hostname allowlist → ② `_deploymentId`
// → ③ `debug=1` → ④ `relay=wss` 순서로 검사하며, 전 단계가 2.x 런타임의
// "scheme 쿼리 → location.search 전파 + private-apps 호스트 서빙" 계약을
// 전제한다. 3.0 신규 로더(`host` 파라미터, `sources/` 레이아웃)가 그 계약을
// 지키는지 이 오버레이의 불리언만으로 판정한다.
//
// SECRET-HANDLING: URL 전체(location.href)는 **기기 화면 렌더 한정**으로
// 허용한다 — 이 페이지는 QR을 스캔한 기기에서만 열리므로, 기기는 relay/at
// 값을 이미 보유하고 있고(QR 대시보드도 같은 URL을 평문 표시) 화면 표시는
// 새 노출이 아니다. 단, 이 값을 콘솔 로그·리포트·relay 이벤트로 되돌려
// 보내는 코드는 금지 — 세션 로그 경계 밖으로 값이 나가면 안 된다.
import { getSchemeUri } from '@apps-in-toss/web-framework';

const PRIVATE_APPS_SUFFIX = '.private-apps.tossmini.com';
const TOSSMINI_SUFFIX = '.tossmini.com';
const PARAM_NAMES = ['_deploymentId', 'debug', 'relay', 'at', 'host'] as const;

// 3.0 로더는 scheme 쿼리를 location으로 전파하지 않는다(devtools#760) —
// SDK getSchemeUri()가 원본 launch URI(_deploymentId 포함)를 회수하는지가
// 러너 페이지-매칭/entry 판정의 다음 설계 근거다. 실패해도 probe는 죽지 않는다.
function readSchemeUri(): string {
  try {
    return getSchemeUri() || '(empty)';
  } catch (e) {
    return `(error: ${e instanceof Error ? e.message : String(e)})`;
  }
}

function describeGateInputs(): string[] {
  const { hostname, protocol, search, hash, href } = window.location;
  const labels = hostname === '' ? [] : hostname.split('.');
  const params = new URLSearchParams(search);
  // devtools#760 이후 gate와 동일한 계열 판정: tossmini 계열 전체 허용
  // (private-apps가 아니면 at= 필수 — 아래 params 행으로 교차 확인).
  const hostAllow =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.trycloudflare.com') ||
    hostname.endsWith(TOSSMINI_SUFFIX);
  const isPrivateApps = hostname.endsWith(PRIVATE_APPS_SUFFIX);
  return [
    `proto: ${protocol}`,
    `host-allow: ${hostAllow ? 'Y' : 'N'} (labels=${labels.length}, private-apps=${isPrivateApps ? 'Y' : 'N'})`,
    `search.len: ${search.length} hash.len: ${hash.length}`,
    `params: ${PARAM_NAMES.map((k) => `${k}=${params.has(k) ? 'Y' : 'N'}`).join(' ')}`,
    `url: ${href}`,
    `schemeUri: ${readSchemeUri()}`,
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
