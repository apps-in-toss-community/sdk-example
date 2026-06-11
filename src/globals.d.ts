type NetworkInformationType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown';

type NetworkInformationEffectiveType = 'slow-2g' | '2g' | '3g' | '4g';

interface NetworkInformationSnapshot {
  type?: NetworkInformationType;
  effectiveType?: NetworkInformationEffectiveType;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface Navigator {
  connection?: NetworkInformationSnapshot;
}

// granite.config.ts 의 webViewProps.type 을 build-time 상수로 박아 client
// 코드가 자기 WebView frame 을 알 수 있게 한다. partner 에선 토스 native
// chrome 이 viewport 밖이라 SafeAreaInsets.top 을 padding 으로 적용하면
// 중복 공간이 생기고, game/external 은 chrome 이 viewport 안 overlay 라
// 그대로 적용해야 한다.
declare const __WEB_VIEW_TYPE__: 'partner' | 'external' | 'game';
