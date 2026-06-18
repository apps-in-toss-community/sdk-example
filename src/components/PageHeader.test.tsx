import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

// jsdom CSSStyleDeclaration setter 가 env() 를 거부해 렌더 DOM 의 style.top 이 '' →
// sticky top 의 env() 단일 출처 계약은 소스 텍스트로 고정한다(jsdom 한계 우회).
// vitest 에서 import.meta.url 을 new URL() 에 바로 넣으면 깨질 수 있어 dirname+resolve.
const PAGEHEADER_SOURCE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), 'PageHeader.tsx'),
  'utf8',
);

// 회귀 가드 — sticky 헤더의 top 오프셋이 CSS env(safe-area-inset-top) 단일 출처를
// 유지하는지 고정한다. SDK-inset 변수(var(--ait-safe-top) 등)로 되돌려지면 fail —
// 그건 #187/#131 의 SDK-top 잉여 band 회귀를 재도입하는 경로다.
describe('PageHeader safe-area 계약', () => {
  it('sticky 헤더가 렌더되고 top 이 env(safe-area-inset-top) 단일 출처를 쓴다', () => {
    const { container } = render(
      <MemoryRouter>
        <PageHeader title="테스트" />
      </MemoryRouter>,
    );
    const header = container.querySelector('header') as HTMLElement;
    expect(header).not.toBeNull();
    expect(header.className).toContain('sticky');
    // env() 단일 출처 계약은 소스 텍스트로 고정(jsdom 한계 — 위 PAGEHEADER_SOURCE 주석).
    expect(PAGEHEADER_SOURCE).toContain("top: 'env(safe-area-inset-top)'");
    expect(PAGEHEADER_SOURCE).not.toContain('--ait-safe');
    expect(PAGEHEADER_SOURCE).not.toContain('SafeAreaInsets');
  });

  it('제목을 렌더한다 (smoke)', () => {
    const { getByText } = render(
      <MemoryRouter>
        <PageHeader title="테스트" />
      </MemoryRouter>,
    );
    expect(getByText('테스트')).toBeTruthy();
  });
});
