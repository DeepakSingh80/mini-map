// The blog's functions, ported from its Python mini project.
// No map code here: index.html shows the source of each one under "How it works".

// Step 1: GPS. Each satellite gives a distance, so the phone sits on a circle around it.
// Subtracting the circle equations leaves two straight lines; solve them.
function trilaterate([x1, y1, r1], [x2, y2, r2], [x3, y3, r3]) {
  const a = 2 * (x2 - x1), b = 2 * (y2 - y1), c = r1 * r1 - r2 * r2 - x1 * x1 + x2 * x2 - y1 * y1 + y2 * y2;
  const d = 2 * (x3 - x2), e = 2 * (y3 - y2), f = r2 * r2 - r3 * r3 - x2 * x2 + x3 * x3 - y2 * y2 + y3 * y3;
  const det = a * e - b * d; // 0 when the three satellites sit on one line
  return [(c * e - b * f) / det, (a * f - c * d) / det];
}

// Step 3: average the speed pings from all phones on each road.
function live_speeds(pings) {
  const total = {}, count = {};
  for (const { road, speed } of pings) {
    total[road] = (total[road] || 0) + speed;
    count[road] = (count[road] || 0) + 1;
  }
  const speeds = {};
  for (const road in total) speeds[road] = total[road] / count[road];
  return speeds;
}

// Step 4: compare the live speed with the road's free-flow speed.
function colour(speed, free_flow) {
  const ratio = speed / free_flow;
  if (ratio >= 0.75) return "green";
  if (ratio >= 0.4) return "orange";
  return "red";
}

// Step 5: today's slowdown fades back to the usual speed as time passes.
// After `fade` minutes, about a third of the slowdown is left.
function predict_speed(live, usual, minutes_ahead, fade) {
  return usual + (live - usual) * Math.exp(-minutes_ahead / fade);
}

// Step 6: Dijkstra. cost(edge, cost_so_far) prices one road piece, so the same
// search finds the shortest route (cost = km) and the fastest (cost = minutes).
function best_route(graph, start, goal, cost) {
  const best = { [start]: 0 }, came_from = {}, done = new Set(), frontier = [start];
  while (frontier.length) {
    // ponytail: linear scan instead of a heap; fine for a few thousand junctions, use a binary heap for a city.
    let i = 0;
    for (let j = 1; j < frontier.length; j++) if (best[frontier[j]] < best[frontier[i]]) i = j;
    const node = frontier.splice(i, 1)[0];
    if (done.has(node)) continue;
    if (node === goal) break;
    done.add(node);
    for (const edge of graph.edges[node] || []) {
      const c = best[node] + cost(edge, best[node]);
      if (best[edge.to] === undefined || c < best[edge.to]) {
        best[edge.to] = c;
        came_from[edge.to] = { node, edge };
        frontier.push(edge.to);
      }
    }
  }
  if (best[goal] === undefined) return null;
  const edges = [];
  for (let n = goal; n !== start; n = came_from[n].node) edges.unshift(came_from[n].edge);
  return { cost: best[goal], edges };
}

if (typeof module === "object") module.exports = { trilaterate, live_speeds, colour, predict_speed, best_route };
