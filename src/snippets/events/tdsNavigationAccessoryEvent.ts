import { tdsEvent } from '@apps-in-toss/web-framework';

const unsubscribe = tdsEvent.addEventListener('navigationAccessoryEvent', {
  onEvent: (event) => {
    console.log('accessory pressed', event);
  },
});

// Call unsubscribe() when you no longer need the listener.
