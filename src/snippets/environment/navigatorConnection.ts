// Standard Web API (via @ait-co/polyfill) — NetworkInformation snapshot
const c = navigator.connection;
const snapshot = c
  ? {
      available: true,
      type: c.type,
      effectiveType: c.effectiveType,
      downlink: c.downlink,
      rtt: c.rtt,
      saveData: c.saveData,
    }
  : { available: false };
