import { getOperationalEnvironment } from '@apps-in-toss/web-framework';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import { DemoBanner } from './DemoBanner';

// getOperationalEnvironment()는 상류 타입상 동기 string 반환이지만 실기기 런타임은
// Promise를 반환한다(devtools#795/#796, env3 실측). mockResolvedValue로 그 발산을
// 재현해 await 도입 전 동기 비교(`Promise === 'toss'`)로는 배너가 절대 숨지 않던
// 회귀를 여기서 잡는다.
vi.mock('@apps-in-toss/web-framework', () => ({
  getOperationalEnvironment: vi.fn(),
}));

// APP_IN_TOSS_URL이 채워진 뒤에도 QRCode.toDataURL이 effect를 에러 없이 통과하도록
// 더미 data URL로 고정한다.
vi.mock('qrcode', () => {
  const toDataURL = vi.fn().mockResolvedValue('data:image/png;base64,dummy');
  return { default: { toDataURL }, toDataURL };
});

const mockedGetOperationalEnvironment = vi.mocked(getOperationalEnvironment);

describe('DemoBanner — toss 환경에서만 숨는다', () => {
  beforeEach(() => {
    mockedGetOperationalEnvironment.mockReset();
  });

  it("getOperationalEnvironment 가 'toss' 아닌 값으로 resolve 되면 배너가 렌더된다", async () => {
    mockedGetOperationalEnvironment.mockResolvedValue('sandbox');

    render(<DemoBanner />);

    await waitFor(() => {
      expect(screen.getByLabelText(t('demoBanner.ariaLabel'))).toBeInTheDocument();
    });
  });

  it("getOperationalEnvironment 가 'toss' 로 resolve 되면 아무것도 렌더하지 않는다 (옛 동기 비교로는 항상 false 라 숨지 않던 회귀)", async () => {
    mockedGetOperationalEnvironment.mockResolvedValue('toss');

    const { container } = render(<DemoBanner />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
    expect(screen.queryByLabelText(t('demoBanner.ariaLabel'))).not.toBeInTheDocument();
  });
});
