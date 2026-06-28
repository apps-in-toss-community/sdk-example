import { SafeAreaInsets } from '@apps-in-toss/web-framework';

// SafeAreaInsets.get()은 { top, bottom, left, right } 구조 객체를 반환해요.
// (구버전 getSafeAreaInsets()는 단일 number를 반환했으나 deprecated 됐어요.)
const insets = SafeAreaInsets.get();
// insets.top, insets.bottom, insets.left, insets.right
