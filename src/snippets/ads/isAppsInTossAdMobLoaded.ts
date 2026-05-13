import { GoogleAdMob } from '@apps-in-toss/web-framework';

const loaded = await GoogleAdMob.isAppsInTossAdMobLoaded({
  adGroupId: 'adGroupId',
});
console.log('admob loaded:', loaded);
