/**
 * **프로비저닝 미러** — env1(mock)을 env3(실기기 31146)의 *프로비저닝 현실*에
 * 맞춰 정렬한다.
 *
 * ─ 무엇을 고치려는 문제인가 ─────────────────────────────────────────────────
 * env1↔env3 capture diff의 불일치 다수는 mock의 **버그가 아니다**. mock은 "정상
 * 프로비저닝된 앱"을 모델링하고(로그인 연동됨, AdMob placement 발급됨, 알림
 * 템플릿 등록됨, 권한 선언됨), 실제 31146은 그 어느 것도 안 돼 있다 —
 * `granite.config.ts`가 `permissions: []`이고, 토스 로그인 연동·광고·알림 계약도
 * 콘솔에서 체결되지 않았다. 그래서 같은 호출이 env1은 resolve, env3는 네이티브
 * 오류로 reject한다.
 *
 * 이 갭을 "mock을 고쳐서" 없애면 안 된다 — mock의 기본값이 항상 실패로 바뀌면
 * 정상 프로비저닝된 앱을 개발하는 일반 사용자의 dev 경험이 망가진다. 대신
 * **측정 시점에만** mock을 실기기 프로비저닝 상태로 맞춰 세운다. devtools#777의
 * `failureModes` 다이얼이 정확히 이 용도로 존재한다(미설정 시 동작 무변경).
 *
 * ─ 값의 출처: 추측이 아니라 실측 ────────────────────────────────────────────
 * 아래 코드/이름은 전부 env3 run11(2.x/iOS) capture에서 **관측된 값**이다.
 * 추측으로 채우지 않는다 — 관측 없는 API는 여기 넣지 않고 불일치로 남겨둔다.
 * 그게 계기(instrument)가 거짓말하지 않게 하는 유일한 방법이다.
 *
 * ─ env3에서는 no-op ─────────────────────────────────────────────────────────
 * `aitState`는 devtools mock에만 있는 export다. env3는 real SDK가 로드되므로
 * 동적 import 후 optional 접근이 그대로 undefined가 되어 아무 일도 하지 않는다.
 * (`notification.ait.test.ts`의 `forceNotificationNextResult`와 같은 패턴.)
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */

/** devtools mock의 `aitState` 최소 구조 — 여기서 쓰는 표면만 좁게 선언한다. */
interface AitStateLike {
  patch: (key: 'failureModes', partial: Record<string, unknown>) => void;
}

async function loadAitState(): Promise<AitStateLike | undefined> {
  const mod: unknown = await import('@apps-in-toss/web-framework');
  return (mod as { aitState?: AitStateLike }).aitState;
}

/**
 * 31146(dog-food 앱)의 프로비저닝 상태를 그대로 옮긴 다이얼 값.
 *
 * 각 항목 옆 주석은 그 값을 관측한 env3 시나리오다 — 재측정 시 대조 지점.
 */
const PROVISIONING_31146 = {
  /** `auth` — `happy-default` / `A2-referrer-forwarding`: 토스 로그인 미연동. */
  appLogin: 'APP_LOGIN',
  /** `auth` — `A1-awaited-is-boolean`. */
  getIsTossLoginIntegratedService: 'EXECUTION_ERROR',
  /** `ads` — `happy-load`: AdMob placement 미발급. */
  loadAdMob: 'PLACEMENT_ID_FETCH_FAILED',
  /** `ads` — `happy-load`. */
  loadFullScreenAd: 'EXECUTION_ERROR',
  /** `notification` — `happy-force-*` / `A1-empty-templateCode` 전부. */
  requestNotificationAgreement: '4000',
  /**
   * `permissions` — `happy-each-name` 순회 실측: `geolocation`/`camera`/
   * `microphone`만 거부, `clipboard`/`contacts`/`photos`는 통과.
   * `granite.config.ts`의 `permissions: []`와 정합하는 **이름 단위** 맵이다
   * (전역 on/off가 아니다).
   */
  getPermission: {
    geolocation: 'NO_PERMISSION',
    camera: 'NO_PERMISSION',
    microphone: 'NO_PERMISSION',
  },
} as const;

/**
 * 이 슈트가 미러링하는 프로비저닝 면(surface). 카테고리마다 자기 면만 켠다 —
 * 한 파일이 전역 상태를 통째로 흔들면 같은 run의 다른 카테고리가 오염된다.
 */
export type ProvisioningSurface =
  | 'appLogin'
  | 'getIsTossLoginIntegratedService'
  | 'loadAdMob'
  | 'loadFullScreenAd'
  | 'requestNotificationAgreement'
  | 'getPermission';

/**
 * 지정한 면을 31146의 프로비저닝 상태로 맞춘다. env3에서는 no-op.
 *
 * 호출 위치는 각 `.ait.test.ts`의 `beforeAll` — 어느 시나리오가 어느 관측을
 * 미러링하는지 호출 지점에서 읽히게 하려는 의도다(전역 setup 파일에 숨기면
 * 컴포넌트 smoke 테스트까지 실패 모드로 끌려간다).
 */
export async function mirrorProvisioning(...surfaces: ProvisioningSurface[]): Promise<void> {
  const aitState = await loadAitState();
  if (!aitState) {
    return; // env3(real SDK) — 실기기가 이미 진짜 프로비저닝 상태다.
  }
  const partial: Record<string, unknown> = {};
  for (const surface of surfaces) {
    partial[surface] = PROVISIONING_31146[surface];
  }
  aitState.patch('failureModes', partial);
}

/**
 * 미러를 걷어낸다 — 같은 run의 뒤따르는 파일로 실패 모드가 새지 않게.
 *
 * vitest 기본값(pool `forks` + `isolate: true`)에서는 파일마다 모듈 그래프가
 * 새로 서므로 원칙적으로 불필요하지만, isolate를 끄는 순간 조용히 오염되는
 * 종류의 결합이라 명시적으로 되돌린다.
 */
export async function clearProvisioningMirror(...surfaces: ProvisioningSurface[]): Promise<void> {
  const aitState = await loadAitState();
  if (!aitState) {
    return;
  }
  const partial: Record<string, unknown> = {};
  for (const surface of surfaces) {
    partial[surface] = undefined;
  }
  aitState.patch('failureModes', partial);
}
