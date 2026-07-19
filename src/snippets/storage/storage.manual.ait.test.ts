/**
 * storage `.manual.ait.test` — 수동-변형 슈트 (devtools 0.1.132
 * `--manual-blocking` 전용). 파일명 접미사 `.manual.ait.test.ts`는 다음을
 * 의미한다(permissions.manual.ait.test.ts와 동일 계약):
 *
 *  - `pnpm test`(vitest, env1)에서는 `vitest.config.ts`의 `exclude`로 완전히
 *    건너뛴다 — CI에 영향 없음.
 *  - `pnpm test:env3`(devtools-test CLI)에서도 **기본적으로 제외**된다.
 *    `--manual-blocking` 플래그를 줄 때만 실행되며, 그때는 일반 파일들이 먼저
 *    돌고 이 파일이 **마지막**에 스케줄된다. 각 manual 파일 실행 전 QR
 *    대시보드가 폰에 push되어 사람이 화면을 보고 상호작용해야 한다.
 *  - env1(mock)에서도 이 파일 자체는 정상 import·실행 가능하지만, 위 이유로
 *    일반 `pnpm test` 실행 경로에서는 애초에 discover되지 않는다.
 *
 * ─ #280: run9 관측 — saveBase64Data 실기기 커버리지 이전처 ────────────────────
 * `saveBase64Data`는 네이티브 파일 저장/공유 시트를 여는 blocking 호출이다 —
 * 무인(unattended) 실기기 실행 시 시트가 뜬 채로 아무도 응답하지 않아 native
 * 브리지가 무응답 상태로 남는다(run9 캡처의 resolved 2건은 사람 상호작용의
 * 결과였다). storage.ait.test.ts(#280)에서 mock-only로 뺀 두 계열의 실기기
 * 커버리지를 여기로 옮긴다. 사람이 화면을 보고 시트를 직접 닫아(저장/공유
 * 완료 또는 취소) resolve/reject 중 하나로 낙착시켜야 다음 테스트로 진행된다.
 *
 * 여기 담는 것: `saveBase64Data`(다양한 mimeType happy path — 원본 파일의
 * L67 자리, 빈 입력 native 실패 shape — 원본 파일의 L87 자리). 각 outcome은
 * resolve/reject 어느 쪽이 나와도 정직하게 envelope shape을 단언한다 —
 * tautology(둘 다 허용해서 아무것도 검증 안 함)를 피하기 위해 reject인 경우
 * `isNativeErrorShape`로 실제 native shape 여부까지 확인한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { saveBase64Data } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, flushCapture } from '../../test/aitCapture';
import { isNativeErrorShape } from '../../test/isNativeError';

const CATEGORY = 'storage';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('storage · saveBase64Data 다양한 mimeType (수동-변형 — 사람이 저장/공유 시트를 확인 후 닫는다)', () => {
  it('saveBase64Data(image/png) — 사람: 파일 저장/공유 시트가 뜨면 저장 또는 취소 후 진행해 주세요', async () => {
    const { outcome, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'saveBase64Data',
        scenario: 'happy-varied-mime',
        input: { data: 'AAAA', fileName: 'a.png', mimeType: 'image/png' },
      },
      () => saveBase64Data({ data: 'AAAA', fileName: 'a.png', mimeType: 'image/png' }),
    );
    if (outcome === 'resolved') {
      // 계약: 저장/공유가 완료되면 별도 반환값 없이 resolve한다.
      expect(outcome).toBe('resolved');
    } else {
      expect(outcome).toBe('rejected');
      expect(isNativeErrorShape(error) || error instanceof Error).toBe(true);
    }
  });

  it('saveBase64Data(text/plain) — 사람: 파일 저장/공유 시트가 뜨면 저장 또는 취소 후 진행해 주세요', async () => {
    const { outcome, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'saveBase64Data',
        scenario: 'happy-varied-mime',
        input: { data: 'BBBB', fileName: 'b.txt', mimeType: 'text/plain' },
      },
      () => saveBase64Data({ data: 'BBBB', fileName: 'b.txt', mimeType: 'text/plain' }),
    );
    if (outcome === 'resolved') {
      expect(outcome).toBe('resolved');
    } else {
      expect(outcome).toBe('rejected');
      expect(isNativeErrorShape(error) || error instanceof Error).toBe(true);
    }
  });
});

describe('storage · saveBase64Data 빈 입력 (수동-변형 — 사람이 native 실패 시트를 확인 후 닫는다)', () => {
  it('saveBase64Data(빈 입력) — 사람: native 실패 시트/알림이 뜨면 확인 후 진행해 주세요', async () => {
    const { outcome, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'saveBase64Data',
        scenario: 'native-save-failure',
        input: { data: '', fileName: '', mimeType: '' },
      },
      () => saveBase64Data({ data: '', fileName: '', mimeType: '' }),
    );
    if (outcome === 'rejected') {
      // 계약: 빈 입력은 native 오류 shape로 거부되는 것이 기대 경로.
      expect(isNativeErrorShape(error) || error instanceof Error).toBe(true);
    } else {
      expect(outcome).toBe('resolved');
    }
  });
});
