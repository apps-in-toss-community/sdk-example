import type { HapticFeedbackType } from '@apps-in-toss/web-framework';
import { generateHapticFeedback, saveBase64Data } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { PolyfillNotice } from '../components/PolyfillNotice';
import generateHapticFeedbackSnippet from '../snippets/haptic/generateHapticFeedback.ts?raw';
import navigatorVibrateSnippet from '../snippets/haptic/navigatorVibrate.ts?raw';
import saveBase64DataSnippet from '../snippets/haptic/saveBase64Data.ts?raw';

const hapticOptions: { label: string; value: HapticFeedbackType }[] = [
  { label: 'tickWeak', value: 'tickWeak' },
  { label: 'tickMedium', value: 'tickMedium' },
  { label: 'softMedium', value: 'softMedium' },
  { label: 'basicWeak', value: 'basicWeak' },
  { label: 'basicMedium', value: 'basicMedium' },
  { label: 'tap', value: 'tap' },
  { label: 'success', value: 'success' },
  { label: 'error', value: 'error' },
  { label: 'wiggle', value: 'wiggle' },
  { label: 'confetti', value: 'confetti' },
];

export function HapticPage() {
  return (
    <div>
      <PageHeader title="Haptic" />
      <div className="p-4 space-y-3">
        <PolyfillNotice webApis="navigator.vibrate" />

        <ApiCard
          name="generateHapticFeedback"
          description="SDK — 햅틱 피드백 생성"
          params={[
            {
              name: 'type',
              label: 'Type',
              type: 'select',
              options: hapticOptions,
              defaultValue: 'success',
              parse: (v) => v as HapticFeedbackType,
            },
          ]}
          execute={async (p) => {
            await generateHapticFeedback({ type: p.type });
          }}
          snippet={generateHapticFeedbackSnippet}
        />
        <ApiCard
          name="saveBase64Data"
          description="SDK — Base64 데이터 저장"
          params={[
            {
              name: 'data',
              label: 'Base64 Data',
              placeholder: 'SGVsbG8=',
              defaultValue: 'SGVsbG8=',
            },
            {
              name: 'fileName',
              label: 'File Name',
              placeholder: 'test.txt',
              defaultValue: 'test.txt',
            },
            {
              name: 'mimeType',
              label: 'MIME Type',
              placeholder: 'text/plain',
              defaultValue: 'text/plain',
            },
          ]}
          execute={async (p) => {
            await saveBase64Data({ data: p.data, fileName: p.fileName, mimeType: p.mimeType });
          }}
          snippet={saveBase64DataSnippet}
        />

        <ApiCard
          name="navigator.vibrate"
          description="표준 Web API (via @ait-co/polyfill) — ms 단위 pattern. 쉼표로 구분하면 vibrate/pause 시퀀스."
          params={[
            {
              name: 'pattern',
              label: 'Pattern (ms, 쉼표 구분)',
              placeholder: '200,100,200',
              defaultValue: '200',
            },
          ]}
          execute={async (p) => {
            const parsed = p.pattern
              .split(',')
              .map((s) => Number(s.trim()))
              .filter((n) => !Number.isNaN(n));
            if (parsed.length === 0) {
              throw new Error('pattern에 숫자를 하나 이상 입력하세요. 예: 200 또는 200,100,200');
            }
            const first = parsed[0];
            const arg: number | number[] =
              parsed.length === 1 && first !== undefined ? first : parsed;
            return { scheduled: navigator.vibrate(arg), pattern: arg };
          }}
          snippet={navigatorVibrateSnippet}
        />
      </div>
    </div>
  );
}
