import type { PermissionName } from '@apps-in-toss/web-framework';
import {
  getPermission,
  openPermissionDialog,
  requestPermission,
} from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
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
      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
        <ApiCard
          name="getPermission"
          description={t('pages.permissions.getPermission.description')}
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
          description={t('pages.permissions.openPermissionDialog.description')}
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
          description={t('pages.permissions.requestPermission.description')}
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
