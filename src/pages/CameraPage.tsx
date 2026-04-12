import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { openCamera, fetchAlbumPhotos } from '@apps-in-toss/web-framework';

export function CameraPage() {
  return (
    <div>
      <PageHeader title="Camera & Photos" />
      <div className="p-4 space-y-3">
        <ApiCard name="openCamera" description="카메라 열기" execute={async () => await openCamera()} />
        <ApiCard
          name="fetchAlbumPhotos"
          description="앨범 사진 가져오기"
          params={[{ name: 'maxCount', label: 'Max Count', type: 'number', defaultValue: '5', parse: (v) => Number(v) }]}
          execute={async (p) => await fetchAlbumPhotos({ maxCount: p.maxCount as number })}
        />
      </div>
    </div>
  );
}
