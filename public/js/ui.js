// UI control panel logic
const UIModule = (() => {
  const toggleFlights = document.getElementById('toggle-flights');
  const toggleShips = document.getElementById('toggle-ships');
  const flightCount = document.getElementById('flight-count');
  const flightCountLabel = document.getElementById('flight-count-label');
  const refreshInterval = document.getElementById('refresh-interval');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const statsText = document.getElementById('stats-text');
  const panelToggle = document.getElementById('panel-toggle');
  const panelContent = document.getElementById('panel-content');

  let showFlights = true;
  let showShips = true;
  let onChangeCallback = null;

  function init(changeCallback) {
    onChangeCallback = changeCallback;

    toggleFlights.addEventListener('change', () => {
      showFlights = toggleFlights.checked;
      notifyChange();
    });

    toggleShips.addEventListener('change', () => {
      showShips = toggleShips.checked;
      notifyChange();
    });

    flightCount.addEventListener('input', () => {
      flightCountLabel.textContent = flightCount.value;
      FlightTracker.setMaxFlights(parseInt(flightCount.value));
    });

    refreshInterval.addEventListener('change', () => {
      FlightTracker.setRefreshInterval(parseInt(refreshInterval.value));
    });

    // Mobile menu toggle
    panelToggle.addEventListener('click', () => {
      panelContent.classList.toggle('open');
    });
  }

  function notifyChange() {
    if (onChangeCallback) onChangeCallback();
  }

  function updateStatus(live, flightCount, shipCount) {
    if (live) {
      statusIndicator.className = 'status-live';
      statusText.textContent = 'Live';
    } else {
      statusIndicator.className = 'status-stale';
      statusText.textContent = 'Stale';
    }

    statsText.textContent = `Tracking ${flightCount} flights, ${shipCount} ships`;
  }

  return {
    init,
    updateStatus,
    getShowFlights: () => showFlights,
    getShowShips: () => showShips
  };
})();
