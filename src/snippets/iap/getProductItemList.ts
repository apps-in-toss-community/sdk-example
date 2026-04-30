import { IAP } from '@apps-in-toss/web-framework';

const result = await IAP.getProductItemList();
const items = result?.products ?? [];
