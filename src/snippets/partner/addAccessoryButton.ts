import { partner } from '@apps-in-toss/web-framework';

// TDS monochrome icon name (예: 'icon-heart-mono'). 일반 ASCII 이름은 매칭되지 않아 빈 아이콘으로 나타나요.
await partner.addAccessoryButton({
  id,
  title,
  icon: { name: iconName },
});
