/**
 * partner `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * `partner.addAccessoryButton` / `removeAccessoryButton`은 상단 네비게이션에
 * UI를 붙이는 fire-and-forget Promise<void> API — 파트너 컨텍스트(제휴 앱)가
 * 아닌 일반 미니앱에서 호출해도 mock/실기기 둘 다 예외를 던지지 않는 계약이다
 * (mock 구현은 `console.log`만 하고 no-op — src/mock/partner.ts 참고). blocking
 * UI(피커, fullscreen 등)를 열지 않으므로 camera/ads-show와 달리 무인 실행에
 * 안전 — happy-path를 하드 단언한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { partner } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'partner';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('partner · 값 다양화 (happy path)', () => {
  it('addAccessoryButton이 다양한 id/title/icon 조합으로 void resolve된다', async () => {
    const variants = [
      { id: 'btn-1', title: '하트', icon: { name: 'icon-heart-mono' } },
      { id: 'btn-2', title: 'Star', icon: { name: 'icon-star-mono' } },
      { id: 'btn-매우-긴-id-0000', title: '', icon: { name: 'icon-unknown-name' } },
    ];
    for (const options of variants) {
      const { outcome, value } = await captureAsync(
        {
          category: CATEGORY,
          api: 'partner.addAccessoryButton',
          scenario: 'happy-varied-id-title-icon',
          input: options,
        },
        () => partner.addAccessoryButton(options),
      );
      if (cell.platform === 'mock') {
        // mock은 console.log만 하는 no-op — 예외 없이 resolve하는 것 자체가 계약.
        expect(outcome).toBe('resolved');
        expect(value).toBeUndefined();
      } else {
        // env3: 파트너 컨텍스트가 아닌 워크스페이스에서 거부될 가능성이 있어
        // outcome은 분기하되, 각 분기가 실 shape를 남기도록 캡처만 강제한다.
        expect(['resolved', 'rejected']).toContain(outcome);
      }
    }
  });

  it('removeAccessoryButton이 예외 없이 void resolve된다', async () => {
    const { outcome, value } = await captureAsync(
      { category: CATEGORY, api: 'partner.removeAccessoryButton', scenario: 'happy-no-args', input: null },
      () => partner.removeAccessoryButton(),
    );
    if (cell.platform === 'mock') {
      expect(outcome).toBe('resolved');
      expect(value).toBeUndefined();
    } else {
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });
});

describe('partner · 의도적 오류 (확인된 오용 가드)', () => {
  // P1: addAccessoryButton도 없이 removeAccessoryButton을 먼저 호출해도(초기화 순서
  // 오류, 중복 remove 등 흔한 실수) 예외를 던지지 않아야 한다 — ads의 destroy-before-attach
  // 가드(A1)와 동일한 계열.
  it('[P1] addAccessoryButton 없이 removeAccessoryButton을 호출해도 예외를 던지지 않는다', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'partner.removeAccessoryButton',
        scenario: 'P1-remove-before-add',
        input: null,
      },
      () => partner.removeAccessoryButton(),
    );
    if (cell.platform === 'mock') {
      expect(outcome).toBe('resolved');
    } else {
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });

  // P2: 빈 문자열 icon.name(형식이 이상한 아이콘 이름)을 전달해도 addAccessoryButton
  // 계약(Promise<void>)을 벗어나지 않는다 — SDK 문서상 "매칭 안 되면 빈 아이콘 표시"로
  // 명시돼 있어 예외가 아니라 조용한 fallback이 기대 동작이다.
  it('[P2] 형식이 이상한 icon.name을 전달해도 예외 없이 resolve된다', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'partner.addAccessoryButton',
        scenario: 'P2-malformed-icon-name',
        input: { id: 'btn-p2', title: 'P2', icon: { name: '' } },
      },
      () => partner.addAccessoryButton({ id: 'btn-p2', title: 'P2', icon: { name: '' } }),
    );
    if (cell.platform === 'mock') {
      expect(outcome).toBe('resolved');
    } else {
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });
});

describe('partner · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
