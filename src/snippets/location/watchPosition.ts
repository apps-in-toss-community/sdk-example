// Standard Web API (via @ait-co/polyfill)
const id = navigator.geolocation.watchPosition(
  (pos) => {
    console.log(pos.coords.latitude, pos.coords.longitude);
    navigator.geolocation.clearWatch(id);
  },
  (err) => {
    console.error(`GeolocationPositionError code=${err.code}: ${err.message}`);
    navigator.geolocation.clearWatch(id);
  },
  { enableHighAccuracy: true },
);
