import { graniteEvent } from '@apps-in-toss/web-framework';

const unsubscribe = graniteEvent.addEventListener('backEvent', {
  onEvent: () => {
    console.log('back pressed');
  },
});

// Call unsubscribe() when you no longer need the listener.
