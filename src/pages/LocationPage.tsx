import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { getCurrentLocation, startUpdateLocation } from '@apps-in-toss/web-framework';

export function LocationPage() {
  return (
    <div>
      <PageHeader title="Location" />
      <div className="p-4 space-y-3">
        <ApiCard name="getCurrentLocation" description="현재 위치 조회" execute={async () => await (getCurrentLocation as any)()} />
        <ApiCard
          name="startUpdateLocation"
          description="위치 업데이트 시작"
          execute={async () => {
            return new Promise((resolve, reject) => {
              (startUpdateLocation as any)({
                options: { accuracy: 'best', timeInterval: 1000, distanceInterval: 0 },
                onEvent: (location: unknown) => resolve(location),
                onError: (err: unknown) => reject(err),
              });
            });
          }}
        />
      </div>
    </div>
  );
}
