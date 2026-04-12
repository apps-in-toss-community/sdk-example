import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { Accuracy, getCurrentLocation, startUpdateLocation } from '@apps-in-toss/web-framework';
import type { StartUpdateLocationEventParams } from '@apps-in-toss/web-framework';

export function LocationPage() {
  return (
    <div>
      <PageHeader title="Location" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="getCurrentLocation"
          description="현재 위치 조회"
          execute={async () => await getCurrentLocation({ accuracy: Accuracy.Highest })}
        />
        <ApiCard
          name="startUpdateLocation"
          description="위치 업데이트 시작"
          execute={async () => {
            return new Promise<unknown>((resolve, reject) => {
              const params: StartUpdateLocationEventParams = {
                options: { accuracy: Accuracy.Highest, timeInterval: 1000, distanceInterval: 0 },
                onEvent: (location) => resolve(location),
                onError: (err) => reject(err),
              };
              startUpdateLocation(params);
            });
          }}
        />
      </div>
    </div>
  );
}
