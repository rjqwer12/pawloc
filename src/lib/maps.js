const searches = new Map();
let queue = Promise.resolve();
let lastRequest = 0;

// Cache and serialize lookups, including React's development remounts.
export function findShelter(shelter) {
  const query = `${shelter.name}, ${shelter.landmark}`;
  if (searches.has(query)) return searches.get(query);
  const task = queue.then(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 1100 - (Date.now() - lastRequest))));
    lastRequest = Date.now();
    const params = new URLSearchParams({ q: query, format: 'jsonv2', countrycodes: 'ph', limit: '1' });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Shelter lookup is unavailable. You can choose the destination on the map.');
    const results = await response.json();
    const result = results[0];
    if (!result || !['amenity', 'building'].includes(result.category)) return null;
    const point = [Number(result.lat), Number(result.lon)];
    return point.every(Number.isFinite) ? point : null;
  });
  searches.set(query, task);
  queue = task.catch(() => {});
  task.catch(() => searches.delete(query));
  return task;
}

export async function drivingRoute(start, end, signal) {
  const points = `${start[1]},${start[0]};${end[1]},${end[0]}`;
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson`, { signal });
  if (!response.ok) throw new Error('Routing is unavailable. Please try again.');
  const result = await response.json();
  if (result.code !== 'Ok' || !result.routes?.[0]) throw new Error('No driving route was found between these points.');
  return result.routes[0];
}
