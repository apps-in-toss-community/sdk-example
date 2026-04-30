import { contactsViral } from '@apps-in-toss/web-framework';

contactsViral({
  options: { moduleId },
  onEvent: (event) => {
    console.log('contacts viral event', event);
  },
  onError: (err) => {
    console.error(err);
  },
});
