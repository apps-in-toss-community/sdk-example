import { GoogleAdMob } from '@apps-in-toss/web-framework';

GoogleAdMob.loadAppsInTossAdMob({
  onEvent: (e) => {
    console.log('admob load event', e);
  },
  onError: (e) => {
    console.error(e);
  },
});
