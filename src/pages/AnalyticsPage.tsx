import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { Analytics, eventLog } from '@apps-in-toss/web-framework';

export function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="Analytics.screen"
          description="화면 조회 로그"
          params={[{ name: 'page', label: 'Page', placeholder: 'home', defaultValue: 'home' }]}
          execute={async (p) => { await Analytics.screen({ page: p.page }); return 'logged'; }}
        />
        <ApiCard
          name="Analytics.impression"
          description="노출 로그"
          params={[
            { name: 'component', label: 'Component', placeholder: 'banner', defaultValue: 'banner' },
            { name: 'page', label: 'Page', placeholder: 'home', defaultValue: 'home' },
          ]}
          execute={async (p) => { await Analytics.impression({ component: p.component, page: p.page }); return 'logged'; }}
        />
        <ApiCard
          name="Analytics.click"
          description="클릭 로그"
          params={[
            { name: 'component', label: 'Component', placeholder: 'button', defaultValue: 'button' },
            { name: 'page', label: 'Page', placeholder: 'home', defaultValue: 'home' },
          ]}
          execute={async (p) => { await Analytics.click({ component: p.component, page: p.page }); return 'logged'; }}
        />
        <ApiCard
          name="eventLog"
          description="커스텀 이벤트 로그"
          params={[
            { name: 'log_name', label: 'Log Name', placeholder: 'custom_event', defaultValue: 'custom_event' },
            { name: 'log_type', label: 'Log Type', placeholder: 'click', defaultValue: 'click' },
          ]}
          execute={async (p) => { await eventLog({ log_name: p.log_name, log_type: p.log_type as any, params: {} }); return 'logged'; }}
        />
      </div>
    </div>
  );
}
