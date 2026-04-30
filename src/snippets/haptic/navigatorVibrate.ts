// Standard Web API (via @ait-co/polyfill)
// Pattern is ms; pass a single number, or an array for vibrate/pause sequence.
const parsed = pattern
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => !Number.isNaN(n));

const arg: number | number[] =
  parsed.length === 1 && parsed[0] !== undefined ? parsed[0] : parsed;

const scheduled = navigator.vibrate(arg);
