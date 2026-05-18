import { partner } from '@apps-in-toss/web-framework';

// TDS 모노크롬 아이콘 이름 (예: 'icon-heart-mono'). 임의 문자열은 매칭되지 않아 빈 아이콘이 표시돼요.
await partner.addAccessoryButton({
  id,
  title,
  icon: { name: iconName },
});
