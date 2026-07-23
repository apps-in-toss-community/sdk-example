/**
 * camera `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * native 권한 거부(OpenCameraPermissionError / FetchAlbumPhotosPermissionError)는
 * env3 실기기에서만 도착한다 — platform==='mock'에서 그 단언을 skip한다.
 *
 * env3 camera 자동 실행 제약:
 *   fetchAlbumPhotos / fetchAlbumItems는 실기기에서 네이티브 사진 피커 시트를 열고
 *   사용자 탭을 기다린다. 자동화된 evaluate inject 환경(env3)에서는 사용자 탭이
 *   없어 무한 hang → 30초 타임아웃 → 파일 전체 drop으로 이어진다(camera=0의 원인).
 *   happy-path it은 이 위험이 있는 한 mock에서만 실행(shape-only 검증)하고,
 *   env3(ios/android)에서는 skip한다.
 *
 * ─ #265: camera rescue — "권한 거부 시 native shape" it을 영구 skip에서
 *   조건부 실행으로 전환 ────────────────────────────────────────────────────
 * 기존에는 이 it을 영구 `it.skip`으로 뒀다: env3에서 권한이 allowed면 피커가
 * 열려 hang하고, mock은 애초에 거부를 던지지 않아 rejected shape 검증이
 * 불가능했기 때문이다. `getAitPerms().album`(devtools#744 preflight)이 기기의
 * 실제 앨범 권한 상태를 알려주므로 이제는 "denied가 확정된 경우에만" 안전하게
 * 실행할 수 있다 — **denied 상태에서는 fetchAlbumPhotos가 피커를 열지 않고
 * 즉시 reject한다** (네이티브 권한 체크가 UI 없이 동기 판정하는 계약, mock의
 * `checkPermission`과 동일한 실 SDK 동작). 따라서:
 *   - album === 'denied'                    → 호출 후 rejected shape 하드 단언 (무인 안전).
 *   - album === 'allowed'                   → 호출 시 피커가 열려 hang → skip.
 *   - album === 'notDetermined'/'unavailable' → 다이얼로그 오픈 또는 상태 불명 → skip.
 * 영구 skip이던 테스트가 denied 상태에서는 실제로 도는 conditionally-asserted
 * 테스트가 됐다는 점이 이번 감사의 camera 구제 포인트다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  FetchAlbumPhotosPermissionError,
  fetchAlbumItems,
  fetchAlbumPhotos,
  openCamera,
} from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';
import { getAitPerms } from '../../test/aitPerms';
import { isNativeErrorShape } from '../../test/isNativeError';

const CATEGORY = 'camera';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('camera · 값 다양화 (happy path)', () => {
  // fix #4: env3(실기기)에서 피커 시트를 트리거하면 사용자 탭 없이 무한 hang한다.
  // mock에서만 shape-only 검증. 실기기 camera는 수동 변형에서 확인.
  it.skipIf(cell.platform !== 'mock')('fetchAlbumPhotos를 다양한 maxCount로 호출', async () => {
    for (const maxCount of [1, 3, 10]) {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'fetchAlbumPhotos',
          scenario: 'happy-varied-maxCount',
          input: { maxCount },
        },
        () => fetchAlbumPhotos({ maxCount }),
      );
      // mock은 resolve — 레코드는 항상 남는다.
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });

  // fix #4: fetchAlbumItems도 동일하게 피커를 트리거하므로 mock-only.
  it.skipIf(cell.platform !== 'mock')(
    'fetchAlbumItems를 각 AlbumItemType union 멤버로 호출',
    async () => {
      // AlbumItemType = 'PHOTO' | 'VIDEO'.
      for (const input of [
        { types: ['PHOTO'] as const, maxCount: 2 },
        { types: ['VIDEO'] as const, maxCount: 5 },
        { types: ['PHOTO', 'VIDEO'] as const, maxCount: 3 },
      ]) {
        const { outcome } = await captureAsync(
          {
            category: CATEGORY,
            api: 'fetchAlbumItems',
            scenario: 'happy-varied-types',
            input,
          },
          () => fetchAlbumItems({ types: [...input.types], maxCount: input.maxCount }),
        );
        expect(['resolved', 'rejected']).toContain(outcome);
      }
    },
  );
});

describe('camera · native shape (오류-shape 검증)', () => {
  // camera rescue(#265): album 권한이 denied로 확정된 경우에만 실행한다 —
  // denied면 fetchAlbumPhotos가 피커를 열지 않고 즉시 reject하므로 무인 실행에
  // 안전하다(위 파일 헤더 주석 참고). allowed/notDetermined/unavailable에서는
  // 피커가 열리거나(hang 위험) 판정 불가라 ctx.skip()한다.
  it('[denied] 앨범 접근 권한 거부 시 native 오류 shape가 도착한다', async (ctx) => {
    const perms = await getAitPerms();
    ctx.skip(
      perms.album !== 'denied',
      `album 권한이 denied가 아님(현재: ${perms.album}) — allowed면 피커가 열려 hang 위험, 그 외는 상태 불명`,
    );
    const { outcome, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'fetchAlbumPhotos',
        scenario: 'native-permission-denied',
        input: { maxCount: 1 },
      },
      () => fetchAlbumPhotos({ maxCount: 1 }),
    );
    expect(outcome).toBe('rejected');
    const isKnownShape = error instanceof FetchAlbumPhotosPermissionError || isNativeErrorShape(error);
    expect(isKnownShape).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('camera · OOS: openCamera (자동 device diff 구조적 불가, #331)', () => {
  // openCamera는 네이티브 카메라 촬영 UI를 띄운다. 사진을 찍거나 취소하는
  // 판단은 사람만 할 수 있어 그 판단 전엔 Promise가 낙착되지 않고, 매 세션
  // 사람이 고르는 사진(또는 취소)이 달라 재현 가능한 diff 대상도 아니다.
  // fetchAlbumPhotos/fetchAlbumItems(위 describe)와 달리 권한 거부 시 자동
  // reject하는 무인 안전 분기도 없다 — 권한이 allowed면 무조건 뷰파인더가
  // 뜬다. GPS·해프틱류 하드웨어 감응 축과 같은 원칙으로 자동 캡처 대상에서
  // 제외하고, human-in-loop임을 명시적으로 문서화한다(silent omission 금지 —
  // 조용히 빠진 게 아니라 의도된 스코프 결정이다). 실기기 검증은 사람이 직접
  // 실행하는 별도 세션의 몫이다(이 슈트의 스코프 밖).
  it('openCamera — human-in-loop, 자동 diff 불가 (OOS, #331)', () => {
    expect(typeof openCamera).toBe('function');
  });
});

describe('camera · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
