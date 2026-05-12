import { fetchAlbumPhotos, openCamera } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import fetchAlbumPhotosSnippet from '../snippets/camera/fetchAlbumPhotos.ts?raw';
import openCameraSnippet from '../snippets/camera/openCamera.ts?raw';

export function CameraPage() {
  return (
    <div>
      <PageHeader title="Camera & Photos" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="openCamera"
          description={t('pages.camera.openCamera.description')}
          params={[]}
          execute={() => openCamera()}
          snippet={openCameraSnippet}
        />
        <ApiCard
          name="fetchAlbumPhotos"
          description={t('pages.camera.fetchAlbumPhotos.description')}
          params={[
            {
              name: 'maxCount',
              label: 'Max Count',
              type: 'number',
              defaultValue: '5',
              parse: (v) => Number(v),
            },
          ]}
          execute={(p) => fetchAlbumPhotos({ maxCount: p.maxCount })}
          snippet={fetchAlbumPhotosSnippet}
        />
      </div>
    </div>
  );
}
