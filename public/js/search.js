// Search functionality for flight callsigns
const SearchModule = (() => {
  let onZoomCallback = null;
  let highlightedCallsign = null;

  const input = document.getElementById('search-input');
  const resultsDiv = document.getElementById('search-results');

  function init(zoomCallback) {
    onZoomCallback = zoomCallback;

    input.addEventListener('input', () => {
      const query = input.value.trim();
      if (query.length < 2) {
        hideResults();
        return;
      }
      showResults(query);
    });

    input.addEventListener('focus', () => {
      const query = input.value.trim();
      if (query.length >= 2) showResults(query);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-container')) {
        hideResults();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideResults();
        input.blur();
      }
    });
  }

  function showResults(query) {
    const matches = FlightTracker.findByCallsign(query);
    resultsDiv.innerHTML = '';

    if (matches.length === 0) {
      resultsDiv.innerHTML = '<div class="search-not-found">No matching flights found</div>';
      resultsDiv.classList.add('active');
      return;
    }

    matches.forEach(flight => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `<span class="callsign">${flight.callsign}</span><span class="origin">${flight.origin}</span>`;
      item.addEventListener('click', () => {
        selectFlight(flight);
      });
      resultsDiv.appendChild(item);
    });

    resultsDiv.classList.add('active');
  }

  function selectFlight(flight) {
    highlightedCallsign = flight.callsign;
    input.value = flight.callsign;
    hideResults();

    if (onZoomCallback) {
      onZoomCallback(flight.lat, flight.lng, flight.callsign);
    }

    console.log(`[Search] Selected flight: ${flight.callsign} at ${flight.lat}, ${flight.lng}`);
  }

  function hideResults() {
    resultsDiv.classList.remove('active');
  }

  function getHighlighted() {
    return highlightedCallsign;
  }

  function clearHighlight() {
    highlightedCallsign = null;
  }

  return { init, getHighlighted, clearHighlight };
})();
