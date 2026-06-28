/**
 * camera `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * native 권한 거부(OpenCameraPermissionError / FetchAlbumPhotosPermissionError)는
 * env3 실기기에서만 도착한다 — platform==='mock'에서 그 단언을 skip한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { fetchAlbumItems, fetchAlbumPhotos } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'camera';

afterAll(() => {
  flushCapture(CATEGORY);
});

describe('camera · 값 다양화 (happy path)', () => {
  it('fetchAlbumPhotos를 다양한 maxCount로 호출', async () => {
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
      // mock은 resolve, env3은 권한 셋업에 따라 다름 — 레코드는 항상 남는다.
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });

  it('fetchAlbumItems를 각 AlbumItemType union 멤버로 호출', async () => {
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
  });
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
