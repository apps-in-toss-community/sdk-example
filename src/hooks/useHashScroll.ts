import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Navigation 으로 들어온 페이지에서 URL hash 가 가리키는 요소로 스크롤한다.
 * router 가 hash 만으로는 자동 스크롤하지 않으므로, pathname+hash 변경에 한 번씩
 * 후보 요소를 찾아 scrollIntoView 한다.
 *
 * ApiCard 가 id="api-{name}" 으로 박혀있고, HomePage 검색 dropdown 이
 * `${path}#api-{name}` 으로 이동하기 때문에 두 지점이 이 hook 으로 이어진다.
 *
 * ### 검색 dropdown → 페이지 진입 흐름
 *
 * pathname 과 hash 가 동시에 바뀌는 경우, hash 만 dependency 로 두면
 * "이전 페이지에서 동일 hash 를 들고 다른 페이지로 재진입"할 때 effect 가
 * 다시 실행되지 않는다. pathname 을 함께 포함해 이를 방지한다.
 *
 * ### 타이밍 — rAF loop
 *
 * 페이지 컴포넌트는 useEffect 실행 시점에 React reconciliation 을 거쳐
 * DOM 에 존재하지만, ApiCard 는 그 컴포넌트 트리 안에 있어 한 프레임 뒤에
 * paint 된다. rAF loop 로 최대 ~1 초(16 ms × 60 회)간 재시도하고 element 를
 * 찾는 즉시 중단한다.
 */
export function useHashScroll(): void {
  const { pathname, hash } = useLocation();
  // pathname 은 effect 본문에서 직접 읽히지 않지만, "다른 페이지에서 동일 hash 로
  // 재진입" 시 effect 를 재실행하는 트리거로 반드시 포함돼야 한다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger dep
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);

    let rafId: ReturnType<typeof requestAnimationFrame>;
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // ~1 초 (16 ms × 60)

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) {
        rafId = requestAnimationFrame(tryScroll);
      }
    };

    rafId = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(rafId);
  }, [pathname, hash]);
}
