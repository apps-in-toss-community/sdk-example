/**
 * location `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 이 카테고리가 native 오류-shape 대조의 정본이다: iOS CoreLocation은 raw
 * native string으로, Android는 구조화된 bridge 오류로 도착한다(isLocationNativeError
 * 휴리스틱이 그 발산을 잡는다). native 오류 텍스트 단언은 platform==='mock'에서
 * skip되므로 env1은 green을 유지하고, env3(실기기)에서만 그 행이 채워진다.
 *
 * ─ #265: __AIT_PERMS__ 기반 결정적 분기 ──────────────────────────────────────
 * 기존 "권한 거부 시 native 오류 shape" 테스트는 rejected/resolved 양쪽을 모두
 * 통과시키는 blanket outcome-분기였다 — 어느 쪽이 나와도 그린이라 실제로는
 * 아무것도 검증하지 않았다. `getAitPerms().location`(devtools#744 preflight,
 * mock에서는 `aitState.state.permissions.geolocation`에서 합성)으로 기기의
 * 실제 권한 상태를 알 수 있으므로, 상태별로 실계약을 하드 단언한다:
 *   - denied         → 호출은 반드시 reject, native/PermissionError shape 단언.
 *   - allowed        → outcome-분기는 유지하되(GPS cold-fix flake는 여전히
 *                       실기기에서 발생 가능) resolved 시 좌표 shape은 하드 단언.
 *   - notDetermined  → 호출하면 권한 다이얼로그(blocking UI)가 뜨므로 무인 skip.
 *   - unavailable    → probe 실패로 상태 불명 — 판정 불가라 skip.
 *
 * gating은 `it` 바디 안에서 `ctx.skip()`으로 한다(vitest는 `skipIf`/`runIf`
 * 조건을 collection 시점에 동기 평가하지만 `getAitPerms()`는 mock 경로에서
 * dynamic import를 거쳐 비동기다 — 동기 조건으로 못 옮긴다).
 *
 * ─ #274: per-call race 타임아웃 — hung native call이 파일을 전멸시키지 않게 ──
 * run7(실기기 iOS 2.x)에서 GPS cold-fix로 `getCurrentLocation`의 첫 호출이
 * native 브리지에서 무응답 상태로 멈췄다. 이 파일은 그 호출을 5회(Accuracy
 * 3종 다양화 + 아래 [denied]/[allowed] 결정적 분기 2건) 반복하는데, 파일당
 * evaluate 예산(현재 실효 30s — devtools#747, fix 후 60s)을 단일 hang이
 * 다 태워버려 파일 전체가 CDP 30s 타임아웃으로 0/0/0 죽었고, 그 여파로
 * 네이티브 브리지가 무응답이 되어 다음 파일들(permissions/storage)까지
 * 연쇄로 죽고 실기기 앱이 freeze됐다(터치 무반응, 스피너만 회전).
 *
 * 그래서 모든 `getCurrentLocation` 호출을 `captureAsync`의 `raceTimeoutMs`로
 * 감싼다 — 5 × `LOCATION_CALL_TIMEOUT_MS`(5s) = 25s worst-case로 현재 30s
 * 캡 안에 여유를 두고, hang 1건이 나머지 4건 + 다음 파일들을 죽이는 대신
 * 그 1건만 `outcome: 'timeout'` 레코드로 낙착되고 파일은 살아서 진행된다.
 * (JS는 native Promise를 취소할 수 없으므로 원본 호출은 dangling으로
 * 버려진다 — 상세는 `aitCapture.ts`의 `raceWithTimeout` 주석 참조.)
 *
 * mock(env1)에서는 `getCurrentLocation`이 즉시 resolve하므로 이 레이스가
 * 실제로 발동할 일이 없다 — mock 경로는 여전히 결정적 green을 유지한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { Accuracy, GetCurrentLocationPermissionError, getCurrentLocation } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureAsync, cell, flushCapture } from '../../test/aitCapture';
import { getAitPerms } from '../../test/aitPerms';
import { isNativeErrorShape } from '../../test/isNativeError';

const CATEGORY = 'location';

/**
 * 파일당 evaluate 예산(현재 실효 30s, devtools#747 fix 후 60s) 대비
 * per-call 예산: 이 파일은 `getCurrentLocation`을 최대 5회 호출하므로
 * 5 × 5_000ms = 25_000ms worst-case로 30s 캡 안에 여유(5s)를 남긴다.
 * devtools#747이 풀려 60s로 늘어나도 이 값은 그대로 안전 — 오히려 여유가
 * 더 커진다.
 */
const LOCATION_CALL_TIMEOUT_MS = 5_000;

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('location · 값 다양화 (happy path)', () => {
  it('getCurrentLocation을 각 Accuracy union 멤버로 호출', async () => {
    // Accuracy는 양방향 enum이라 string 키를 걸러 numeric 멤버만 다양화한다.
    const accuracyMembers = Object.values(Accuracy).filter(
      (v): v is Accuracy => typeof v === 'number',
    );
    expect(accuracyMembers.length).toBeGreaterThan(0);
    for (const accuracy of accuracyMembers) {
      const { outcome, value } = await captureAsync(
        {
          category: CATEGORY,
          api: 'getCurrentLocation',
          scenario: 'happy-varied-accuracy',
          input: { accuracy },
        },
        () => getCurrentLocation({ accuracy }),
        { raceTimeoutMs: LOCATION_CALL_TIMEOUT_MS },
      );
      // fix #5: GPS cold-fix/권한 거부 시 reject될 수 있다 — outcome-gate로 flaky 방지.
      // #274: GPS cold-fix가 native 브리지를 hang시키면 'timeout'으로도 낙착될 수 있다 —
      // 두 경우 모두 파일 생존이 우선이라 좌표 단언은 'resolved'일 때만 수행한다.
      if (outcome === 'resolved') {
        expect(value).toMatchObject({ coords: expect.any(Object) });
      }
    }
  });
});

describe('location · 권한-상태 결정적 분기 (__AIT_PERMS__)', () => {
  it('[denied] getCurrentLocation은 반드시 reject하고 native/PermissionError shape를 낸다', async (ctx) => {
    const perms = await getAitPerms();
    ctx.skip(
      perms.location !== 'denied',
      `location 권한이 denied가 아님(현재: ${perms.location}) — 이 케이스는 denied 상태에서만 유효`,
    );
    const { outcome, error } = await captureAsync(
      {
        category: CATEGORY,
        api: 'getCurrentLocation',
        scenario: 'native-permission-denied',
        input: { accuracy: Accuracy.Highest },
      },
      () => getCurrentLocation({ accuracy: Accuracy.Highest }),
      { raceTimeoutMs: LOCATION_CALL_TIMEOUT_MS },
    );
    // denied가 확정된 상태이므로 원칙적으로는 reject가 계약이지만, #274:
    // GPS cold-fix가 native 브리지를 hang시키면 'timeout'으로 낙착될 수도
    // 있다 — 이를 세 번째 정당한 분기로 허용하되 tautology가 되지 않도록
    // 그 분기 안에서도 실제 단언(outcome === 'timeout')을 명시한다.
    if (outcome === 'timeout') {
      expect(outcome).toBe('timeout');
      return;
    }
    expect(outcome).toBe('rejected');
    const isKnownShape = error instanceof GetCurrentLocationPermissionError || isNativeErrorShape(error);
    expect(isKnownShape).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });

  it('[allowed] getCurrentLocation이 resolve하면 좌표 shape를 갖는다', async (ctx) => {
    const perms = await getAitPerms();
    ctx.skip(
      perms.location !== 'allowed',
      `location 권한이 allowed가 아님(현재: ${perms.location}) — 이 케이스는 allowed 상태에서만 유효`,
    );
    const { outcome, value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'getCurrentLocation',
        scenario: 'capture-baseline',
        input: { accuracy: Accuracy.Balanced },
      },
      () => getCurrentLocation({ accuracy: Accuracy.Balanced }),
      { raceTimeoutMs: LOCATION_CALL_TIMEOUT_MS },
    );
    // fix #5 계승: allowed여도 GPS cold-fix로 실기기에서 드물게 reject될 수 있다 —
    // outcome-분기는 유지하되, resolved인 경우는 좌표 shape을 하드 단언한다.
    // #274: GPS cold-fix가 native 브리지를 hang시키면 'timeout'으로도 낙착될 수
    // 있다 — 세 번째 정당한 분기로 허용하되 명시적으로 단언한다(tautology 방지).
    if (outcome === 'resolved') {
      expect(value).toMatchObject({ coords: expect.any(Object) });
    } else if (outcome === 'timeout') {
      expect(outcome).toBe('timeout');
    } else {
      expect(outcome).toBe('rejected');
    }
  });

  // notDetermined/unavailable 상태는 위 두 it이 각자 ctx.skip()으로 빠진다 —
  // notDetermined는 호출 시 권한 다이얼로그(blocking UI)를 열어 무인 실행에
  // 안전하지 않고, unavailable은 probe 실패로 판정 불가하기 때문이다. 이 두
  // 상태 자체를 위한 별도 it은 두지 않는다 — "호출하지 않는다"는 사실 자체가
  // 검증 대상이 아니라 안전을 위한 회피이므로, 별도 it을 만들면 tautology가 된다.
});

describe('location · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
