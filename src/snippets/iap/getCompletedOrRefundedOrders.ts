import { IAP } from '@apps-in-toss/web-framework';

const orders = await IAP.getCompletedOrRefundedOrders();
