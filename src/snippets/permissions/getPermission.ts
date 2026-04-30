import { getPermission } from '@apps-in-toss/web-framework';

const result = await getPermission({ name, access: 'read' });
