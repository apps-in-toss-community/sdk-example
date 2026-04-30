// Standard Web API (via @ait-co/polyfill)
navigator.geolocation.getCurrentPosition(
  (pos) => {
    console.log(pos.coords.latitude, pos.coords.longitude);
  },
  (err) => {
    console.error(`GeolocationPositionError code=${err.code}: ${err.message}`);
  },
  { enableHighAccuracy: true },
);
