import { openPermissionDialog } from '@apps-in-toss/web-framework';

const result = await openPermissionDialog({ name, access: 'read' });
