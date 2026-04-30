import { fetchAlbumPhotos, openCamera } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import fetchAlbumPhotosSnippet from '../snippets/camera/fetchAlbumPhotos.ts?raw';
import openCameraSnippet from '../snippets/camera/openCamera.ts?raw';

export function CameraPage() {
  return (
    <div>
      <PageHeader title="Camera & Photos" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="openCamera"
          description="카메라 열기"
          params={[]}
          execute={async () => await openCamera()}
          snippet={openCameraSnippet}
        />
        <ApiCard
          name="fetchAlbumPhotos"
          description="앨범 사진 가져오기"
          params={[
            {
              name: 'maxCount',
              label: 'Max Count',
              type: 'number',
              defaultValue: '5',
              parse: (v) => Number(v),
            },
          ]}
          execute={async (p) => await fetchAlbumPhotos({ maxCount: p.maxCount })}
          snippet={fetchAlbumPhotosSnippet}
        />
      </div>
    </div>
  );
}
