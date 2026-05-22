import { fetchAlbumItems, fetchAlbumPhotos, openCamera } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { t } from '../i18n';
import fetchAlbumItemsSnippet from '../snippets/camera/fetchAlbumItems.ts?raw';
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
        <ApiCard
          name="fetchAlbumItems"
          description={t('pages.camera.fetchAlbumItems.description')}
          params={[
            {
              name: 'maxCount',
              label: 'Max Count',
              type: 'number',
              defaultValue: '5',
              parse: (v) => Number(v),
            },
            {
              name: 'types',
              label: 'Types (PHOTO,VIDEO)',
              defaultValue: 'PHOTO,VIDEO',
              parse: (v) =>
                v
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean) as ('PHOTO' | 'VIDEO')[],
            },
          ]}
          execute={(p) => fetchAlbumItems({ maxCount: p.maxCount, types: p.types })}
          snippet={fetchAlbumItemsSnippet}
        />
      </div>
    </div>
  );
}
