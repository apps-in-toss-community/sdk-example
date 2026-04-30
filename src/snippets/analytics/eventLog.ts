import { eventLog } from '@apps-in-toss/web-framework';

await eventLog({
  log_name,
  log_type, // 'event' | 'click' | 'screen' | 'impression' | 'debug' | 'info' | 'warn' | 'error'
  params: {},
});
