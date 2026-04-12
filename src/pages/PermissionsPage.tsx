import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { getPermission, openPermissionDialog, requestPermission } from '@apps-in-toss/web-framework';
import type { PermissionName } from '@apps-in-toss/web-framework';

const permissionOptions: { label: string; value: PermissionName }[] = [
  { label: 'camera', value: 'camera' },
  { label: 'photos', value: 'photos' },
  { label: 'contacts', value: 'contacts' },
  { label: 'geolocation', value: 'geolocation' },
  { label: 'microphone', value: 'microphone' },
  { label: 'clipboard', value: 'clipboard' },
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
          execute={async (p) => await getPermission({ name: p.name as PermissionName, access: 'read' })}
        />
        <ApiCard
          name="openPermissionDialog"
          description="권한 요청 다이얼로그"
          params={[{ name: 'name', label: 'Permission', type: 'select', options: permissionOptions, defaultValue: 'camera' }]}
          execute={async (p) => await openPermissionDialog({ name: p.name as PermissionName, access: 'read' })}
        />
        <ApiCard
          name="requestPermission"
          description="권한 요청"
          params={[
            { name: 'name', label: 'Permission', type: 'select', options: permissionOptions, defaultValue: 'camera' },
            { name: 'access', label: 'Access', placeholder: 'read', defaultValue: 'read' },
          ]}
          execute={async (p) => await requestPermission({ name: p.name as PermissionName, access: p.access as 'read' | 'write' })}
        />
      </div>
    </div>
  );
}
