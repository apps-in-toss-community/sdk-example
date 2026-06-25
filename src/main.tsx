import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ait-co/polyfill/auto';
import './index.css';
import { App } from './App';

// On-device 디버그 표면을 빌드 타임에 가둔다 (#210, devtools #647).
//
// `@ait-co/devtools/in-app/auto`는 maybeAttach(Chii relay + eruda 콘솔 주입)와
// `window.__sdk`/`__sdkCall` 브리지(devtools-debug MCP가 Runtime.evaluate로 구동
// — CLAUDE.md §On-device 디버깅)를 함께 설치한다. 정적 side-effect import면 이
// 디버그 코드가 release 번들에 dormant로 남아(side-effect import는 DCE 불가)
// 런타임 self-gate가 닫혀 있어도 표면이 존재한다.
//
// `__DEBUG_BUILD__` 가드 + 동적 import로 바꾸면: release 빌드(AIT_DEBUG_BUILD
// unset → false)에서 auto 모듈 그래프 전체가 DCE되어 Chii·eruda·브리지가 0
// bytes로 사라지고, 디버그 빌드(AIT_DEBUG_BUILD=1)에서는 auto의 기존 런타임
// self-gate(host allowlist + ?debug=1 + relay + TOTP)를 그대로 상속한다.
if (__DEBUG_BUILD__) {
  import('@ait-co/devtools/in-app/auto');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
