import { showFullScreenAd } from '@apps-in-toss/web-framework';

showFullScreenAd({
  options: { adGroupId: 'adGroupId' },
  onEvent: (e) => {
    console.log('fullscreen show event', e);
  },
  onError: (e) => {
    console.error(e);
  },
});
