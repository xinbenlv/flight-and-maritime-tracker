const express = require('express');
const path = require('path');

const app = express();
const PORT = 3004;

// Cache for OpenSky API responses
let flightCache = null;
let flightCacheTime = 0;
const CACHE_TTL = 8000; // 8 seconds

// Serve static files
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for OpenSky Network API
app.get('/api/flights', async (req, res) => {
  const now = Date.now();

  // Return cached data if still fresh
  if (flightCache && (now - flightCacheTime) < CACHE_TTL) {
    console.log('[API] Returning cached flight data');
    return res.json(flightCache);
  }

  try {
    console.log('[API] Fetching fresh data from OpenSky Network...');
    const response = await fetch('https://opensky-network.org/api/states/all');

    if (!response.ok) {
      throw new Error(`OpenSky API returned ${response.status}`);
    }

    const data = await response.json();
    flightCache = data;
    flightCacheTime = now;
    console.log(`[API] Cached ${data.states ? data.states.length : 0} flights`);
    res.json(data);
  } catch (err) {
    console.error('[API] Error fetching from OpenSky:', err.message);

    // Return stale cache if available
    if (flightCache) {
      console.log('[API] Returning stale cached data');
      return res.json(flightCache);
    }

    res.status(502).json({ error: 'Failed to fetch flight data', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Flight & Maritime Tracker running at http://localhost:${PORT}`);
});
