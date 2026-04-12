import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { Analytics, eventLog } from '@apps-in-toss/web-framework';

// log_type values accepted by eventLog (aligns with SDK/mock union)
type EventLogType = 'debug' | 'info' | 'warn' | 'error' | 'event' | 'screen' | 'impression' | 'click';

const logTypeOptions: { label: string; value: EventLogType }[] = [
  { label: 'event', value: 'event' },
  { label: 'click', value: 'click' },
  { label: 'screen', value: 'screen' },
  { label: 'impression', value: 'impression' },
  { label: 'debug', value: 'debug' },
  { label: 'info', value: 'info' },
  { label: 'warn', value: 'warn' },
  { label: 'error', value: 'error' },
];

export function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="Analytics.screen"
          description="화면 조회 로그"
          params={[{ name: 'page', label: 'Page', placeholder: 'home', defaultValue: 'home' }]}
          execute={async (p) => { await Analytics.screen({ page: p.page as string }); }}
        />
        <ApiCard
          name="Analytics.impression"
          description="노출 로그"
          params={[
            { name: 'component', label: 'Component', placeholder: 'banner', defaultValue: 'banner' },
            { name: 'page', label: 'Page', placeholder: 'home', defaultValue: 'home' },
          ]}
          execute={async (p) => { await Analytics.impression({ component: p.component as string, page: p.page as string }); }}
        />
        <ApiCard
          name="Analytics.click"
          description="클릭 로그"
          params={[
            { name: 'component', label: 'Component', placeholder: 'button', defaultValue: 'button' },
            { name: 'page', label: 'Page', placeholder: 'home', defaultValue: 'home' },
          ]}
          execute={async (p) => { await Analytics.click({ component: p.component as string, page: p.page as string }); }}
        />
        <ApiCard
          name="eventLog"
          description="커스텀 이벤트 로그"
          params={[
            { name: 'log_name', label: 'Log Name', placeholder: 'custom_event', defaultValue: 'custom_event' },
            { name: 'log_type', label: 'Log Type', type: 'select', options: logTypeOptions, defaultValue: 'event' },
          ]}
          execute={async (p) => {
            await eventLog({
              log_name: p.log_name as string,
              log_type: p.log_type as EventLogType,
              params: {},
            });
          }}
        />
      </div>
    </div>
  );
}
