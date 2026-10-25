# Mini Maps

A mini Google Maps on a real map of Connaught Place, New Delhi. Add traffic jams, watch the colours change and see the route switch. The code behind each step is one click away.

Companion to the blog post "How Google Maps Knows the Traffic, Your Arrival Time and the Best Route".

> **Traffic here is simulated.** No real traffic data is used, and the page never asks for your location.

## Run it

The page loads `data/area.geojson` with `fetch`, so it needs a local web server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Check the logic (needs Node 18+):

```sh
node test.js
```

## Files

| File | What it does |
|---|---|
| `index.html` | The page: map, controls, "How it works" sections, GPS demo |
| `style.css` | Layout, including the phone layout |
| `js/core.js` | The blog's functions: `trilaterate`, `live_speeds`, `colour`, `predict_speed`, `best_route` |
| `js/roads.js` | Turns the OpenStreetMap file into a road graph |
| `js/traffic.js` | Simulated phone pings, jams and the 99-phone wagon |
| `data/area.geojson` | About 2 km of roads around Connaught Place |
| `test.js` | Six-road example plus a timing check on the real map |

## Publish on GitHub Pages

1. Push this repo to GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Put the Pages URL behind "Try the live demo" in the blog.

## Change the city

1. Open [overpass-turbo.eu](https://overpass-turbo.eu) and run this query, with your own box (south, west, north, east):

   ```
   [out:json][timeout:60];
   way["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street|primary_link|secondary_link|tertiary_link|trunk|trunk_link)$"]
     (28.6225,77.2065,28.6405,77.2269);
   out geom;
   ```

2. Click **Export → GeoJSON** and save it as `data/area.geojson`.
3. In `index.html`, update `AREA` and `LANDMARKS`.

Keep the box about 2 km across, so the page stays fast.

## Map tiles

Tiles come from the OpenStreetMap tile server, which allows light use with credit shown. To switch provider, change the `TILES` line in `index.html`.

## Limits

- Plain Dijkstra on a small area. Real engines use Contraction Hierarchies or multi-level techniques.
- Every road is two-way. One-way tags are ignored.
- Not a navigation app: no directions, address search or tracking.

## Credits

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, under the ODbL. Map library: [Leaflet](https://leafletjs.com).
Code under the MIT licence.
