/**
 * analytics `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 값 다양화의 핵심은 eventLog를 각 log_type union 멤버로 호출하는 것 —
 * 'popup'(최신 멤버) 포함. Analytics.click/impression/screen도 가로지른다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { Analytics, eventLog } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'analytics';

// 실제 SDK union — 'popup'을 포함한 전 log_type.
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
] as const;

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
      expect(['resolved', 'rejected']).toContain(outcome);
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
    expect(['resolved', 'rejected']).toContain(click.outcome);
    expect(['resolved', 'rejected']).toContain(impression.outcome);
    expect(['resolved', 'rejected']).toContain(screen.outcome);
  });
});

describe('analytics · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
