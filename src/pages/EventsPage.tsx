import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { HistoryLog, type HistoryEntry } from '../components/HistoryLog';
import { graniteEvent, tdsEvent, onVisibilityChangedByTransparentServiceWeb } from '@apps-in-toss/web-framework';

interface EventSubscriberCardProps {
  name: string;
  description: string;
  /**
   * Called once on each subscribe toggle. Callers should not rely on closure
   * stability — a new subscription is created every time the user toggles on.
   */
  subscribe: (onEvent: (payload: unknown) => void) => () => void;
}

function EventSubscriberCard({ name, description, subscribe }: EventSubscriberCardProps) {
  const [events, setEvents] = useState<HistoryEntry[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  function toggle() {
    if (isSubscribed) {
      unsubRef.current?.();
      unsubRef.current = null;
      setIsSubscribed(false);
    } else {
      const unsub = subscribe((payload) => {
        setEvents((prev) => [{ timestamp: Date.now(), status: 'success' as const, data: payload }, ...prev].slice(0, 20));
      });
      unsubRef.current = unsub;
      setIsSubscribed(true);
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      unsubRef.current?.();
    };
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 font-mono">{name}</h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            isSubscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          {isSubscribed ? '구독 중' : '미구독'}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      <button
        type="button"
        onClick={toggle}
        className={`mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
          isSubscribed
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-gray-900 hover:bg-gray-800'
        }`}
      >
        {isSubscribed ? '구독 해제' : '구독'}
      </button>

      <HistoryLog entries={events} />
    </div>
  );
}

export function EventsPage() {
  return (
    <div>
      <PageHeader title="Events" />
      <div className="p-4 space-y-3">
        <EventSubscriberCard
          name="graniteEvent — backEvent"
          description="뒤로가기 버튼 이벤트 구독"
          subscribe={(onEvent) =>
            graniteEvent.addEventListener('backEvent', {
              onEvent: () => onEvent(undefined),
            })
          }
        />
        <EventSubscriberCard
          name="graniteEvent — homeEvent"
          description="홈 버튼 이벤트 구독"
          subscribe={(onEvent) =>
            graniteEvent.addEventListener('homeEvent', {
              onEvent: () => onEvent(undefined),
            })
          }
        />
        <EventSubscriberCard
          name="tdsEvent — navigationAccessoryEvent"
          description="상단 네비게이션 액세서리 버튼 이벤트 구독"
          subscribe={(onEvent) =>
            tdsEvent.addEventListener('navigationAccessoryEvent', {
              onEvent: (e) => onEvent(e),
            })
          }
        />
        <EventSubscriberCard
          name="onVisibilityChangedByTransparentServiceWeb"
          description="투명 서비스 웹 가시성 변경 이벤트 구독"
          subscribe={(onEvent) =>
            onVisibilityChangedByTransparentServiceWeb({
              options: { callbackId: 'sdk-example-visibility' },
              onEvent: (isVisible) => onEvent({ isVisible }),
              onError: (err) => onEvent({ error: String(err) }),
            })
          }
        />
      </div>
    </div>
  );
}
