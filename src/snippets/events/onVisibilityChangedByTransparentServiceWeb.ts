import { onVisibilityChangedByTransparentServiceWeb } from '@apps-in-toss/web-framework';

const unsubscribe = onVisibilityChangedByTransparentServiceWeb({
  options: { callbackId: 'my-callback-id' },
  onEvent: (isVisible) => {
    console.log('visibility', isVisible);
  },
  onError: (err) => {
    console.error(err);
  },
});

// Call unsubscribe() when you no longer need the listener.
