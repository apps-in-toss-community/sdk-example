import {
  graniteEvent,
  onVisibilityChangedByTransparentServiceWeb,
  tdsEvent,
} from '@apps-in-toss/web-framework';
import { useEffect, useRef, useState } from 'react';
import { CodeSnippet } from '../components/CodeSnippet';
import {
  appendHistory,
  createHistoryEntry,
  type HistoryEntry,
  HistoryLog,
} from '../components/HistoryLog';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import { docsLink } from '../lib/docs';
import appsInTossEventAddEventListenerSnippet from '../snippets/events/appsInTossEventAddEventListener.ts?raw';
import graniteBackEventSnippet from '../snippets/events/graniteBackEvent.ts?raw';
import graniteHomeEventSnippet from '../snippets/events/graniteHomeEvent.ts?raw';
import onVisibilityChangedByTransparentServiceWebSnippet from '../snippets/events/onVisibilityChangedByTransparentServiceWeb.ts?raw';
import tdsNavigationAccessoryEventSnippet from '../snippets/events/tdsNavigationAccessoryEvent.ts?raw';

/**
 * Docs anchor marker for bespoke (non-ApiCard) cards. Doubles as the
 * verify-crosslinks signal — `docsLink(namespace, method)` is what the docs
 * scanner picks up via DOCS_LINK_JSX_REGEX.
 */
function DocsLink({ namespace, method }: { namespace: string; method: string }) {
  return (
    <a
      href={docsLink(namespace, method)}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 underline-offset-2 hover:underline"
    >
      {t('apiCard.docsLink')}
    </a>
  );
}

interface EventSubscriberCardProps {
  name: string;
  description: string;
  /**
   * Called once on each subscribe toggle. Callers should not rely on closure
   * stability — a new subscription is created every time the user toggles on.
   */
  subscribe: (onEvent: (payload: unknown) => void) => () => void;
  /** Source snippet for this event subscription. Loaded via Vite `?raw` import. */
  snippet?: string;
  /** Optional docs slug under `events/` (e.g. `graniteEvent-addEventListener`). */
  docsSlug?: string;
}

function EventSubscriberCard({
  name,
  description,
  subscribe,
  snippet,
  docsSlug,
}: EventSubscriberCardProps) {
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
        setEvents((prev) =>
          appendHistory(prev, createHistoryEntry({ status: 'success', data: payload })),
        );
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 font-mono dark:text-gray-100">{name}</h3>
        <div className="flex items-center gap-2">
          {docsSlug && <DocsLink namespace="events" method={docsSlug} />}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isSubscribed
                ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isSubscribed ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-500'
              }`}
            />
            {isSubscribed ? '구독 중' : '미구독'}
          </span>
        </div>
      </div>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      <button
        type="button"
        onClick={toggle}
        className={`mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
          isSubscribed
            ? 'bg-red-600 hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600'
            : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
        }`}
      >
        {isSubscribed ? '구독 해제' : '구독'}
      </button>

      {snippet ? (
        <div className="mt-2 grid gap-2 md:grid-cols-2 md:items-start">
          <HistoryLog entries={events} onClear={() => setEvents([])} />
          <CodeSnippet code={snippet} label={`${name} source snippet`} />
        </div>
      ) : (
        <HistoryLog entries={events} onClear={() => setEvents([])} />
      )}
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
          description={t('pages.events.graniteBackEvent.description')}
          subscribe={(onEvent) =>
            graniteEvent.addEventListener('backEvent', {
              onEvent: () => onEvent(undefined),
            })
          }
          snippet={graniteBackEventSnippet}
          docsSlug="graniteEvent-addEventListener"
        />
        <EventSubscriberCard
          name="graniteEvent — homeEvent"
          description={t('pages.events.graniteHomeEvent.description')}
          subscribe={(onEvent) =>
            graniteEvent.addEventListener('homeEvent', {
              onEvent: () => onEvent(undefined),
            })
          }
          snippet={graniteHomeEventSnippet}
          docsSlug="graniteEvent-addEventListener"
        />
        <EventSubscriberCard
          name="tdsEvent — navigationAccessoryEvent"
          description={t('pages.events.tdsNavigationAccessoryEvent.description')}
          subscribe={(onEvent) =>
            tdsEvent.addEventListener('navigationAccessoryEvent', {
              onEvent: (e) => onEvent(e),
            })
          }
          snippet={tdsNavigationAccessoryEventSnippet}
          docsSlug="tdsEvent-addEventListener"
        />
        <EventSubscriberCard
          name="onVisibilityChangedByTransparentServiceWeb"
          description={t('pages.events.onVisibilityChangedByTransparentServiceWeb.description')}
          subscribe={(onEvent) =>
            onVisibilityChangedByTransparentServiceWeb({
              options: { callbackId: 'sdk-example-visibility' },
              onEvent: (isVisible) => onEvent({ isVisible }),
              onError: (err) => onEvent({ error: String(err) }),
            })
          }
          snippet={onVisibilityChangedByTransparentServiceWebSnippet}
        />
        <AppsInTossEventCard />
      </div>
    </div>
  );
}

/**
 * `appsInTossEvent.addEventListener` is exported by the SDK but the
 * `AppsInTossEvent` type is currently `{}` — no event keys exist yet to
 * subscribe to. This card documents the API surface and the planned use,
 * with a DocsLink to the reference page that explains the empty type.
 */
function AppsInTossEventCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 font-mono dark:text-gray-100">
          appsInTossEvent.addEventListener
        </h3>
        <div className="flex items-center gap-2">
          <DocsLink namespace="events" method="appsInTossEvent-addEventListener" />
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            예약됨
          </span>
        </div>
      </div>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        {t('pages.events.appsInTossEventAddEventListener.description')}
      </p>
      <CodeSnippet
        code={appsInTossEventAddEventListenerSnippet}
        label="appsInTossEvent.addEventListener source snippet"
      />
    </div>
  );
}
