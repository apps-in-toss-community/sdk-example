import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Navigation 으로 들어온 페이지에서 URL hash 가 가리키는 요소로 스크롤한다.
 * router 가 hash 만으로는 자동 스크롤하지 않으므로 (default scrollRestoration
 * 도 안 잡힘), pathname/hash 변경에 한 번씩 후보 요소를 찾아 scrollIntoView.
 *
 * ApiCard 가 id="api-{name}" 으로 박혀있고, HomePage 검색 dropdown 이
 * `${path}#api-{name}` 으로 이동하기 때문에 두 지점이 이 hook 으로 이어진다.
 */
export function useHashScroll(): void {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    // 다음 frame 까지 한 번 yield 해 페이지 mount 후 ApiCard 가 그려진 다음
    // scroll 하도록 한다. 그래도 못 찾으면 50ms 후 한 번 더 시도해 lazy
    // mount/async i18n 시점을 흡수.
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return !!el;
    };
    const raf = requestAnimationFrame(() => {
      if (!tryScroll()) {
        const t = setTimeout(tryScroll, 50);
        return () => clearTimeout(t);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [hash]);
}
