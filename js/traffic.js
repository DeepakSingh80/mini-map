// Simulated phone pings. Nothing here is real traffic.

// The usual speed of each road at this hour: most roads flow freely, a few are always slow.
function usual_speeds(roads) {
  const usual = {};
  for (const id in roads) usual[id] = roads[id].free_flow * (1 - 0.7 * Math.random() ** 2);
  return usual;
}

// Three phones on every road, each reporting a speed near the usual one.
function make_pings(roads, usual) {
  const pings = [];
  for (const road in roads) {
    for (let i = 0; i < 3; i++) pings.push({ road, speed: usual[road] * (0.85 + 0.3 * Math.random()) });
  }
  return pings;
}

// A jam: the phones on this road crawl at 3 to 8 km/h.
function jam_pings(road) {
  return Array.from({ length: 5 }, () => ({ road, speed: 3 + 5 * Math.random() }));
}

// The 99-phone wagon: 99 phones in a handcart, pulled at walking pace.
function wagon_pings(road) {
  return Array.from({ length: 99 }, () => ({ road, speed: 4 }));
}

if (typeof module === "object") module.exports = { usual_speeds, make_pings, jam_pings, wagon_pings };
