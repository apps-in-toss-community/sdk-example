import { TossAds } from '@apps-in-toss/web-framework';

const slot = TossAds.attachBanner('adGroupId', '#banner-slot', {
  theme: 'auto',
  variant: 'card',
});

// Later: tear the banner down.
slot.destroy();
