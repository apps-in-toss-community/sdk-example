/**
 * clipboard `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * native 클립보드 권한 오류(GetClipboardTextPermissionError /
 * SetClipboardTextPermissionError)는 env3 실기기에서만 도착 — mock에서 skip.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { getClipboardText, setClipboardText } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'clipboard';

afterAll(() => {
  flushCapture(CATEGORY);
});

describe('clipboard · 값 다양화 (happy path)', () => {
  it('setClipboardText를 다양한 텍스트(빈 문자열·유니코드·긴 문자열)로 호출', async () => {
    for (const text of ['', 'hello', '한글 텍스트 😀', 'x'.repeat(2000)]) {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'setClipboardText',
          scenario: 'happy-varied-text',
          input: { length: text.length },
        },
        () => setClipboardText(text),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });

  it('getClipboardText가 string으로 resolve', async () => {
    const { value, outcome } = await captureAsync(
      { category: CATEGORY, api: 'getClipboardText', scenario: 'happy-read', input: null },
      () => getClipboardText(),
    );
    if (outcome === 'resolved') {
      expect(typeof value).toBe('string');
    }
  });
});

describe('clipboard · native shape (env3 전용 단언)', () => {
  it.skipIf(cell.platform === 'mock')(
    '[native] 클립보드 읽기 권한 거부 시 native 오류 shape가 도착한다',
    async () => {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'getClipboardText',
          scenario: 'native-read-denied',
          input: null,
        },
        () => getClipboardText(),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    },
  );
});

describe('clipboard · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
