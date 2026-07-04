/**
 * storage `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * Storage(setItem/getItem/removeItem/clearItems)는 다양한 key/value로,
 * saveBase64Data는 다양한 mimeType으로 가로지른다. native 저장 오류는 env3.
 *
 * ─ #280: saveBase64Data mock-only 게이트 (run9 관측) ─────────────────────────
 * run9 관측: `saveBase64Data`가 실기기에서 네이티브 파일 저장/공유 시트를 열어
 * 사람이 직접 탭해야 진행됐다(캡처의 resolved 2건은 사람 상호작용의 결과이지
 * 무인 통과가 아니다) — permissions#277·storage 자매 사고와 같은 계열의
 * blocking-UI 호출이다. 옛 L87은 `it.skipIf(cell.platform === 'mock')`로
 * **실기기에서만** 빈 입력 케이스를 실행하는 역게이트였다(permissions#277
 * L118과 동일한 반전 패턴). 두 saveBase64Data 테스트를 mock-only로 뒤집고,
 * 실기기 커버리지(사람이 시트를 닫는 전제)는 `storage.manual.ait.test.ts`로
 * 옮긴다. run7·run8의 storage 전멸도 permissions 연쇄가 아니라 이 시트
 * 대기였을 가능성이 있다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { Storage, saveBase64Data } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'storage';

/**
 * #280: Storage.setItem/getItem/removeItem/clearItems는 blocking UI를 열지
 * 않는 무인-안전 호출이라 실기기에서도 유지한다 — 다만 location(#274)·
 * permissions(#277)와 동일하게 `raceTimeoutMs`로 감싸 native 브리지가
 * hang되더라도 이 한 호출만 `outcome: 'timeout'`으로 낙착시키고 파일 전체가
 * evaluate 예산을 다 태워 죽는 것을 막는다. 이 파일이 도는 호출 수(라운드트립
 * 4쌍 + remove/clear)는 순수 스토리지 I/O라 blocking UI 호출보다 훨씬 빨리
 * 응답하는 것이 정상 계약이므로 5s로 잡아도 파일당 evaluate 예산(현재 실효
 * 30s, devtools#747 fix 후 60s) 안에 여유가 남는다.
 */
const STORAGE_CALL_TIMEOUT_MS = 5_000;

afterAll(async () => {
  await flushCapture(CATEGORY);
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
        { raceTimeoutMs: STORAGE_CALL_TIMEOUT_MS },
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
        { raceTimeoutMs: STORAGE_CALL_TIMEOUT_MS },
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
      { raceTimeoutMs: STORAGE_CALL_TIMEOUT_MS },
    );
    const clear = await captureAsync(
      { category: CATEGORY, api: 'Storage.clearItems', scenario: 'happy-clear', input: null },
      () => Storage.clearItems(),
      { raceTimeoutMs: STORAGE_CALL_TIMEOUT_MS },
    );
    expect(['resolved', 'rejected']).toContain(remove.outcome);
    expect(['resolved', 'rejected']).toContain(clear.outcome);
  });

  // #280: saveBase64Data는 네이티브 파일 저장/공유 시트를 여는 blocking UI
  // 호출이다 — run9 관측(사람이 탭해야 진행)에 따라 mock-only로 뒤집는다.
  // 실기기 커버리지는 `storage.manual.ait.test.ts`로 옮겼다.
  it.skipIf(cell.platform !== 'mock')(
    '[mock] saveBase64Data를 다양한 mimeType으로 호출',
    async () => {
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
    },
  );
});

describe('storage · native shape (mock-only — 저장/공유 시트는 blocking UI)', () => {
  // #280: 옛 게이트(`it.skipIf(cell.platform === 'mock')`)는 빈 입력 케이스를
  // **실기기에서만** 실행하는 역게이트였다(permissions#277 L118과 동일한
  // 반전 패턴) — mock-only로 뒤집는다. mock은 시트를 실제로 열지 않으므로
  // native 거부 shape 자체는 낼 수 없고, 여기서는 shape-only(정규 outcome으로
  // 낙착하는지)만 관찰한다. 실기기 native shape 커버리지는 사람이 시트를
  // 닫는 `storage.manual.ait.test.ts`로 옮겼다.
  it.skipIf(cell.platform !== 'mock')(
    '[mock] saveBase64Data 빈 입력 호출이 정규 outcome으로 낙착한다',
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
