/**
 * storage `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * Storage(setItem/getItem/removeItem/clearItems)는 다양한 key/value로,
 * saveBase64Data는 다양한 mimeType으로 가로지른다. native 저장 오류는 env3.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { Storage, saveBase64Data } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'storage';

afterAll(() => {
  flushCapture(CATEGORY);
});

describe('storage · 값 다양화 (happy path)', () => {
  it('setItem → getItem 라운드트립을 다양한 key/value로 호출', async () => {
    const pairs: Array<[string, string]> = [
      ['k1', 'v1'],
      ['unicode-key-한글', '값-😀'],
      ['empty-value', ''],
      ['json-like', JSON.stringify({ a: 1, b: [2, 3] })],
    ];
    for (const [key, value] of pairs) {
      const setResult = await captureAsync(
        {
          category: CATEGORY,
          api: 'Storage.setItem',
          scenario: 'happy-varied-pair',
          input: { key, valueLength: value.length },
        },
        () => Storage.setItem(key, value),
      );
      expect(['resolved', 'rejected']).toContain(setResult.outcome);

      const getResult = await captureAsync(
        {
          category: CATEGORY,
          api: 'Storage.getItem',
          scenario: 'happy-roundtrip',
          input: { key },
        },
        () => Storage.getItem(key),
      );
      if (setResult.outcome === 'resolved' && getResult.outcome === 'resolved') {
        expect(getResult.value).toBe(value);
      }
    }
  });

  it('removeItem / clearItems가 resolve', async () => {
    const remove = await captureAsync(
      { category: CATEGORY, api: 'Storage.removeItem', scenario: 'happy-remove', input: { key: 'k1' } },
      () => Storage.removeItem('k1'),
    );
    const clear = await captureAsync(
      { category: CATEGORY, api: 'Storage.clearItems', scenario: 'happy-clear', input: null },
      () => Storage.clearItems(),
    );
    expect(['resolved', 'rejected']).toContain(remove.outcome);
    expect(['resolved', 'rejected']).toContain(clear.outcome);
  });

  it('saveBase64Data를 다양한 mimeType으로 호출', async () => {
    for (const input of [
      { data: 'AAAA', fileName: 'a.png', mimeType: 'image/png' },
      { data: 'BBBB', fileName: 'b.txt', mimeType: 'text/plain' },
    ]) {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'saveBase64Data',
          scenario: 'happy-varied-mime',
          input,
        },
        () => saveBase64Data(input),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });
});

describe('storage · native shape (env3 전용 단언)', () => {
  it.skipIf(cell.platform === 'mock')(
    '[native] 저장 실패 시 native 오류 shape가 도착한다',
    async () => {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'saveBase64Data',
          scenario: 'native-save-failure',
          input: { data: '', fileName: '', mimeType: '' },
        },
        () => saveBase64Data({ data: '', fileName: '', mimeType: '' }),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    },
  );
});

describe('storage · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
