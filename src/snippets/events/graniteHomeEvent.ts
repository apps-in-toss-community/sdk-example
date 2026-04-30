import { graniteEvent } from '@apps-in-toss/web-framework';

const unsubscribe = graniteEvent.addEventListener('homeEvent', {
  onEvent: () => {
    console.log('home pressed');
  },
});

// Call unsubscribe() when you no longer need the listener.
