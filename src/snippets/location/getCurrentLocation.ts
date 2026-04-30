import { Accuracy, getCurrentLocation } from '@apps-in-toss/web-framework';

const location = await getCurrentLocation({ accuracy: Accuracy.Highest });
