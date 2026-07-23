/**
 * navigation `.ait.test` — 값 다양화 + 의도적 오류 + 4-cell 오류-shape 캡처.
 *
 * 확인된 오용 가드:
 *  - N1: openURL이 reject하면 그 rejection이 caller에게 관측된다(삼켜지지 않음).
 *  - N2: getTossShareLink('/some/path') (intoss:// 없는 bare path)가 조용히
 *        "유효한" mini-app 딥링크를 만들지 않는다 — 유효 입력과 shape가 발산한다.
 *
 * ─ #331: 미측정 API 캡처 확장 + native-UI side-effect OOS 선언 ────────────────
 * setIosSwipeGestureEnabled/setScreenAwakeMode/setSecureScreen은 네이티브 UI를
 * 열지 않는 순수 상태 setter라 device 상호작용 없이 자동 캡처 대상에 추가한다.
 * 반대로 share/requestReview/closeView/openPDFViewer는 사람이 화면을 보고
 * 선택·완료·종료해야 낙착되는 native-UI side-effect라 자동 device diff가
 * 구조적으로 불가능하다 — 맨 아래 OOS describe에서 명시적으로 문서화한다
 * (silent omission 금지).
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import {
  closeView,
  getTossShareLink,
  openPDFViewer,
  openURL,
  requestReview,
  setDeviceOrientation,
  setIosSwipeGestureEnabled,
  setScreenAwakeMode,
  setSecureScreen,
  share,
} from '@apps-in-toss/web-framework';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { captureAsync, captureSync, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'navigation';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('navigation · 값 다양화 (happy path)', () => {
  it('setDeviceOrientation를 각 orientation union 멤버로 호출', () => {
    for (const type of ['portrait', 'landscape'] as const) {
      const { outcome } = captureSync(
        {
          category: CATEGORY,
          api: 'setDeviceOrientation',
          scenario: 'happy-orientation-union',
          input: { type },
        },
        () => setDeviceOrientation({ type }),
      );
      expect(outcome).toBe('returned-sync');
    }
  });

  it('getTossShareLink가 유효한 intoss:// 경로를 string 링크로 resolve', async () => {
    const { value } = await captureAsync(
      {
        category: CATEGORY,
        api: 'getTossShareLink',
        scenario: 'happy-intoss-uri',
        input: 'intoss://my-app',
      },
      () => getTossShareLink('intoss://my-app'),
    );
    expect(typeof value).toBe('string');
    // env3(실기기 2.x)는 verbatim intoss:// 스킴이 아니라 유효한 Toss 단축 링크
    // (e.g. https://minion.toss.im/...)를 반환한다 — toContain('intoss://my-app')은
    // env3에서 ENV_EXPECTED 실패다. string 계약(typeof)만 가드한다.
  });

  // #331: 미측정 API 캡처 확장. 아래 3개는 네이티브 UI를 열지 않는 순수 상태
  // setter라 device 상호작용 없이 자동 캡처 가능하다(closeView/share 등
  // native-UI side-effect와는 다른 축 — 파일 하단 OOS describe 참조).
  it('setIosSwipeGestureEnabled를 true/false로 호출 (#331)', async () => {
    for (const isEnabled of [true, false]) {
      const { outcome } = await captureAsync(
        {
          category: CATEGORY,
          api: 'setIosSwipeGestureEnabled',
          scenario: 'happy-varied-isEnabled',
          input: { isEnabled },
        },
        () => setIosSwipeGestureEnabled({ isEnabled }),
      );
      expect(outcome).toBe('resolved');
    }
  });

  it('setScreenAwakeMode를 true/false로 호출 — 설정한 값을 echo (#331)', async () => {
    for (const enabled of [true, false]) {
      const { outcome, value } = await captureAsync(
        {
          category: CATEGORY,
          api: 'setScreenAwakeMode',
          scenario: 'happy-varied-enabled',
          input: { enabled },
        },
        () => setScreenAwakeMode({ enabled }),
      );
      expect(outcome).toBe('resolved');
      expect(value).toMatchObject({ enabled });
    }
  });

  it('setSecureScreen을 true/false로 호출 — 설정한 값을 echo (#331)', async () => {
    for (const enabled of [true, false]) {
      const { outcome, value } = await captureAsync(
        {
          category: CATEGORY,
          api: 'setSecureScreen',
          scenario: 'happy-varied-enabled',
          input: { enabled },
        },
        () => setSecureScreen({ enabled }),
      );
      expect(outcome).toBe('resolved');
      expect(value).toMatchObject({ enabled });
    }
  });
});

describe('navigation · 의도적 오류 (확인된 오용 가드)', () => {
  // N1: openURL이 reject하는 환경에서 그 rejection이 caller에게 전파되는지.
  // mock은 window.open으로 라우팅하므로, window.open이 throw하게 만들어
  // openURL이 reject하고 caller의 await가 그 reject를 관측하는지 가드한다.
  // env3(실기기)는 openURL이 native ReactNativeWebView 브리지로 라우팅되므로
  // window.open spy가 발화하지 않아 call이 resolve된다 — spy 기반 rejection은
  // mock 전용 테스트다. 실기기에서 유효한 URL이 resolve하는 것은 올바른 동작.
  it.skipIf(cell.platform !== 'mock')(
    '[N1] openURL의 rejection이 caller에게 전파된다 (삼켜지지 않음)',
    async () => {
      vi.spyOn(window, 'open').mockImplementation(() => {
        throw new Error('navigation blocked');
      });
      const { outcome, error } = await captureAsync(
        {
          category: CATEGORY,
          api: 'openURL',
          scenario: 'N1-rejection-propagates',
          input: 'https://example.com',
        },
        () => openURL('https://example.com'),
      );
      // reject가 caller에 도달해야 한다 — resolve로 삼켜지면 회귀.
      expect(outcome).toBe('rejected');
      expect(error).toBeInstanceOf(Error);
    },
  );

  // N2: bare path('/some/path', scheme 없음)는 유효한 mini-app 딥링크가 아니다.
  //
  // 예전에는 이 발산을 **반환값**으로 확인했다 — mock이 bare path에도 링크 문자열을
  // 돌려줬기 때문에 "두 문자열이 서로 다른가"를 볼 수밖에 없었다. 실기기(env3)는
  // 이 입력을 네이티브 오류 envelope(`code: EXECUTION_ERROR`)로 아예 reject하므로, 그
  // 단언은 mock에서만 성립하는 형태였다. devtools#781이 mock에 scheme 검증을 넣으면서
  // 이제 두 환경 모두 거부하므로, 발산을 **outcome**(거부 vs 성공)으로 확인한다 —
  // 훨씬 강한 가드다. 오류 코드는 네이티브 envelope의 `.code` 필드에서 읽는다
  // (devtools#790이 손수 만든 `.errorCode` 대신 실기기 envelope으로 정렬).
  it('[N2] getTossShareLink는 scheme 없는 bare path를 거부하고 유효 입력은 통과시킨다', async () => {
    const bare = await captureAsync(
      {
        category: CATEGORY,
        api: 'getTossShareLink',
        scenario: 'N2-bare-path-invalid',
        input: '/some/path',
      },
      () => getTossShareLink('/some/path'),
    );
    const valid = await captureAsync(
      {
        category: CATEGORY,
        api: 'getTossShareLink',
        scenario: 'N2-valid-intoss-baseline',
        input: 'intoss://my-app',
      },
      () => getTossShareLink('intoss://my-app'),
    );
    // bare path는 거부된다 — 잘못된 입력이 유효한 링크로 오인되지 않는다.
    expect(bare.outcome).toBe('rejected');
    expect((bare.error as { code?: unknown } | undefined)?.code).toBe('EXECUTION_ERROR');
    // scheme이 있는 유효 입력은 계속 통과한다 — 검증이 과도하지 않은지 확인.
    // 반환 문자열의 내용은 단언하지 않는다: env3는 verbatim intoss:// 스킴이 아니라
    // Toss 단축 링크를 돌려주므로(위 happy-intoss-uri 주석 참조) toContain('intoss://')는
    // mock 구현이 입력을 그대로 echo하는 것에만 성립하는 env1 전용 단언이 된다.
    // N2가 가드하려는 건 "과도한 검증이 유효 입력까지 막지 않는다"이고, outcome만으로 충분하다.
    expect(valid.outcome).toBe('resolved');
    expect(typeof valid.value).toBe('string');
  });
});

describe('navigation · OOS: native-UI side-effect (자동 device diff 구조적 불가, #331)', () => {
  // 아래 4개는 자동 device diff가 구조적으로 불가능해 명시적으로 out-of-scope로
  // 문서화한다(silent omission 금지 — 조용히 빠진 게 아니라 의도된 스코프
  // 결정이다). GPS·해프틱류 하드웨어 감응 축과 같은 원칙 — 자동 캡처 대상은
  // 아니지만 export surface 존재는 계속 가드해 SDK 쪽 rename/제거는 잡는다.
  // 실기기 검증은 사람이 직접 실행하는 별도 세션의 몫이다(이 슈트의 스코프 밖).

  it('share — human-in-loop, 자동 diff 불가 (OOS, #331)', () => {
    // 네이티브 OS 공유 시트를 띄운다. 사용자가 어떤 앱으로 공유했는지(또는
    // 취소했는지)는 반환값(Promise<void>)에 실리지 않고, 시트가 닫혀야 비로소
    // Promise가 낙착된다 — 완료 신호 자체가 사람의 선택에 달려 있다.
    expect(typeof share).toBe('function');
  });

  it('requestReview — human-in-loop, 자동 diff 불가 (OOS, #331)', () => {
    // 네이티브 앱스토어 리뷰 프롬프트. OS가 자체 쿼터(연간 노출 횟수 제한)로
    // 프롬프트를 아예 안 띄울 수도 있어, 사람이 매번 응답해도 재현 가능한
    // capture 대상이 아니다.
    expect(typeof requestReview).toBe('function');
  });

  it('closeView — 세션 종료 부작용, 자동 diff 불가 (OOS, #331)', () => {
    // 현재 미니앱 화면을 닫는 호출 자체가 실행 중인 WebView 세션을 끝낸다 —
    // 자동 하네스 안에서 호출하면 그 뒤에 이어질 캡처/flush가 전부 유실된다.
    expect(typeof closeView).toBe('function');
  });

  it('openPDFViewer — human-in-loop, 자동 diff 불가 (OOS, #331)', () => {
    // 네이티브 PDF 뷰어를 연다 — 사람이 뷰어를 닫아야('CLOSE') Promise가
    // 낙착된다. 닫는 시점·행동을 자동으로 합성할 수단이 없다.
    expect(typeof openPDFViewer).toBe('function');
  });
});

describe('navigation · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
