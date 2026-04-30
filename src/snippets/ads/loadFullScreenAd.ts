import { loadFullScreenAd } from '@apps-in-toss/web-framework';

loadFullScreenAd({
  onEvent: (e) => {
    console.log('fullscreen load event', e);
  },
  onError: (e) => {
    console.error(e);
  },
});
