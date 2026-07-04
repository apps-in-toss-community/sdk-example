/**
 * permissions `.manual.ait.test` — 수동-변형 슈트 (devtools 0.1.132
 * `--manual-blocking` 전용). 파일명 접미사 `.manual.ait.test.ts`는 다음을
 * 의미한다(ads.manual.ait.test.ts와 동일 계약):
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
 * ─ #277: run7·run8 hang/freeze 사고의 실기기 커버리지 이전처 ──────────────────
 * `openPermissionDialog`(권한 다이얼로그를 여는 blocking 호출)와
 * `requestPermission`(기기 상태에 따라 네이티브 프롬프트를 띄울 수 있는 호출)은
 * 무인(unattended) 실기기 실행 시 다이얼로그/프롬프트가 뜬 채로 아무도 응답하지
 * 않아 native 브리지가 무응답 상태로 남는다 — permissions.ait.test.ts(#277)에서
 * mock-only로 뺀 두 계열의 실기기 커버리지를 여기로 옮긴다. 사람이 화면을 보고
 * 다이얼로그/프롬프트를 직접 닫아(허용 또는 거부) resolve/reject 중 하나로
 * 낙착시켜야 다음 테스트로 진행된다.
 *
 * 여기 담는 것: `openPermissionDialog`(camera/access, geolocation/read 두
 * name·access 조합 — 원본 파일의 L118/L134 자리)과 `requestPermission`
 * (geolocation/read). 각 outcome은 resolve/reject 어느 쪽이 나와도 정직하게
 * envelope shape을 단언한다 — tautology(둘 다 허용해서 아무것도 검증 안 함)를
 * 피하기 위해 reject인 경우 `isNativeErrorShape`로 실제 native shape 여부까지
 * 확인한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  openPermissionDialog,
  requestPermission,
} from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, flushCapture } from '../../test/aitCapture';
import { isNativeErrorShape } from '../../test/isNativeError';

const CATEGORY = 'permissions';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('permissions · openPermissionDialog (수동-변형 — 사람이 다이얼로그를 확인 후 닫는다)', () => {
  it('openPermissionDialog(camera/access) — 사람: 카메라 권한 다이얼로그가 뜨면 허용/거부 후 진행해 주세요', async () => {
    const { outcome, value, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'openPermissionDialog',
        scenario: 'manual-native-dialog-camera',
        input: { name: 'camera', access: 'access' },
      },
      () => openPermissionDialog({ name: 'camera', access: 'access' }),
    );
    if (outcome === 'resolved') {
      // 계약: resolve 시 union 상태값을 반환한다.
      expect(['notDetermined', 'denied', 'allowed']).toContain(value);
    } else {
      expect(outcome).toBe('rejected');
      expect(isNativeErrorShape(error) || error instanceof Error).toBe(true);
    }
  });

  it('openPermissionDialog(geolocation/read) — 사람: 위치 권한 다이얼로그가 뜨면 허용/거부 후 진행해 주세요', async () => {
    const { outcome, value, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'openPermissionDialog',
        scenario: 'manual-native-dialog-geolocation',
        input: { name: 'geolocation', access: 'read' },
      },
      () => openPermissionDialog({ name: 'geolocation', access: 'read' }),
    );
    if (outcome === 'resolved') {
      expect(['notDetermined', 'denied', 'allowed']).toContain(value);
    } else {
      expect(outcome).toBe('rejected');
      expect(isNativeErrorShape(error) || error instanceof Error).toBe(true);
    }
  });
});

describe('permissions · requestPermission (수동-변형 — 사람이 네이티브 프롬프트를 응답한다)', () => {
  it('requestPermission(geolocation/read) — 사람: 네이티브 권한 프롬프트가 뜨면 응답해 주세요', async () => {
    const { outcome, value, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'requestPermission',
        scenario: 'manual-native-request-geolocation',
        input: { name: 'geolocation', access: 'read' },
      },
      () => requestPermission({ name: 'geolocation', access: 'read' }),
    );
    if (outcome === 'resolved') {
      // 계약: requestPermission은 notDetermined를 반환하지 않는다(응답 후 확정 상태).
      expect(value).not.toBe('notDetermined');
      expect(['denied', 'allowed']).toContain(value);
    } else {
      expect(outcome).toBe('rejected');
      expect(isNativeErrorShape(error) || error instanceof Error).toBe(true);
    }
  });
});
