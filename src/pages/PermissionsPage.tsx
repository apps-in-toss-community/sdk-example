import type { PermissionName } from '@apps-in-toss/web-framework';
import {
  getPermission,
  openPermissionDialog,
  requestPermission,
} from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import getPermissionSnippet from '../snippets/permissions/getPermission.ts?raw';
import openPermissionDialogSnippet from '../snippets/permissions/openPermissionDialog.ts?raw';
import requestPermissionSnippet from '../snippets/permissions/requestPermission.ts?raw';

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
          params={[
            {
              name: 'name',
              label: 'Permission',
              type: 'select',
              options: permissionOptions,
              defaultValue: 'camera',
              parse: (v) => v as PermissionName,
            },
          ]}
          execute={(p) => getPermission({ name: p.name, access: 'read' })}
          snippet={getPermissionSnippet}
        />
        <ApiCard
          name="openPermissionDialog"
          description="권한 요청 다이얼로그"
          params={[
            {
              name: 'name',
              label: 'Permission',
              type: 'select',
              options: permissionOptions,
              defaultValue: 'camera',
              parse: (v) => v as PermissionName,
            },
          ]}
          execute={(p) => openPermissionDialog({ name: p.name, access: 'read' })}
          snippet={openPermissionDialogSnippet}
        />
        <ApiCard
          name="requestPermission"
          description="권한 요청"
          params={[
            {
              name: 'name',
              label: 'Permission',
              type: 'select',
              options: permissionOptions,
              defaultValue: 'camera',
              parse: (v) => v as PermissionName,
            },
            {
              name: 'access',
              label: 'Access',
              type: 'select',
              options: [
                { label: 'read', value: 'read' },
                { label: 'write', value: 'write' },
              ],
              defaultValue: 'read',
              parse: (v) => v as 'read' | 'write',
            },
          ]}
          execute={(p) => requestPermission({ name: p.name, access: p.access })}
          snippet={requestPermissionSnippet}
        />
      </div>
    </div>
  );
}
