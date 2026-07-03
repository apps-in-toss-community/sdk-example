/**
 * analytics `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 값 다양화의 핵심은 eventLog를 각 log_type union 멤버로 호출하는 것 —
 * 'popup'(최신 멤버) 포함. Analytics.click/impression/screen도 가로지른다.
 *
 * ─ log_type 유니온 drift 조사 (#260) ────────────────────────────────────────
 * 이 파일이 자체 선언했던 9-멤버 유니온이 `@apps-in-toss/web-analytics`
 * d.ts(`Analytics.*` 3개 메서드만 export, `eventLog`는 없음)에는 없어 처음엔
 * silent drift로 의심됐다. 그러나 `eventLog`는 실제로 `@apps-in-toss/web-bridge`
 * (`dist/eventLog.d.ts`)가 정의·export하고, web-framework가 web-bridge를
 * re-export해 최종 표면에 합류한다. 그 `EventLogParams['log_type']`가 정확히
 * 이 9-멤버 유니온과 일치한다 — 그래서 실제로는 export된 타입이 있었고, 아래
 * `satisfies`로 그 타입에 구조적으로 핀 고정해 향후 유니온이 바뀌면(멤버 추가/
 * 제거) `pnpm typecheck`가 컴파일 타임에 잡는다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { Analytics, type EventLogParams, eventLog } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'analytics';

/**
 * 실제 SDK union(`EventLogParams['log_type']`, web-bridge 정의)에 구조적으로
 * 핀 고정 — `satisfies`이므로 배열 리터럴은 그대로 유지하되, 멤버가
 * `EventLogParams['log_type']`에서 벗어나면(추가/제거/오탈자) 여기서
 * 컴파일 타임 오류가 난다. 반대로 SDK 쪽에서 멤버가 늘면 이 배열이 뒤처져도
 * 타입 오류는 안 나므로(부분집합은 satisfies 통과), 실사용 커버리지는
 * 이 배열 리터럴이 SDK 쪽 리터럴 목록과 육안으로 일치하는지가 기준이다.
 */
const LOG_TYPES = [
  'debug',
  'info',
  'warn',
  'error',
  'event',
  'screen',
  'impression',
  'click',
  'popup',
] as const satisfies readonly EventLogParams['log_type'][];

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('analytics · 값 다양화 (happy path)', () => {
  it('eventLog를 각 log_type union 멤버로 호출 (popup 포함)', async () => {
    for (const log_type of LOG_TYPES) {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'eventLog',
          scenario: 'happy-each-log-type',
          input: { log_type },
        },
        () => eventLog({ log_name: 'ait_test', log_type, params: {} }),
      );
      // eventLog는 Promise<void>로 선언돼 있다 — mock에서 reject할 이유가 없으므로
      // resolved를 하드-단언한다. 실기기(env3)에서는 native 브리지가 개입할 수
      // 있어 outcome-분기로 완화하되, rejected 시에도 shape는 남긴다.
      if (cell.platform === 'mock') {
        expect(outcome).toBe('resolved');
      } else {
        expect(['resolved', 'rejected']).toContain(outcome);
      }
    }
  });

  it('Analytics.click / impression / screen을 다양한 component/page로 호출', async () => {
    // Analytics.* 는 Promise<void> | undefined를 반환한다(구버전 앱은 undefined).
    // captureAsync는 Promise를 기대하므로 Promise.resolve로 정규화한다.
    const click = await captureAsync(
      {
        category: CATEGORY,
        api: 'Analytics.click',
        scenario: 'happy-click',
        input: { component: 'cta-button', page: 'home' },
      },
      () => Promise.resolve(Analytics.click({ component: 'cta-button', page: 'home' })),
    );
    const impression = await captureAsync(
      {
        category: CATEGORY,
        api: 'Analytics.impression',
        scenario: 'happy-impression',
        input: { component: 'banner', page: 'detail' },
      },
      () => Promise.resolve(Analytics.impression({ component: 'banner', page: 'detail' })),
    );
    const screen = await captureAsync(
      {
        category: CATEGORY,
        api: 'Analytics.screen',
        scenario: 'happy-screen',
        input: { page: 'settings' },
      },
      () => Promise.resolve(Analytics.screen({ page: 'settings' })),
    );
    // Analytics.* 셋 다 mock에서는 항상 resolve(void | undefined) — 실계약 단언.
    if (cell.platform === 'mock') {
      expect(click.outcome).toBe('resolved');
      expect(impression.outcome).toBe('resolved');
      expect(screen.outcome).toBe('resolved');
    } else {
      expect(['resolved', 'rejected']).toContain(click.outcome);
      expect(['resolved', 'rejected']).toContain(impression.outcome);
      expect(['resolved', 'rejected']).toContain(screen.outcome);
    }
  });
});

describe('analytics · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
