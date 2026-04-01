// Simulated AIS ship data along major shipping routes
const ShipTracker = (() => {
  const SHIP_TYPES = {
    CARGO: { label: 'Cargo', color: '#4488ff' },
    TANKER: { label: 'Tanker', color: '#ff8833' },
    PASSENGER: { label: 'Passenger', color: '#ffffff' },
    CONTAINER: { label: 'Container', color: '#33cc66' }
  };

  // Major shipping routes as waypoint arrays [lat, lng]
  const ROUTES = [
    // Trans-Pacific: Shanghai -> LA
    { name: 'Shanghai - Los Angeles', waypoints: [
      [31.2, 121.5], [30.0, 130.0], [28.0, 140.0], [30.0, 155.0],
      [32.0, 170.0], [33.0, -175.0], [33.5, -160.0], [33.7, -145.0],
      [33.8, -130.0], [33.7, -118.3]
    ]},
    // Trans-Pacific: Tokyo -> Seattle
    { name: 'Tokyo - Seattle', waypoints: [
      [35.6, 139.8], [38.0, 150.0], [42.0, 165.0], [45.0, 180.0],
      [47.0, -170.0], [48.0, -155.0], [48.2, -140.0], [47.8, -130.0],
      [47.6, -122.4]
    ]},
    // Trans-Atlantic: Rotterdam -> New York
    { name: 'Rotterdam - New York', waypoints: [
      [51.9, 4.5], [51.0, 0.0], [50.5, -5.0], [50.0, -15.0],
      [48.0, -25.0], [45.0, -40.0], [42.0, -55.0], [40.7, -65.0],
      [40.6, -74.0]
    ]},
    // Trans-Atlantic: Hamburg -> Houston
    { name: 'Hamburg - Houston', waypoints: [
      [53.5, 9.9], [52.0, 3.0], [50.5, -5.0], [48.0, -15.0],
      [42.0, -30.0], [35.0, -45.0], [30.0, -60.0], [27.0, -75.0],
      [26.0, -85.0], [29.7, -95.0]
    ]},
    // Suez route: Singapore -> Rotterdam via Suez
    { name: 'Singapore - Rotterdam (Suez)', waypoints: [
      [1.3, 103.8], [4.0, 98.0], [7.0, 80.0], [12.0, 60.0],
      [12.5, 45.0], [13.0, 43.3], [27.0, 34.0], [30.0, 32.5],
      [31.3, 32.3], [35.0, 25.0], [37.0, 15.0], [36.5, 5.0],
      [36.0, -5.7], [43.0, -9.0], [48.0, -5.0], [51.0, 1.0],
      [51.9, 4.5]
    ]},
    // Panama route: Shanghai -> New York via Panama
    { name: 'Shanghai - New York (Panama)', waypoints: [
      [31.2, 121.5], [28.0, 130.0], [25.0, 145.0], [20.0, 160.0],
      [15.0, 175.0], [10.0, -170.0], [8.0, -150.0], [8.0, -130.0],
      [8.0, -110.0], [9.0, -79.9], [9.2, -79.5], [12.0, -75.0],
      [20.0, -72.0], [30.0, -75.0], [38.0, -74.0], [40.6, -74.0]
    ]}
  ];

  let ships = [];
  let startTime = Date.now();

  function interpolateRoute(waypoints, t) {
    // t is 0..1 position along route
    t = ((t % 1) + 1) % 1; // wrap around
    const totalSegments = waypoints.length - 1;
    const segFloat = t * totalSegments;
    const segIndex = Math.min(Math.floor(segFloat), totalSegments - 1);
    const segT = segFloat - segIndex;

    const p1 = waypoints[segIndex];
    const p2 = waypoints[segIndex + 1];

    return {
      lat: p1[0] + (p2[0] - p1[0]) * segT,
      lng: p1[1] + (p2[1] - p1[1]) * segT
    };
  }

  function generateShips() {
    ships = [];
    const types = Object.keys(SHIP_TYPES);
    let id = 0;

    ROUTES.forEach((route, ri) => {
      // 5 ships per route
      for (let i = 0; i < 5; i++) {
        const typeKey = types[id % types.length];
        const speed = 0.00002 + Math.random() * 0.00003; // varying speeds
        const offset = i / 5 + Math.random() * 0.05; // spread along route

        ships.push({
          id: id++,
          name: `${SHIP_TYPES[typeKey].label.toUpperCase()}-${String(id).padStart(3, '0')}`,
          type: typeKey,
          color: SHIP_TYPES[typeKey].color,
          label: SHIP_TYPES[typeKey].label,
          route: route,
          routeIndex: ri,
          speed: speed,
          offset: offset,
          direction: i % 2 === 0 ? 1 : -1 // some go reverse
        });
      }
    });

    console.log(`[Ships] Generated ${ships.length} simulated ships`);
    return ships;
  }

  function getShipPositions() {
    const elapsed = (Date.now() - startTime) / 1000;

    return ships.map(ship => {
      const t = ship.offset + ship.speed * elapsed * ship.direction;
      const waypoints = ship.direction > 0
        ? ship.route.waypoints
        : [...ship.route.waypoints].reverse();
      const pos = interpolateRoute(waypoints, t);

      return {
        id: ship.id,
        name: ship.name,
        type: ship.type,
        color: ship.color,
        label: ship.label,
        routeName: ship.route.name,
        lat: pos.lat,
        lng: pos.lng
      };
    });
  }

  // Initialize ships
  generateShips();

  return {
    getPositions: getShipPositions,
    getShips: () => ships,
    SHIP_TYPES
  };
})();
