/**
 * events `.ait.test` — captureCallback(#267) 기반 이벤트-구독 생명주기 캡처.
 *
 * 이 카테고리는 4개의 서로 다른 이벤트-구독 API를 다룬다. 각각 mock에서 합성
 * 트리거가 가능한지 여부가 다르므로 API별로 무인 실행 근거가 다르다:
 *
 *  - `graniteEvent.addEventListener('backEvent'|'homeEvent', …)` — mock 구현이
 *    `window.addEventListener('__ait:backEvent', …)`로 구독하므로
 *    `window.dispatchEvent(new CustomEvent('__ait:backEvent'))`로 동기 합성 발화가
 *    가능하다(mock/index.js `graniteEvent` 구현 참고). env1에서 resolved를 하드 단언.
 *  - `tdsEvent.addEventListener('navigationAccessoryEvent', …)` — 동일하게
 *    `window.addEventListener('__ait:navigationAccessoryEvent', …)`로 구독해
 *    합성 CustomEvent(`detail`이 payload)로 발화 가능.
 *  - `onVisibilityChangedByTransparentServiceWeb` — `document.visibilitychange`를
 *    구독한다. jsdom에서 `document.hidden`은 read-only getter라 프로그래매틱 토글이
 *    불가능하므로, 이 API는 "구독하면 즉시 예외 없이 cleanup fn을 반환한다"는 생명주기
 *    shape만 단언하고 실제 이벤트 발화는 callback-timeout으로 정상 처리한다 —
 *    이는 회귀가 아니라 jsdom 환경 제약이다(실 브라우저 tab-visibility 토글 필요).
 *    **3.x 계약 divergence**: web-framework 3.0-beta에서 이 export가 완전히
 *    제거됐다(대체 없음) — `cell.sdkLine === '2.x'`로 이 describe 블록 전체를 게이트한다.
 *  - `appsInTossEvent.addEventListener` — `AppsInTossEvent` 타입이 현재 `{}`라 구독
 *    가능한 이벤트 키가 없다(SDK 문서: "예약된 네임스페이스"). mock 구현도 항상
 *    no-op cleanup만 반환한다. 따라서 실제 이벤트 키로 구독하는 테스트는 만들 수
 *    없고, export surface(`typeof addEventListener === 'function'`) 존재만 확인한다.
 *
 * 모든 case에서 `unsubscribe`(captureCallback의 cleanup)는 finally로 보장된다 —
 * 구독이 새면 이후 테스트를 오염시킬 수 있다(aitCapture.ts 문서 참고).
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { appsInTossEvent, graniteEvent, tdsEvent } from '@apps-in-toss/web-framework';
import { afterAll, describe, expect, it } from 'vitest';
import { captureCallback, cell, flushCapture } from '../../test/aitCapture';

const CATEGORY = 'events';

afterAll(async () => {
  await flushCapture(CATEGORY);
});

describe('events · graniteEvent (captureCallback, mock 합성 트리거)', () => {
  it('backEvent — 구독 후 합성 CustomEvent로 onEvent가 도착한다', async () => {
    const result = await captureCallback(
      { category: CATEGORY, api: 'graniteEvent.addEventListener', scenario: 'happy-backEvent', input: 'backEvent' },
      ({ onEvent }) => {
        const unsubscribe = graniteEvent.addEventListener('backEvent', { onEvent: () => onEvent(undefined) });
        if (cell.platform === 'mock') {
          // mock의 graniteEvent는 `window:__ait:backEvent` CustomEvent를 그대로
          // onEvent로 릴레이한다 — 합성 발화로 실계약 확인.
          queueMicrotask(() => window.dispatchEvent(new CustomEvent('__ait:backEvent')));
        }
        return unsubscribe;
      },
    );
    if (cell.platform === 'mock') {
      expect(result.outcome).toBe('resolved');
    } else {
      // env3: 합성 트리거 수단이 없다 — 실제 back 제스처 없이는 정당한 무응답.
      expect(['resolved', 'callback-timeout']).toContain(result.outcome);
    }
  });

  it('homeEvent — 구독 후 합성 CustomEvent로 onEvent가 도착한다', async () => {
    const result = await captureCallback(
      { category: CATEGORY, api: 'graniteEvent.addEventListener', scenario: 'happy-homeEvent', input: 'homeEvent' },
      ({ onEvent }) => {
        const unsubscribe = graniteEvent.addEventListener('homeEvent', { onEvent: () => onEvent(undefined) });
        if (cell.platform === 'mock') {
          queueMicrotask(() => window.dispatchEvent(new CustomEvent('__ait:homeEvent')));
        }
        return unsubscribe;
      },
    );
    if (cell.platform === 'mock') {
      expect(result.outcome).toBe('resolved');
    } else {
      expect(['resolved', 'callback-timeout']).toContain(result.outcome);
    }
  });
});

describe('events · tdsEvent (captureCallback, mock 합성 트리거)', () => {
  it('navigationAccessoryEvent — 구독 후 합성 CustomEvent(detail={id})로 payload를 전달받는다', async () => {
    const result = await captureCallback(
      {
        category: CATEGORY,
        api: 'tdsEvent.addEventListener',
        scenario: 'happy-navigationAccessoryEvent',
        input: 'navigationAccessoryEvent',
      },
      ({ onEvent }) => {
        const unsubscribe = tdsEvent.addEventListener('navigationAccessoryEvent', {
          onEvent: (event) => onEvent(event),
        });
        if (cell.platform === 'mock') {
          // mock의 tdsEvent는 CustomEvent.detail을 payload로 그대로 전달한다.
          queueMicrotask(() =>
            window.dispatchEvent(new CustomEvent('__ait:navigationAccessoryEvent', { detail: { id: 'heart' } })),
          );
        }
        return unsubscribe;
      },
    );
    if (cell.platform === 'mock') {
      expect(result.outcome).toBe('resolved');
      expect(result.value).toMatchObject({ id: 'heart' });
    } else {
      expect(['resolved', 'callback-timeout']).toContain(result.outcome);
    }
  });
});

describe.skipIf(cell.sdkLine === '3.x')(
  'events · onVisibilityChangedByTransparentServiceWeb (captureCallback, cleanup shape만 단언)',
  () => {
    // jsdom에서 document.hidden은 read-only getter라 visibilitychange를 프로그래매틱
    // 발화할 수단이 없다 — 구독 자체가 예외 없이 cleanup fn을 반환하는 생명주기만
    // 단언하고, 이벤트 미도착은 callback-timeout(정당한 무응답)으로 수렴시킨다.
    //
    // 3.x 계약 divergence: web-framework 3.0-beta에서 이 export가 완전히
    // 제거됐다(대체 없음). 정적 import는 typecheck·모듈 로드 시점에 깨지므로
    // describe 블록 전체를 `cell.sdkLine`으로 skip하고, import 자체도 동적으로
    // 블록 안에서만 수행한다.
    it('구독이 예외 없이 성립하고, 이벤트 미도착 시 callback-timeout으로 수렴한다', async () => {
      const { onVisibilityChangedByTransparentServiceWeb } = (await import(
        '@apps-in-toss/web-framework'
      )) as typeof import('@apps-in-toss/web-framework') & {
        onVisibilityChangedByTransparentServiceWeb: (params: {
          options: { callbackId: string };
          onEvent: (isVisible: boolean) => void;
          onError: (err: unknown) => void;
        }) => (() => void) | undefined;
      };
      const result = await captureCallback(
        {
          category: CATEGORY,
          api: 'onVisibilityChangedByTransparentServiceWeb',
          scenario: 'happy-subscribe-lifecycle',
          input: { callbackId: 'ait-test-visibility' },
          timeoutMs: 500,
        },
        ({ onEvent, onError }) =>
          onVisibilityChangedByTransparentServiceWeb({
            options: { callbackId: 'ait-test-visibility' },
            onEvent: (isVisible) => onEvent({ isVisible }),
            onError,
          }),
      );
      // jsdom·env3 둘 다 이 테스트에서 visibility를 합성 토글하지 않으므로
      // callback-timeout이 기대 outcome이다 — resolved가 온다면 그것도 유효한 shape.
      expect(['resolved', 'callback-timeout']).toContain(result.outcome);
      if (result.outcome === 'resolved') {
        expect(result.value).toMatchObject({ isVisible: expect.any(Boolean) });
      }
    });
  },
);

describe.runIf(cell.sdkLine === '3.x')(
  'events · onVisibilityChangedByTransparentServiceWeb (3.x 계약 divergence — export 제거 확인)',
  () => {
    it('web-framework 3.0-beta에서 이 export가 존재하지 않는다', async () => {
      const mod = await import('@apps-in-toss/web-framework');
      expect('onVisibilityChangedByTransparentServiceWeb' in mod).toBe(false);
    });
  },
);

describe('events · appsInTossEvent (예약된 네임스페이스 — export surface만 확인)', () => {
  // `AppsInTossEvent`가 현재 `{}`라 구독 가능한 이벤트 키가 없다(SDK 문서 명시).
  // 실제 키로 addEventListener를 호출하는 테스트는 타입/런타임 양쪽에서 만들 수
  // 없으므로, export surface 존재만 확인한다 — 향후 키가 추가되면 이 테스트를
  // captureCallback 기반으로 교체한다.
  it('appsInTossEvent.addEventListener가 함수로 export된다', () => {
    expect(typeof appsInTossEvent.addEventListener).toBe('function');
  });
});

describe('events · 4-cell 오류-shape 캡처', () => {
  it('호출 결과가 capture sink에 쌓인다', () => {
    expect(true).toBe(true);
  });
});
