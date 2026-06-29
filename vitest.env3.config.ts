/**
 * maintainer dog-food 전용 — `.ait_relay/` 시크릿(AIT_SCHEME_URL) 의존이라
 * 일반 미니앱 개발자가 복사해도 동작하지 않는다.
 * 일반 개발·테스트는 `vitest.config.ts`(env1 mock) 또는 `test:env3`(CLI)를 사용한다.
 *
 * 이 파일은 `@ait-co/devtools/test-runner` 배럴을 통해 Vitest pool을 env3 relay로
 * 배선하는 경로를 dog-food로 검증한다. createRelayConnectionFactory는 공개 패키지의
 * 정상 사용이므로 boilerplate 청정성 허용선 안이다.
 *
 * SECRET-HANDLING: AIT_SCHEME_URL은 process.env로만 읽는다. onQrContent는 TTY +
 * 비-CI 환경에서만 stdout에 출력한다 — relay wss/TOTP 코드를 비대화형 stdout에
 * 절대 흘리지 않는다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */

import {
  createRelayConnectionFactory,
  definePhoneVitestConfig,
} from '@ait-co/devtools/test-runner';
import { defineConfig } from 'vitest/config';

const schemeUrl = process.env.AIT_SCHEME_URL;
if (!schemeUrl) {
  throw new Error(
    'AIT_SCHEME_URL 환경 변수가 없습니다. `ait deploy --scheme-only` 출력을 설정하세요.',
  );
}

export default defineConfig({
  test: definePhoneVitestConfig({
    connection: createRelayConnectionFactory({
      schemeUrl,
      projectRoot: process.cwd(),
      cell: {
        sdkLine: process.env.AIT_CELL_SDK_LINE ?? '2.x',
        platform: process.env.AIT_CELL_PLATFORM ?? 'ios',
      },
      onQrContent: (textChunks) => {
        // TTY + 비-CI 환경에서만 출력한다. CI/non-TTY에서 이 콜백을 호출하더라도
        // relay wss/TOTP 페이로드가 stdout에 새지 않도록 엄격하게 가드한다.
        if (process.stdout.isTTY && !process.env.CI) {
          for (const chunk of textChunks) {
            process.stdout.write(`${chunk}\n`);
          }
        }
      },
    }),
    collectCaptures: true,
    include: ['src/**/*.ait.test.ts'],
  }),
});
