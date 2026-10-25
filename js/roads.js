// Turns the OpenStreetMap GeoJSON into a road graph.
// A node is a point on a road; a point shared by two roads is a junction.

// Normal speed (km/h) when the road is empty, by OpenStreetMap road type.
const FREE_FLOW = { trunk: 60, primary: 50, secondary: 40, tertiary: 35, unclassified: 30, residential: 25, living_street: 15 };

function build_graph(geojson) {
  const nodes = {}, edges = {}, roads = {};
  for (const f of geojson.features) {
    const id = f.properties["@id"], type = f.properties.highway.replace("_link", "");
    const points = f.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    roads[id] = { name: f.properties.name || "Unnamed road", free_flow: FREE_FLOW[type] || 30, points, km: 0 };
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1].join(), b = points[i].join(), km = distance_km(points[i - 1], points[i]);
      nodes[a] = points[i - 1];
      nodes[b] = points[i];
      // ponytail: every road is two-way; honour OSM "oneway" tags for real driving directions.
      (edges[a] ||= []).push({ to: b, road: id, km });
      (edges[b] ||= []).push({ to: a, road: id, km });
      roads[id].km += km;
    }
  }
  return { nodes, edges, roads, main: main_network(edges) };
}

// Great-circle distance between two [lat, lng] points.
function distance_km([lat1, lng1], [lat2, lng2]) {
  const rad = Math.PI / 180, dlat = (lat2 - lat1) * rad, dlng = (lng2 - lng1) * rad;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dlng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Roads cut by the edge of the area leave small islands. Keep the biggest
// connected piece, so every start and destination can be routed.
function main_network(edges) {
  const seen = new Set();
  let biggest = new Set();
  for (const start in edges) {
    if (seen.has(start)) continue;
    const piece = new Set([start]), todo = [start];
    while (todo.length) {
      for (const e of edges[todo.pop()]) if (!piece.has(e.to)) { piece.add(e.to); todo.push(e.to); }
    }
    piece.forEach(n => seen.add(n));
    if (piece.size > biggest.size) biggest = piece;
  }
  return biggest;
}

// The junction on the main network closest to a clicked point.
function nearest_node(graph, point) {
  let nearest, nearest_km = Infinity;
  for (const id of graph.main) {
    const km = distance_km(graph.nodes[id], point);
    if (km < nearest_km) { nearest_km = km; nearest = id; }
  }
  return nearest;
}

if (typeof module === "object") module.exports = { build_graph, distance_km, nearest_node };
