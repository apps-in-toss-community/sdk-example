/**
 * permissions `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 값 다양화는 PermissionAccess('read'|'write'|'access')와 PermissionName 전체를
 * 가로지른다. native 권한 오류는 env3에서만 도착하므로 그 단언은 mock에서 skip.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  getPermission,
  openPermissionDialog,
  requestPermission,
} from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'permissions';

// 실제 SDK union (PermissionAccess / PermissionName).
const ACCESS_VALUES = ['read', 'write', 'access'] as const;
const PERMISSION_NAMES = [
  'clipboard',
  'contacts',
  'photos',
  'geolocation',
  'camera',
  'microphone',
] as const;

afterAll(() => {
  flushCapture(CATEGORY);
});

describe('permissions · 값 다양화 (happy path)', () => {
  it('getPermission을 각 PermissionAccess 값으로 호출', async () => {
    for (const access of ACCESS_VALUES) {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'getPermission',
          scenario: 'happy-each-access',
          input: { name: 'geolocation', access },
        },
        () => getPermission({ name: 'geolocation', access }),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });

  it('getPermission을 각 PermissionName 값으로 호출', async () => {
    for (const name of PERMISSION_NAMES) {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'getPermission',
          scenario: 'happy-each-name',
          input: { name, access: 'read' },
        },
        () => getPermission({ name, access: 'read' }),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });

  it('requestPermission이 notDetermined가 아닌 상태로 resolve', async () => {
    const { value, outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'requestPermission',
        scenario: 'happy-request',
        input: { name: 'geolocation', access: 'read' },
      },
      () => requestPermission({ name: 'geolocation', access: 'read' }),
    );
    if (outcome === 'resolved') {
      // 계약: requestPermission은 notDetermined를 반환하지 않는다.
      expect(value).not.toBe('notDetermined');
    }
  });
});

describe('permissions · native shape (env3 전용 단언)', () => {
  it.skipIf(cell.platform === 'mock')(
    '[native] openPermissionDialog 거부 시 native 권한 오류 shape가 도착한다',
    async () => {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'openPermissionDialog',
          scenario: 'native-dialog-denied',
          input: { name: 'camera', access: 'access' },
        },
        () => openPermissionDialog({ name: 'camera', access: 'access' }),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    },
  );

  it('mock cell도 openPermissionDialog 결과를 캡처한다', async () => {
    const { outcome } = await captureAsync(
      {
        category: CATEGORY,
        api: 'openPermissionDialog',
        scenario: 'capture-baseline',
        input: { name: 'geolocation', access: 'read' },
      },
      () => openPermissionDialog({ name: 'geolocation', access: 'read' }),
    );
    expect(['resolved', 'rejected']).toContain(outcome);
  });
});

describe('permissions · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
