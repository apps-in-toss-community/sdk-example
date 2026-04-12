import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { partner } from '@apps-in-toss/web-framework';

export function PartnerPage() {
  return (
    <div>
      <PageHeader title="Partner" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="partner.addAccessoryButton"
          description="액세서리 버튼 추가"
          params={[
            { name: 'id', label: 'Button ID', placeholder: 'btn-1', defaultValue: 'btn-1' },
            { name: 'title', label: 'Title', placeholder: 'My Button', defaultValue: 'My Button' },
            { name: 'iconName', label: 'Icon Name', placeholder: 'star', defaultValue: 'star' },
          ]}
          execute={async (p) => { await partner.addAccessoryButton({ id: p.id as string, title: p.title as string, icon: { name: p.iconName as string } }); }}
        />
        <ApiCard
          name="partner.removeAccessoryButton"
          description="액세서리 버튼 제거"
          execute={async () => { await partner.removeAccessoryButton(); }}
        />
      </div>
    </div>
  );
}
