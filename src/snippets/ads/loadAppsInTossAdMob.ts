import { GoogleAdMob } from '@apps-in-toss/web-framework';

GoogleAdMob.loadAppsInTossAdMob({
  options: { adGroupId: 'adGroupId' },
  onEvent: (e) => {
    console.log('admob load event', e);
  },
  onError: (e) => {
    console.error(e);
  },
});
