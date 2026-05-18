import type { HapticFeedbackType } from '@apps-in-toss/web-framework';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { PageHeader } from '../components/PageHeader';
import { PolyfillNotice } from '../components/PolyfillNotice';
import { PolyfillToggleCard } from '../components/PolyfillToggleCard';
import { t } from '../i18n';
import generateHapticFeedbackSnippet from '../snippets/haptic/generateHapticFeedback.ts?raw';
import navigatorVibrateSnippet from '../snippets/haptic/navigatorVibrate.ts?raw';

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

        <PolyfillToggleCard
          title={t('pages.haptic.hapticVibrate.title')}
          sdk={{
            name: 'generateHapticFeedback',
            description: t('pages.haptic.generateHapticFeedback.description'),
            params: [
              {
                name: 'type',
                label: 'Type',
                type: 'select',
                options: hapticOptions,
                defaultValue: 'success',
                parse: (v) => v as HapticFeedbackType,
              },
            ],
            execute: async (p) => {
              await generateHapticFeedback({ type: p.type });
            },
            snippet: generateHapticFeedbackSnippet,
          }}
          polyfill={{
            name: 'navigator.vibrate',
            description: t('pages.haptic.navigatorVibrate.description'),
            params: [
              {
                name: 'pattern',
                label: 'Pattern (ms, 쉼표 구분)',
                placeholder: '200,100,200',
                defaultValue: '200',
              },
            ],
            execute: async (p) => {
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
            },
            snippet: navigatorVibrateSnippet,
          }}
        />
      </div>
    </div>
  );
}
