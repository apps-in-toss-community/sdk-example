import type { StartUpdateLocationEventParams } from '@apps-in-toss/web-framework';
import { Accuracy, getCurrentLocation, startUpdateLocation } from '@apps-in-toss/web-framework';
import { useEffect, useRef } from 'react';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { PolyfillNotice } from '../components/PolyfillNotice';
import { t } from '../i18n';
import { docsLink } from '../lib/docs';
import getCurrentLocationSnippet from '../snippets/location/getCurrentLocation.ts?raw';
import getCurrentPositionSnippet from '../snippets/location/getCurrentPosition.ts?raw';
import startUpdateLocationSnippet from '../snippets/location/startUpdateLocation.ts?raw';
import watchPositionSnippet from '../snippets/location/watchPosition.ts?raw';
// 순수 모듈에서 import + re-export — aitCapture.ts가 ?raw/React 그래프를 타지 않도록 분리됨.
import { isLocationNativeError } from '../test/isNativeError';

export { isLocationNativeError };

function pickStandardCoords(pos: GeolocationPosition) {
  return {
    coords: {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
    },
    timestamp: pos.timestamp,
  };
}

export function LocationPage() {
  // Holds the unsubscribe handle from the most recent startUpdateLocation call.
  // Calling before re-subscribing prevents orphaned watchers; the useEffect
  // cleanup tears it down if the component unmounts mid-watch.
  const stopLocationRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      stopLocationRef.current?.();
    };
  }, []);

  return (
    <div>
      <PageHeader title="Location" />
      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
        <PolyfillNotice webApis="navigator.geolocation.getCurrentPosition / watchPosition / clearWatch" />

        <ApiCard
          name="getCurrentLocation"
          description={t('pages.location.getCurrentLocation.description')}
          params={[]}
          execute={async () => {
            try {
              return await getCurrentLocation({ accuracy: Accuracy.Highest });
            } catch (err) {
              // OS-level permission failure (e.g. iOS CoreLocation denied while
              // mini-app-level grant is "allowed") surfaces as an untyped native
              // string like "MiniApp.LocationError 오류 1". Catch it here,
              // fire openPermissionDialog() as a best-effort recovery path, and
              // rethrow with a user-friendly message.
              if (isLocationNativeError(err)) {
                // Fire-and-forget — dialog may not appear in all cases, but
                // calling it prompts OS re-authorization when available.
                getCurrentLocation.openPermissionDialog().catch(() => {});
                throw new Error(t('pages.location.getCurrentLocation.permissionHelp'));
              }
              throw err;
            }
          }}
          snippet={getCurrentLocationSnippet}
          docsUrl={docsLink('location', 'getCurrentLocation')}
        />
        <ApiCard
          name="getCurrentLocation.getPermission"
          description={t('pages.location.checkLocationPermission.description')}
          params={[]}
          execute={() => getCurrentLocation.getPermission()}
          docsUrl={docsLink('location', 'getCurrentLocation')}
        />
        <ApiCard
          name="startUpdateLocation"
          description={t('pages.location.startUpdateLocation.description')}
          params={[]}
          execute={async () => {
            // Tear down any previous watch before starting a new one.
            stopLocationRef.current?.();
            stopLocationRef.current = null;
            return new Promise<unknown>((resolve, reject) => {
              const params: StartUpdateLocationEventParams = {
                options: { accuracy: Accuracy.Highest, timeInterval: 1000, distanceInterval: 0 },
                onEvent: (location) => resolve(location),
                onError: (err) => reject(err),
              };
              stopLocationRef.current = startUpdateLocation(params);
            });
          }}
          snippet={startUpdateLocationSnippet}
          docsUrl={docsLink('location', 'startUpdateLocation')}
        />

        <ApiCard
          name="navigator.geolocation.getCurrentPosition"
          description={t('pages.location.navigatorGetCurrentPosition.description')}
          params={[]}
          execute={async () => {
            return new Promise<unknown>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pickStandardCoords(pos)),
                (err) =>
                  reject(new Error(`GeolocationPositionError code=${err.code}: ${err.message}`)),
                { enableHighAccuracy: true },
              );
            });
          }}
          snippet={getCurrentPositionSnippet}
        />
        <ApiCard
          name="navigator.geolocation.watchPosition"
          description={t('pages.location.navigatorWatchPosition.description')}
          params={[]}
          execute={async () => {
            return new Promise<unknown>((resolve, reject) => {
              const id = navigator.geolocation.watchPosition(
                (pos) => {
                  navigator.geolocation.clearWatch(id);
                  resolve(pickStandardCoords(pos));
                },
                (err) => {
                  navigator.geolocation.clearWatch(id);
                  reject(new Error(`GeolocationPositionError code=${err.code}: ${err.message}`));
                },
                { enableHighAccuracy: true },
              );
            });
          }}
          snippet={watchPositionSnippet}
        />
      </div>
    </div>
  );
}
