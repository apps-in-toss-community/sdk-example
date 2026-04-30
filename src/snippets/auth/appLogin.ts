import { appLogin } from '@apps-in-toss/web-framework';

const result = await appLogin();
// → { authorizationCode: string }
