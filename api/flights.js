// Vercel serverless function - proxy for OpenSky Network API
let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 8000; // 8 seconds

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=8, stale-while-revalidate=30');

  const now = Date.now();

  // Return cached data if fresh
  if (cachedData && (now - cacheTime) < CACHE_TTL) {
    return res.status(200).json(cachedData);
  }

  try {
    const response = await fetch('https://opensky-network.org/api/states/all');

    if (!response.ok) {
      // Return cached data on API failure
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
      throw new Error(`OpenSky API returned ${response.status}`);
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

    return res.status(502).json({ error: 'Failed to fetch flight data', message: err.message });
  }
}
