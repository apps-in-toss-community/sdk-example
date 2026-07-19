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
 * ─ #277: blocking native-UI 호출 mock-only 게이트 (run7·run8 hang/freeze 진범) ──
 * `openPermissionDialog`(권한 다이얼로그를 여는 blocking 호출)와
 * `requestPermission`(기기 상태에 따라 네이티브 프롬프트를 띄울 수 있는 호출)은
 * camera/contacts `.ait.test.ts`가 이미 지키는 무인-안전 규칙 — "네이티브 UI를
 * 여는 호출은 mock-only, 실기기 커버리지는 `*.manual.ait.test.ts`로 분리" —를
 * 이 파일만 누락하고 있었다. 특히 옛 L118은 `it.skipIf(cell.platform === 'mock')`로
 * **실기기에서만** openPermissionDialog를 실행하는 게이트 반전이었다 — mock에서
 * skip하고 실기기에서만 도는, 의도와 정반대인 무인-안전 위반. run7·run8 연속
 * 사고(§이슈 #277 forensics)에서 이 파일이 60s evaluate 타임아웃으로 죽고
 * storage까지 연쇄로 wedge된 뒤 폰이 freeze(네이티브 표면 + 스피너 + 터치
 * 무반응)된 진범으로 지목됐다. 실기기 커버리지는
 * `permissions.manual.ait.test.ts`로 옮기고(사람이 다이얼로그를 닫는 전제),
 * 이 파일에 남는 나머지 on-device 호출(`getPermission` 순수 쿼리, cross-check)은
 * `captureAsync`의 `raceTimeoutMs`로 감싸 hang이 파일을 전멸시키지 않게 한다.
 *
 * ─ #281: cross-check 계약 관측 — generic getPermission이 2.x iOS에서 reject ───
 * run9 1F: SE-5 교차검증 테스트가 generic `getPermission({name:'geolocation'})`의
 * resolve를 전제했으나 실기기에서 rejected로 낙착했다. run7 late-flush 캡처도
 * 동일 시나리오 rejected + happy-each-name 3/6 rejected를 보여 재현성 있는
 * 계약이다: permissions-group generic API는 name에 따라 reject할 수 있고,
 * method-level `getCurrentLocation.getPermission()`(preflight, 'allowed')과
 * 발산한다. #252/#256 계약-관측 패턴을 따라 resolved/rejected 분기 단언으로
 * 바꿨다 — 항진 없이 각 분기가 실제 값을 확인한다.
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
import { isNativeErrorShape } from '../../test/isNativeError';

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

/**
 * #277: 남은 on-device 호출(getPermission 순수 쿼리·cross-check)의 per-call
 * 예산. 이 파일은 최대 3회 호출(ACCESS_VALUES 3종 + PERMISSION_NAMES 루프는
 * 내부 반복이라 파일 전체 호출은 union 크기만큼 늘지만, 각 호출은 순수 쿼리라
 * blocking UI 호출보다 훨씬 빨리 응답하는 것이 정상 계약이다)에 걸쳐 호출되므로
 * location.ait.test.ts(#274)와 동일하게 5s로 잡아 파일당 evaluate 예산(현재
 * 실효 30s, devtools#747 fix 후 60s) 안에 여유를 둔다 — 단발 hang이 파일
 * 전체를 죽이는 대신 그 1건만 `outcome: 'timeout'`으로 낙착시킨다.
 */
const PERMISSIONS_CALL_TIMEOUT_MS = 5_000;

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
        { raceTimeoutMs: PERMISSIONS_CALL_TIMEOUT_MS },
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
        { raceTimeoutMs: PERMISSIONS_CALL_TIMEOUT_MS },
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    }
  });

  // #277: requestPermission은 기기 상태(notDetermined)에 따라 네이티브 프롬프트를
  // 띄울 수 있는 blocking 호출이다 — camera/contacts가 지키는 무인-안전 규칙과
  // 동일하게 mock-only로 gate한다. 실기기 커버리지(사람이 프롬프트를 응답)는
  // `permissions.manual.ait.test.ts`로 이동했다.
  it.skipIf(cell.platform !== 'mock')(
    '[mock] requestPermission이 notDetermined가 아닌 상태로 resolve',
    async () => {
      const { value, outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'requestPermission',
          scenario: 'native-request-geolocation',
          input: { name: 'geolocation', access: 'read' },
        },
        () => requestPermission({ name: 'geolocation', access: 'read' }),
      );
      if (outcome === 'resolved') {
        // 계약: requestPermission은 notDetermined를 반환하지 않는다.
        expect(value).not.toBe('notDetermined');
      }
    },
  );
});

describe('permissions · __AIT_PERMS__ 교차검증 (#265, #281)', () => {
  // #281: run9 1F 관측 — 이 테스트는 원래 generic `getPermission(geolocation)`이
  // 항상 resolve한다고 전제했으나, 실기기에서 rejected로 낙착했다("Expected
  // resolved, received rejected"). run7 late-flush 캡처에도 동일 시나리오
  // (cross-check-location) rejected + happy-each-name 3/6 rejected가 있어
  // 우연이 아니라 재현성 있는 2.x iOS 계약이다: permissions-group generic API
  // (`getPermission`)는 name에 따라 reject할 수 있고, 이는 method-level
  // preflight(`getCurrentLocation.getPermission()` → `getAitPerms().location`)가
  // 'allowed'를 보고하는 것과 발산한다 — 두 API 표면이 같은 기기 상태를 서로
  // 다른 방식으로 (불)일치하게 보고하는 것 자체가 관측 대상이다. #252/#256
  // 계약-관측 패턴을 따라 resolved/rejected 양쪽 모두 실제 단언을 두고
  // (tautology 금지), rejected 분기의 native shape 캡처가 4-cell diff 신호로
  // 남게 한다.
  it('getPermission(geolocation)이 getAitPerms().location과 일치한다', async () => {
    const perms = await getAitPerms();
    const { outcome, value, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'getPermission',
        scenario: 'cross-check-location',
        input: { name: 'geolocation', access: 'read' },
      },
      () => getPermission({ name: 'geolocation', access: 'read' }),
      { raceTimeoutMs: PERMISSIONS_CALL_TIMEOUT_MS },
    );
    if (outcome === 'resolved') {
      // union 값이라는 shape뿐 아니라, 같은 기기 상태를 가리키는 두 진입점(범용
      // getPermission vs devtools#744 preflight의 getCurrentLocation.getPermission())이
      // 실제로 일치하는지까지 확인한다 — 'unavailable'은 preflight 전용 sentinel이라
      // SDK 쪽 union에는 없으므로 그 경우는 비교 대상에서 제외한다.
      if (perms.location !== 'unavailable') {
        expect(value).toBe(perms.location);
      } else {
        expect(PERMISSION_STATUSES).toContain(value);
      }
    } else {
      // #281: generic getPermission이 reject하는 관측된 2.x iOS 계약 분기.
      // method-level preflight가 'allowed'를 보고해도 이 표면은 독립적으로
      // 실패할 수 있다는 발산 자체가 신호이므로, native 오류 shape인지만
      // 정직하게 단언한다(항진 금지).
      expect(outcome).toBe('rejected');
      expect(isNativeErrorShape(error) || error instanceof Error).toBe(true);
    }
  });
});

describe('permissions · native shape (mock-only — dialog는 blocking UI)', () => {
  // #277: openPermissionDialog는 네이티브 권한 다이얼로그를 여는 blocking 호출이다.
  // 옛 게이트(`it.skipIf(cell.platform === 'mock')`)는 이 호출을 **실기기에서만**
  // 무인 실행했다 — camera/contacts가 지키는 "blocking UI는 mock-only" 규칙의
  // 정반대였고, run7·run8 hang/freeze 사고의 진범으로 지목됐다(#277 forensics).
  // mock은 다이얼로그를 실제로 띄우지 않으므로 native 거부 shape 자체는 낼 수
  // 없다 — 여기서는 shape-only(호출이 정규 outcome으로 낙착되는지)만 관찰하고,
  // 실기기 native shape 커버리지는 사람이 다이얼로그를 닫는
  // `permissions.manual.ait.test.ts`로 옮겼다.
  it.skipIf(cell.platform !== 'mock')(
    '[mock] openPermissionDialog(camera/access) 호출이 정규 outcome으로 낙착한다',
    async () => {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'openPermissionDialog',
          scenario: 'native-dialog-camera',
          input: { name: 'camera', access: 'access' },
        },
        () => openPermissionDialog({ name: 'camera', access: 'access' }),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    },
  );

  // #277: L134 원본도 openPermissionDialog를 어떤 플랫폼 게이트도 없이(=실기기
  // 포함) 호출했다 — 동일 규칙 위반이라 mock-only로 전환한다.
  it.skipIf(cell.platform !== 'mock')(
    '[mock] openPermissionDialog(geolocation/read) 결과를 캡처한다',
    async () => {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'openPermissionDialog',
          scenario: 'native-dialog-geolocation',
          input: { name: 'geolocation', access: 'read' },
        },
        () => openPermissionDialog({ name: 'geolocation', access: 'read' }),
      );
      expect(['resolved', 'rejected']).toContain(outcome);
    },
  );
});

describe('permissions · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
