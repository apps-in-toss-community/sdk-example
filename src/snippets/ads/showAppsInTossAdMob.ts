import { GoogleAdMob } from '@apps-in-toss/web-framework';

GoogleAdMob.showAppsInTossAdMob({
  options: { adGroupId: 'adGroupId' },
  onEvent: (e) => {
    console.log('admob show event', e);
  },
  onError: (e) => {
    console.error(e);
  },
});
