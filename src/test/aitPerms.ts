/**
 * `.ait.test` 권한-상태 preflight 소비 — devtools#744가 env3에서 첫 테스트 파일
 * 주입 전에 `globalThis.__AIT_PERMS__`로 6개 권한의 실제 기기 상태를 채워둔다.
 * 이 모듈은 그 값을 읽거나(env3), 없으면(env1/mock) devtools mock의
 * `aitState.state.permissions`에서 같은 shape을 합성해(synthesize) 반환한다 —
 * 테스트가 플랫폼과 무관하게 항상 `getAitPerms()` 하나만 호출하면 되게 한다.
 *
 * ─ 계약 (devtools#744, sdk-example#265) ──────────────────────────────────────
 * ```
 * globalThis.__AIT_PERMS__ = {
 *   clipboardRead:  'allowed'|'denied'|'notDetermined'|'unavailable',  // getClipboardText.getPermission()
 *   clipboardWrite: same,  // setClipboardText.getPermission()
 *   album: same,           // fetchAlbumPhotos.getPermission()
 *   camera: same,          // openCamera.getPermission()
 *   contacts: same,        // fetchContacts.getPermission()
 *   location: same,        // getCurrentLocation.getPermission()
 * }
 * ```
 * `'unavailable'`은 probe 자체가 없거나 던지거나 무응답인 경우다(devtools
 * `PERMISSION_PROBE_MAP`) — "권한이 없다"는 뜻이 아니라 "상태를 못 읽었다"는
 * 뜻이므로 `'denied'`와 절대 동일시하지 않는다. 이 키 이름·의미는 devtools
 * `PERMISSION_PROBE_MAP`과 조율 없이 바꾸지 않는다(devtools#744 주석 참고).
 *
 * ─ mock 합성 (env1) ──────────────────────────────────────────────────────────
 * env1(vitest)에서는 test-runner preflight가 돌지 않아 `__AIT_PERMS__`가
 * undefined다. 이때는 devtools mock이 이미 들고 있는
 * `aitState.state.permissions`(6-key: clipboard/contacts/photos/geolocation/
 * camera/microphone, `DEFAULT_STATE` 참고)에서 같은 6-key shape으로 매핑한다.
 * mock은 `microphone`을 쓰는 SDK 함수가 없어 사용하지 않는다. 매핑은 mock의
 * `withPermission(fn, permissionName)` 배선과 1:1로 대응한다:
 *
 * | `__AIT_PERMS__` key | mock `permissions` key | mock에 걸린 SDK 함수            |
 * |---------------------|-------------------------|----------------------------------|
 * | clipboardRead        | clipboard                | getClipboardText                 |
 * | clipboardWrite       | clipboard                | setClipboardText                 |
 * | album                | photos                   | fetchAlbumPhotos / fetchAlbumItems |
 * | camera               | camera                   | openCamera                        |
 * | contacts             | contacts                 | fetchContacts                     |
 * | location             | geolocation              | getCurrentLocation                |
 *
 * mock에 명시적 상태가 없는 키는(이론상 없음 — DEFAULT_STATE가 6개 다 채움)
 * `'allowed'`로 기본 처리한다(devtools mock 기본 상태와 정합).
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */

/** `__AIT_PERMS__`/합성 결과가 취할 수 있는 값 — devtools#744 계약과 동일. */
export type AitPermState = 'allowed' | 'denied' | 'notDetermined' | 'unavailable';

/** `__AIT_PERMS__`의 6-key shape. */
export interface AitPerms {
  clipboardRead: AitPermState;
  clipboardWrite: AitPermState;
  album: AitPermState;
  camera: AitPermState;
  contacts: AitPermState;
  location: AitPermState;
}

declare global {
  // eslint 없음(Biome) — global 변수 augmentation은 `var`만 허용.
  // eslint-disable-next-line no-var
  var __AIT_PERMS__: AitPerms | undefined;
}

/** devtools mock의 `aitState.state.permissions`가 노출하는 6-key 원본 shape. */
interface MockPermissionsState {
  clipboard?: AitPermState;
  contacts?: AitPermState;
  photos?: AitPermState;
  geolocation?: AitPermState;
  camera?: AitPermState;
  microphone?: AitPermState;
}

/** mock 미탑재/미실행 등 어떤 이유로도 읽기가 실패하면 안전하게 undefined. */
async function readMockPermissionsState(): Promise<MockPermissionsState | undefined> {
  try {
    const mod: unknown = await import('@apps-in-toss/web-framework');
    const aitState = (mod as { aitState?: { state?: { permissions?: MockPermissionsState } } })
      .aitState;
    return aitState?.state?.permissions;
  } catch {
    return undefined;
  }
}

/** mock 값이 없을 때(이론상 도달 안 함) 안전한 기본값 — devtools mock DEFAULT_STATE와 정합. */
function withDefault(value: AitPermState | undefined): AitPermState {
  return value ?? 'allowed';
}

/**
 * mock의 `permissions` 6-key(clipboard/contacts/photos/geolocation/camera/
 * microphone) 상태를 `__AIT_PERMS__`와 동일한 6-key shape으로 매핑한다.
 * 위 매핑 표 참고 — `withPermission()` 배선과 1:1 대응.
 */
function synthesizeFromMock(mockPermissions: MockPermissionsState | undefined): AitPerms {
  return {
    clipboardRead: withDefault(mockPermissions?.clipboard),
    clipboardWrite: withDefault(mockPermissions?.clipboard),
    album: withDefault(mockPermissions?.photos),
    camera: withDefault(mockPermissions?.camera),
    contacts: withDefault(mockPermissions?.contacts),
    location: withDefault(mockPermissions?.geolocation),
  };
}

/**
 * 현재 cell의 권한 상태 6종을 반환한다.
 *
 * - env3(실기기): devtools#744 preflight가 첫 테스트 파일 주입 전에 채운
 *   `globalThis.__AIT_PERMS__`를 그대로 반환한다.
 * - env1(mock/vitest): `__AIT_PERMS__`가 없으므로 devtools mock의
 *   `aitState.state.permissions`에서 같은 shape을 합성한다.
 *
 * 어느 경로든 실패하지 않는다 — mock 읽기가 실패해도 전부 `'allowed'`(devtools
 * mock 기본 상태)로 안전하게 떨어진다.
 */
export async function getAitPerms(): Promise<AitPerms> {
  const injected = globalThis.__AIT_PERMS__;
  if (injected !== undefined) {
    return injected;
  }
  const mockPermissions = await readMockPermissionsState();
  return synthesizeFromMock(mockPermissions);
}
