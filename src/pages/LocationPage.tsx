import type { StartUpdateLocationEventParams } from '@apps-in-toss/web-framework';
import { Accuracy, getCurrentLocation, startUpdateLocation } from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';
import { PolyfillNotice } from '../components/PolyfillNotice';
import getCurrentLocationSnippet from '../snippets/location/getCurrentLocation.ts?raw';
import getCurrentPositionSnippet from '../snippets/location/getCurrentPosition.ts?raw';
import startUpdateLocationSnippet from '../snippets/location/startUpdateLocation.ts?raw';
import watchPositionSnippet from '../snippets/location/watchPosition.ts?raw';

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
  return (
    <div>
      <PageHeader title="Location" />
      <div className="p-4 space-y-3">
        <PolyfillNotice webApis="navigator.geolocation.getCurrentPosition / watchPosition / clearWatch" />

        <ApiCard
          name="getCurrentLocation"
          description="SDK — 현재 위치 조회"
          params={[]}
          execute={async () => await getCurrentLocation({ accuracy: Accuracy.Highest })}
          snippet={getCurrentLocationSnippet}
        />
        <ApiCard
          name="startUpdateLocation"
          description="SDK — 위치 업데이트 시작"
          params={[]}
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
          snippet={startUpdateLocationSnippet}
        />

        <ApiCard
          name="navigator.geolocation.getCurrentPosition"
          description="표준 Web API (via @ait-co/polyfill)"
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
          description="표준 Web API (via @ait-co/polyfill) — 첫 위치 이벤트 이후 자동 clearWatch"
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
