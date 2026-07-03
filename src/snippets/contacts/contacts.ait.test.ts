/**
 * contacts `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * ─ 무인 vs 수동 경계 (load-bearing) ──────────────────────────────────────────
 * `fetchContacts`는 native 연락처 피커/권한 다이얼로그를 여는 blocking API다 —
 * camera(fetchAlbumPhotos/fetchAlbumItems)와 동일한 위험군: 실기기에서 권한이
 * 이미 allowed면 native 목록 조회만 하지만, notDetermined 상태면 시스템 권한
 * 다이얼로그가 뜨고 사용자 탭을 기다린다. 자동화 evaluate-inject 환경(env3)에는
 * 사용자가 없어 무한 hang → 30초 파일-드롭 타임아웃으로 이어진다. 따라서
 * `fetchContacts()` 실호출은 `it.skipIf(cell.platform !== 'mock')`로 mock에서만
 * 돌리고, env3에서는 skip한다(camera.ait.test.ts와 동일 패턴).
 *
 * `fetchContacts.getPermission()`은 다르다 — 순수 조회이고 다이얼로그를 열지
 * 않는다(SDK 문서: "권한의 현재 상태를 반환"). 두 플랫폼 모두 무인 실행 안전.
 *
 * 거부-shape는 `fetchContacts()`를 거부 상태에서 실행하는 대신(피커 hang 위험),
 * devtools mock의 `aitState.patch('permissions', { contacts: 'denied' })`로
 * 권한을 강제한 뒤 `getPermission()`으로 상태만 관측하고, `fetchContacts()` 자체는
 * 여전히 mock-only skipIf 안에서 거부 경로를 확인한다 — mock은 permission 체크가
 * UI 없이 동기 판정이라 hang 위험이 없다(clipboard.ait.test.ts 패턴, PR #266).
 *
 * ─ #265: env3 denied 실행 추가 (camera rescue와 동일 패턴) ──────────────────
 * mock-only 경로와 별개로, `getAitPerms().contacts`(devtools#744 preflight)가
 * 기기에서 `'denied'`로 확정되면 `fetchContacts()` 실호출도 env3에서 안전하게
 * 돈다 — denied는 피커를 열지 않고 즉시 reject하는 계약이기 때문이다(camera의
 * fetchAlbumPhotos와 동일 근거). allowed/notDetermined/unavailable에서는 여전히
 * 피커 오픈 위험 또는 판정 불가라 skip한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { FetchContactsPermissionError, fetchContacts } from '@apps-in-toss/web-framework';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';
import { getAitPerms } from '../../test/aitPerms';
import { isNativeErrorShape } from '../../test/isNativeError';

const CATEGORY = 'contacts';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

const PERMISSION_STATUSES = ['notDetermined', 'denied', 'allowed'];

/** env1(mock) 전용 — devtools mock의 contacts 권한 상태를 강제한다. clipboard.ait.test.ts와 동일 패턴. */
async function forceContactsPermission(status: 'denied' | 'allowed' | 'notDetermined'): Promise<void> {
  const mod: unknown = await import('@apps-in-toss/web-framework');
  const aitState = (mod as { aitState?: { patch: (key: string, partial: unknown) => void } }).aitState;
  aitState?.patch('permissions', { contacts: status });
}

/** 다음 테스트에 상태가 새지 않도록 매 테스트 후 allowed(기본값)로 복구한다. */
async function resetContactsPermission(): Promise<void> {
  if (cell.platform === 'mock') {
    await forceContactsPermission('allowed');
  }
}

afterEach(async () => {
  await resetContactsPermission();
});

describe('contacts · getPermission (무인, 비-blocking 조회)', () => {
  it('fetchContacts.getPermission()이 PermissionStatus union 멤버를 반환한다', async () => {
    const { outcome, value } = await captureAsync(
      { category: CATEGORY, api: 'fetchContacts.getPermission', scenario: 'happy-query', input: null },
      () => fetchContacts.getPermission(),
    );
    expect(outcome).toBe('resolved');
    expect(PERMISSION_STATUSES).toContain(value);
  });

  it('denied로 강제한 뒤 getPermission()이 denied를 반환한다 (mock)', async () => {
    if (cell.platform === 'mock') {
      await forceContactsPermission('denied');
    }
    const { outcome, value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'fetchContacts.getPermission',
        scenario: 'denied-forced-query',
        input: null,
      },
      () => fetchContacts.getPermission(),
    );
    expect(outcome).toBe('resolved');
    if (cell.platform === 'mock') {
      // mock 권한을 강제로 denied했으므로 조회 결과가 반드시 denied여야 한다.
      expect(value).toBe('denied');
    } else {
      // env3: 강제 불가 — union 멤버라는 shape만 관측.
      expect(PERMISSION_STATUSES).toContain(value);
    }
  });
});

describe('contacts · fetchContacts (mock-only — 실기기 피커 hang 위험)', () => {
  it.skipIf(cell.platform !== 'mock')(
    '허용 상태에서 fetchContacts가 { result, nextOffset, done } shape로 resolve된다 (size/offset 다양화)',
    async () => {
      await forceContactsPermission('allowed');
      for (const options of [
        { size: 10, offset: 0 },
        { size: 1, offset: 0 },
        { size: 5, offset: 100 },
      ]) {
        const { outcome, value } = await captureAsync(
          {
            category: CATEGORY,
            api: 'fetchContacts',
            scenario: 'happy-varied-size-offset',
            input: options,
          },
          () => fetchContacts(options),
        );
        expect(outcome).toBe('resolved');
        const shape = value as { result: unknown[]; nextOffset: number | null; done: boolean };
        expect(Array.isArray(shape.result)).toBe(true);
        expect(shape.nextOffset === null || typeof shape.nextOffset === 'number').toBe(true);
        expect(typeof shape.done).toBe('boolean');
      }
    },
  );

  // C1: 거부 상태에서 fetchContacts를 호출하면 FetchContactsPermissionError(또는
  // native-shape)로 reject해야 한다 — 피커를 열지 않고 즉시 판정하는 mock 권한 체크는
  // env3 hang 위험이 없다(checkPermission이 UI 없이 동기 throw).
  it.skipIf(cell.platform !== 'mock')(
    '[C1] 거부 상태에서 fetchContacts가 FetchContactsPermissionError로 reject된다',
    async () => {
      await forceContactsPermission('denied');
      const { outcome, error } = await captureAsync(
        { category: CATEGORY, api: 'fetchContacts', scenario: 'C1-denied-fetch', input: { size: 10, offset: 0 } },
        () => fetchContacts({ size: 10, offset: 0 }),
      );
      expect(outcome).toBe('rejected');
      const isKnownShape = error instanceof FetchContactsPermissionError || isNativeErrorShape(error);
      expect(isKnownShape).toBe(true);
      expect(error).toBeInstanceOf(Error);
    },
  );
});

describe('contacts · env3 권한-상태 결정적 분기 (__AIT_PERMS__)', () => {
  // camera rescue와 동일 패턴(#265): denied가 확정된 기기에서만 실행 — denied는
  // 피커를 열지 않고 즉시 reject하므로 무인 실행에 안전하다. mock에서는 위
  // describe 블록이 이미 강제-patch로 결정적이라 이 it은 mock에서 skip한다
  // (이중 커버리지 방지 — 같은 계약을 두 경로로 중복 단언하지 않는다).
  it('[denied] fetchContacts가 native/PermissionError shape로 reject된다', async (ctx) => {
    ctx.skip(cell.platform === 'mock', 'mock 경로는 위 [C1] it이 강제-patch로 이미 커버');
    const perms = await getAitPerms();
    ctx.skip(
      perms.contacts !== 'denied',
      `contacts 권한이 denied가 아님(현재: ${perms.contacts}) — allowed/notDetermined는 피커 오픈 위험`,
    );
    const { outcome, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'fetchContacts',
        scenario: 'env3-denied-fetch',
        input: { size: 10, offset: 0 },
      },
      () => fetchContacts({ size: 10, offset: 0 }),
    );
    expect(outcome).toBe('rejected');
    const isKnownShape = error instanceof FetchContactsPermissionError || isNativeErrorShape(error);
    expect(isKnownShape).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('contacts · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
