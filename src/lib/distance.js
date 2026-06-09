// Driving (road) distance estimate using free OpenStreetMap services.
//
// The old estimate was a straight-line Haversine between district centers, which
// badly underestimated the real trip (e.g. 22 km vs 39 km on navigation). Here we
// geocode the selected mahalle/ilçe (Nominatim) and ask OSRM for the actual road
// distance. Falls back to the district center when a mahalle can't be geocoded.
// Geocode results are cached so repeat lookups don't re-hit the network.
//
// Note: Nominatim/OSRM public servers are fine for light use; for heavy
// production traffic a keyed provider (OpenRouteService, Mapbox, Google) is better.

const geoCache = new Map();
const UA = 'KuryeTakip/1.0 (kurye yonetim)';

async function geocode(query) {
  if (geoCache.has(query)) return geoCache.get(query);
  let result = null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tr&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'tr' } });
    const data = await res.json();
    if (Array.isArray(data) && data[0]) result = { lat: +data[0].lat, lon: +data[0].lon };
  } catch (e) {
    // network/parse failure -> leave result null (caller falls back)
  }
  geoCache.set(query, result);
  return result;
}

// p: { province, district, mahalle }
async function endpointCoords(p) {
  const province = p.province || 'İstanbul';
  if (p.mahalle) {
    const g = await geocode(`${p.mahalle} Mahallesi, ${p.district}, ${province}`);
    if (g) return g;
  }
  return geocode(`${p.district}, ${province}`);
}

// Returns the road distance in km, or null if it couldn't be computed.
export async function drivingDistanceKm(pickup, delivery) {
  try {
    const [a, b] = await Promise.all([endpointCoords(pickup), endpointCoords(delivery)]);
    if (!a || !b) return null;
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    const meters = data?.routes?.[0]?.distance;
    return meters != null ? meters / 1000 : null;
  } catch (e) {
    return null;
  }
}
