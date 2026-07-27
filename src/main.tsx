import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ait-co/polyfill/auto';
// On-device 디버그 표면 (#361 — 3-패키지 분리 이후 `@ait-co/debug-console`).
//
// self-gating side-effect import 한 줄이 전부다: maybeAttach(Chii relay +
// eruda 콘솔 주입)와 `window.__sdk`/`__sdkCall` 브리지(devtools-debug MCP가
// Runtime.evaluate로 구동 — CLAUDE.md §On-device 디버깅)를 함께 설치한다.
// 런타임 self-gate(DEV 빌드이거나 URL에 `?debug=1`+`?relay=`가 있을 때만)가
// 닫혀 있으면 아무 동작도 하지 않는다 — 이 패키지가 `dependencies`인 이유이자
// 프로덕션 번들에 dormant chunk로 남는 것을 감수하는 이유다(boilerplate
// 청정성 허용선의 정확히 그 지점: `@ait-co/debug-console` 패키지 README가
// "권장"으로 문서화한 사용법과 동일).
import '@ait-co/debug-console/auto';
import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
