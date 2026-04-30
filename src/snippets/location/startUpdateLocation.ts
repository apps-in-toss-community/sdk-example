import { Accuracy, startUpdateLocation } from '@apps-in-toss/web-framework';

startUpdateLocation({
  options: {
    accuracy: Accuracy.Highest,
    timeInterval: 1000,
    distanceInterval: 0,
  },
  onEvent: (location) => {
    console.log(location);
  },
  onError: (err) => {
    console.error(err);
  },
});
