// Run with: node test.js
// Checks the ported functions on the six-road example, then on the real map data.
const assert = require("assert");
const { trilaterate, live_speeds, colour, predict_speed, best_route } = require("./js/core.js");
const { build_graph, nearest_node } = require("./js/roads.js");
const { usual_speeds, make_pings, wagon_pings } = require("./js/traffic.js");

// GPS: phone at (5, 0) between three satellites.
const [x, y] = trilaterate([0, 0, 5], [10, 0, 5], [5, 10, 10]);
assert(Math.abs(x - 5) < 1e-9 && Math.abs(y) < 1e-9);

// Live speed is the average ping per road.
assert.deepStrictEqual(live_speeds([{ road: "r1", speed: 30 }, { road: "r1", speed: 10 }, { road: "r2", speed: 40 }]), { r1: 20, r2: 40 });

assert.strictEqual(colour(40, 50), "green");
assert.strictEqual(colour(25, 50), "orange");
assert.strictEqual(colour(10, 50), "red");

// A slowdown is fully there now and gone much later.
assert.strictEqual(predict_speed(10, 40, 0, 10), 10);
assert(Math.abs(predict_speed(10, 40, 1000, 10) - 40) < 1e-9);

// Six roads: A-B-D is shortest (2 km), A-C-D is longer (3 km).
const six = { edges: {} };
const road = (id, a, b, km) => {
  (six.edges[a] ||= []).push({ to: b, road: id, km });
  (six.edges[b] ||= []).push({ to: a, road: id, km });
};
road("r1", "A", "B", 1); road("r2", "B", "D", 1); road("r3", "A", "C", 1.5);
road("r4", "C", "D", 1.5); road("r5", "B", "C", 1); road("r6", "D", "E", 0.5);
const path = route => route.edges.map(e => e.road).join(" ");
const by_km = e => e.km;
assert.strictEqual(path(best_route(six, "A", "E", by_km)), "r1 r2 r6");
assert.strictEqual(best_route(six, "A", "E", by_km).cost, 2.5);
const speed = { r1: 40, r2: 5, r3: 40, r4: 40, r5: 40, r6: 40 }; // jam on r2
const minutes = e => e.km / speed[e.road] * 60;
assert.strictEqual(path(best_route(six, "A", "E", minutes)), "r3 r4 r6");
assert.strictEqual(best_route(six, "A", "Z", by_km), null);
assert.strictEqual(best_route(six, "A", "A", by_km).cost, 0);

// Real map: every pick routes, and a route update stays under 0.1 s.
const graph = build_graph(JSON.parse(require("fs").readFileSync("data/area.geojson", "utf8")));
const usual = usual_speeds(graph.roads);
const live = live_speeds(make_pings(graph.roads, usual));
const a = nearest_node(graph, [28.6264, 77.2091]), b = nearest_node(graph, [28.6262, 77.225]);
const started = performance.now();
const shortest = best_route(graph, a, b, by_km);
const fastest = best_route(graph, a, b, (e, t) => e.km / predict_speed(live[e.road], usual[e.road], t, 10) * 60);
const ms = performance.now() - started;
assert(shortest && fastest && shortest.cost > 0.5 && shortest.cost < 5, "route across the area");
assert(ms < 100, `routes took ${ms} ms`);

// The wagon turns its road red.
const r = shortest.edges[0].road;
const with_wagon = live_speeds([...make_pings({ [r]: graph.roads[r] }, usual), ...wagon_pings(r)]);
assert.strictEqual(colour(with_wagon[r], graph.roads[r].free_flow), "red");

console.log(`ok · ${graph.main.size} junctions · shortest ${shortest.cost.toFixed(2)} km · both routes in ${ms.toFixed(1)} ms`);
