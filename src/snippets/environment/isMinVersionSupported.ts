import { isMinVersionSupported } from '@apps-in-toss/web-framework';

const supported = isMinVersionSupported({
  android: '5.0.0',
  ios: '5.0.0',
});
