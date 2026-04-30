import { showFullScreenAd } from '@apps-in-toss/web-framework';

showFullScreenAd({
  onEvent: (e) => {
    console.log('fullscreen show event', e);
  },
  onError: (e) => {
    console.error(e);
  },
});
