import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { getPermission, openPermissionDialog, requestPermission } from '@apps-in-toss/web-framework';

const permissionOptions = [
  { label: 'camera', value: 'camera' },
  { label: 'photo', value: 'photo' },
  { label: 'contacts', value: 'contacts' },
  { label: 'location', value: 'location' },
  { label: 'microphone', value: 'microphone' },
  { label: 'notification', value: 'notification' },
];

export function PermissionsPage() {
  return (
    <div>
      <PageHeader title="Permissions" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="getPermission"
          description="권한 상태 조회"
          params={[{ name: 'name', label: 'Permission', type: 'select', options: permissionOptions, defaultValue: 'camera' }]}
          execute={async (p) => await getPermission(p.name as any)}
        />
        <ApiCard
          name="openPermissionDialog"
          description="권한 요청 다이얼로그"
          params={[{ name: 'name', label: 'Permission', type: 'select', options: permissionOptions, defaultValue: 'camera' }]}
          execute={async (p) => await openPermissionDialog(p.name as any)}
        />
        <ApiCard
          name="requestPermission"
          description="권한 요청"
          params={[
            { name: 'name', label: 'Permission', type: 'select', options: permissionOptions, defaultValue: 'camera' },
            { name: 'access', label: 'Access', placeholder: 'read', defaultValue: 'read' },
          ]}
          execute={async (p) => await requestPermission({ name: p.name as any, access: p.access as any })}
        />
      </div>
    </div>
  );
}
