import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { generateHapticFeedback, saveBase64Data } from '@apps-in-toss/web-framework';
import type { HapticFeedbackType } from '@apps-in-toss/web-framework';

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
        <ApiCard
          name="generateHapticFeedback"
          description="햅틱 피드백 생성"
          params={[{
            name: 'type', label: 'Type', type: 'select',
            options: hapticOptions,
            defaultValue: 'success',
            parse: (v) => v as HapticFeedbackType,
          }]}
          execute={async (p) => { await generateHapticFeedback({ type: p.type }); }}
        />
        <ApiCard
          name="saveBase64Data"
          description="Base64 데이터 저장"
          params={[
            { name: 'data', label: 'Base64 Data', placeholder: 'SGVsbG8=', defaultValue: 'SGVsbG8=' },
            { name: 'fileName', label: 'File Name', placeholder: 'test.txt', defaultValue: 'test.txt' },
            { name: 'mimeType', label: 'MIME Type', placeholder: 'text/plain', defaultValue: 'text/plain' },
          ]}
          execute={async (p) => { await saveBase64Data({ data: p.data, fileName: p.fileName, mimeType: p.mimeType }); }}
        />
      </div>
    </div>
  );
}
