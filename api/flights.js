// Vercel serverless function - proxy for OpenSky Network API
let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 10000; // 10 seconds

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=60');

  const now = Date.now();

  // Return cached data if fresh
  if (cachedData && (now - cacheTime) < CACHE_TTL) {
    return res.status(200).json(cachedData);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://opensky-network.org/api/states/all', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FlightTracker/1.0 (educational project)',
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[API] OpenSky returned ${response.status}`);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
      // Return a minimal response for the frontend to handle
      return res.status(200).json({ time: Math.floor(now/1000), states: [], error: `OpenSky API returned ${response.status}` });
    }

    const data = await response.json();
    cachedData = data;
    cacheTime = now;

    return res.status(200).json(data);
  } catch (err) {
    console.error('[API] OpenSky fetch error:', err.message);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Return empty states so the frontend doesn't crash
    return res.status(200).json({ time: Math.floor(now/1000), states: [], error: err.message });
  }
}
