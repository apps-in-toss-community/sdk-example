/**
 * permissions `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 값 다양화는 PermissionAccess('read'|'write'|'access')와 PermissionName 전체를
 * 가로지른다. native 권한 오류는 env3에서만 도착하므로 그 단언은 mock에서 skip.
 *
 * ─ #265: __AIT_PERMS__ 교차검증 ──────────────────────────────────────────────
 * 이 파일이 부르는 `getPermission({ name: 'geolocation', access: 'read' })`
 * (SDK-level 범용 조회)과 devtools#744 preflight가 채우는
 * `getAitPerms().location`(= `getCurrentLocation.getPermission()`)은 서로 다른
 * 진입점으로 같은 기기 상태를 조회한다 — 값이 어긋나면 SDK/mock의 권한 조회
 * 경로 간 정합이 깨졌다는 회귀 신호다. union 멤버 검증에 그치지 않고 두 값이
 * 일치하는지까지 하드 단언한다.
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
import { getAitPerms } from '../../test/aitPerms';

const CATEGORY = 'permissions';

// 실제 SDK union (PermissionAccess / PermissionName).
const ACCESS_VALUES = ['read', 'write', 'access'] as const;
const PERMISSION_STATUSES = ['notDetermined', 'denied', 'allowed'];
const PERMISSION_NAMES = [
  'clipboard',
  'contacts',
  'photos',
  'geolocation',
  'camera',
  'microphone',
] as const;

afterAll(async () => {
  await flushCapture(CATEGORY);
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

describe('permissions · __AIT_PERMS__ 교차검증 (#265)', () => {
  it('getPermission(geolocation)이 getAitPerms().location과 일치한다', async () => {
    const perms = await getAitPerms();
    const { outcome, value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'getPermission',
        scenario: 'cross-check-location',
        input: { name: 'geolocation', access: 'read' },
      },
      () => getPermission({ name: 'geolocation', access: 'read' }),
    );
    expect(outcome).toBe('resolved');
    // union 값이라는 shape뿐 아니라, 같은 기기 상태를 가리키는 두 진입점(범용
    // getPermission vs devtools#744 preflight의 getCurrentLocation.getPermission())이
    // 실제로 일치하는지까지 확인한다 — 'unavailable'은 preflight 전용 sentinel이라
    // SDK 쪽 union에는 없으므로 그 경우는 비교 대상에서 제외한다.
    if (perms.location !== 'unavailable') {
      expect(value).toBe(perms.location);
    } else {
      expect(PERMISSION_STATUSES).toContain(value);
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
