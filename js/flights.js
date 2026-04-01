// OpenSky Network flight data integration
const FlightTracker = (() => {
  let allFlights = [];
  let displayFlights = [];
  let maxFlights = 50;
  let refreshInterval = 10000;
  let refreshTimer = null;
  let isLive = false;
  let onUpdateCallback = null;

  // OpenSky state vector indices
  const IDX = {
    ICAO24: 0,
    CALLSIGN: 1,
    ORIGIN_COUNTRY: 2,
    TIME_POSITION: 3,
    LAST_CONTACT: 4,
    LONGITUDE: 5,
    LATITUDE: 6,
    BARO_ALTITUDE: 7,
    ON_GROUND: 8,
    VELOCITY: 9,
    TRUE_TRACK: 10,
    VERTICAL_RATE: 11,
    SENSORS: 12,
    GEO_ALTITUDE: 13,
    SQUAWK: 14,
    SPI: 15,
    POSITION_SOURCE: 16
  };

  function altitudeToColor(altMeters) {
    if (altMeters == null || altMeters <= 0) return '#33cc66'; // ground/low = green
    if (altMeters < 3000) return '#33cc66';  // green
    if (altMeters < 8000) return '#ffcc00';  // yellow
    return '#ff4444';                         // red/high
  }

  async function fetchFlights() {
    try {
      console.log('[Flights] Fetching flight data...');
      const response = await fetch('/api/flights');

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (!data.states || !Array.isArray(data.states)) {
        throw new Error('Invalid data format');
      }

      // Filter to flights with valid position and not on ground
      allFlights = data.states.filter(s =>
        s[IDX.LATITUDE] != null &&
        s[IDX.LONGITUDE] != null &&
        !s[IDX.ON_GROUND]
      );

      console.log(`[Flights] Got ${allFlights.length} airborne flights`);
      isLive = true;
      updateDisplayFlights();
      return true;
    } catch (err) {
      console.error('[Flights] Fetch error:', err.message);
      isLive = false;
      if (onUpdateCallback) onUpdateCallback();
      return false;
    }
  }

  function updateDisplayFlights() {
    // Pick random subset up to maxFlights
    if (allFlights.length <= maxFlights) {
      displayFlights = allFlights.slice();
    } else {
      const shuffled = allFlights.slice().sort(() => Math.random() - 0.5);
      displayFlights = shuffled.slice(0, maxFlights);
    }

    if (onUpdateCallback) onUpdateCallback();
  }

  function getDisplayData() {
    return displayFlights.map(s => {
      const alt = s[IDX.BARO_ALTITUDE] || s[IDX.GEO_ALTITUDE] || 0;
      const callsign = (s[IDX.CALLSIGN] || '').trim();
      return {
        icao24: s[IDX.ICAO24],
        callsign: callsign,
        origin: s[IDX.ORIGIN_COUNTRY],
        lat: s[IDX.LATITUDE],
        lng: s[IDX.LONGITUDE],
        altitude: alt,
        velocity: s[IDX.VELOCITY],
        heading: s[IDX.TRUE_TRACK] || 0,
        color: altitudeToColor(alt),
        // Size by altitude for visual depth
        size: 0.3 + (alt / 15000) * 0.5
      };
    });
  }

  function findByCallsign(query) {
    if (!query) return [];
    const q = query.toUpperCase();
    return allFlights
      .filter(s => {
        const cs = (s[IDX.CALLSIGN] || '').trim().toUpperCase();
        return cs.includes(q);
      })
      .map(s => ({
        callsign: (s[IDX.CALLSIGN] || '').trim(),
        origin: s[IDX.ORIGIN_COUNTRY],
        lat: s[IDX.LATITUDE],
        lng: s[IDX.LONGITUDE],
        altitude: s[IDX.BARO_ALTITUDE] || 0
      }))
      .slice(0, 10);
  }

  function setMaxFlights(n) {
    maxFlights = n;
    updateDisplayFlights();
  }

  function setRefreshInterval(ms) {
    refreshInterval = ms;
    startAutoRefresh();
  }

  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(fetchFlights, refreshInterval);
    console.log(`[Flights] Auto-refresh set to ${refreshInterval / 1000}s`);
  }

  function onUpdate(cb) {
    onUpdateCallback = cb;
  }

  // Initial fetch
  fetchFlights().then(() => {
    startAutoRefresh();
  });

  return {
    getDisplayData,
    findByCallsign,
    setMaxFlights,
    setRefreshInterval,
    fetchFlights,
    onUpdate,
    isLive: () => isLive,
    totalCount: () => allFlights.length,
    displayCount: () => displayFlights.length
  };
})();
