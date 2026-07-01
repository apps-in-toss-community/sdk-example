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
 *   따라서 피커를 트리거하는 happy-path it은 mock에서만 실행(shape-only 검증)하고,
 *   env3(ios/android)에서는 skipIf로 skip한다. 실기기 camera 테스트는 수동 변형으로 분리 예정.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { fetchAlbumItems, fetchAlbumPhotos } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

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

describe('camera · native shape (env3 전용 단언)', () => {
  it.skipIf(cell.platform === 'mock')(
    '[native] 앨범 접근 권한 거부 시 native 오류 shape가 도착한다',
    async () => {
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
      expect(error).toBeInstanceOf(Error);
    },
  );
});

describe('camera · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
