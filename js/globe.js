// Globe initialization and rendering
(function() {
  const container = document.getElementById('globe-container');

  // Create globe
  const globe = Globe()(container)
    .globeImageUrl('')
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true)
    .atmosphereColor('#1a3a5c')
    .atmosphereAltitude(0.2)
    .showGraticules(false);

  // Get THREE from globe's renderer (globe.gl bundles its own Three.js)
  const THREE = globe.scene().constructor.__proto__.constructor.__proto__
    ? window.THREE
    : window.THREE;

  // Try to access THREE - globe.gl uses it internally
  // We loaded it via CDN so window.THREE should be available
  if (typeof THREE === 'undefined') {
    console.error('[Globe] THREE.js not available!');
  }

  // Load country boundaries for the stylized wireframe look
  fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
    .then(res => res.json())
    .then(countries => {
      globe
        .polygonsData(countries.features)
        .polygonCapColor(() => 'rgba(10, 20, 40, 0.85)')
        .polygonSideColor(() => 'rgba(0, 200, 220, 0.08)')
        .polygonStrokeColor(() => 'rgba(0, 200, 220, 0.35)')
        .polygonAltitude(0.005);
      console.log('[Globe] Country borders loaded');
    });

  // Custom globe material for dark navy look
  try {
    const globeMaterial = globe.globeMaterial();
    if (THREE) {
      globeMaterial.color = new THREE.Color(0x080c18);
      globeMaterial.emissive = new THREE.Color(0x050810);
      globeMaterial.emissiveIntensity = 0.4;
      globeMaterial.shininess = 0.2;
    } else {
      globeMaterial.color.setHex(0x080c18);
    }
  } catch(e) {
    console.warn('[Globe] Could not set globe material:', e.message);
  }

  // Add star field background
  try {
    if (THREE) {
      addStarField(THREE);
    }
  } catch(e) {
    console.warn('[Globe] Star field failed:', e.message);
  }

  // Custom lighting
  try {
    const scene = globe.scene();
    if (THREE) {
      scene.children.forEach(child => {
        if (child.isLight) {
          if (child.isDirectionalLight) child.intensity = 0.6;
          else if (child.isAmbientLight) child.intensity = 0.8;
        }
      });
      const pointLight = new THREE.PointLight(0x1a3a5c, 1.0, 0);
      pointLight.position.set(200, 200, 200);
      scene.add(pointLight);
    }
  } catch(e) {
    console.warn('[Globe] Lighting setup failed:', e.message);
  }

  function addStarField(THREE) {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 400 + Math.random() * 300;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0x667799, size: 0.5, transparent: true, opacity: 0.8, sizeAttenuation: true
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    globe.scene().add(stars);
    console.log('[Globe] Star field added');
  }

  // Add CSS animation for pulse ring
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse-ring {
      0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // --- Rendering ---
  function updateGlobe() {
    const showFlights = UIModule.getShowFlights();
    const showShips = UIModule.getShowShips();

    // Flight data as HTML elements (plane icons)
    const flights = showFlights ? FlightTracker.getDisplayData() : [];
    const highlighted = SearchModule.getHighlighted();

    const flightHtmlData = flights.map(f => ({
      lat: f.lat,
      lng: f.lng,
      altitude: Math.min(f.altitude / 500000, 0.08),
      color: f.color,
      callsign: f.callsign,
      heading: f.heading,
      size: f.size,
      isHighlighted: highlighted && f.callsign === highlighted
    }));

    globe
      .htmlElementsData(flightHtmlData)
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlAltitude(d => d.altitude)
      .htmlElement(d => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;pointer-events:none;';

        const plane = document.createElement('div');
        const rotation = (d.heading || 0) - 90;
        plane.style.cssText = `color:${d.color};font-size:${12 + d.size * 8}px;transform:rotate(${rotation}deg);text-shadow:0 0 6px ${d.color},0 0 12px ${d.color};line-height:1;filter:brightness(1.3);`;
        plane.textContent = '✈';
        wrapper.appendChild(plane);

        if (d.isHighlighted) {
          const ring = document.createElement('div');
          ring.style.cssText = 'position:absolute;width:30px;height:30px;border:2px solid #00c8dc;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse-ring 1.5s ease-out infinite;pointer-events:none;';
          wrapper.appendChild(ring);
        }

        if (d.callsign) {
          const label = document.createElement('div');
          label.style.cssText = `color:${d.color};font-size:8px;font-weight:600;text-shadow:0 0 3px rgba(0,0,0,0.8);margin-top:1px;opacity:${d.isHighlighted ? 1 : 0.7};`;
          label.textContent = d.callsign;
          wrapper.appendChild(label);
        }

        return wrapper;
      });

    // Ship data as points
    const shipPositions = showShips ? ShipTracker.getPositions() : [];

    globe
      .pointsData(shipPositions)
      .pointLat(d => d.lat)
      .pointLng(d => d.lng)
      .pointAltitude(0.001)
      .pointRadius(0.25)
      .pointColor(d => d.color)
      .pointLabel(d => `
        <div style="background:rgba(10,14,30,0.9);padding:6px 10px;border-radius:6px;border:1px solid rgba(0,200,220,0.3);font-size:12px;color:#e0e8f0;">
          <b style="color:${d.color}">${d.name}</b><br>
          Type: ${d.label}<br>
          Route: ${d.routeName}
        </div>
      `);

    // Update UI status
    UIModule.updateStatus(
      FlightTracker.isLive(),
      FlightTracker.displayCount(),
      shipPositions.length
    );

    console.log(`[Globe] Rendered ${flights.length} flights, ${shipPositions.length} ships`);
  }

  // Wire up callbacks
  FlightTracker.onUpdate(() => updateGlobe());
  SearchModule.init((lat, lng, callsign) => {
    globe.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
    updateGlobe();
  });
  UIModule.init(() => updateGlobe());

  // Animate ships every 2 seconds
  setInterval(() => {
    if (UIModule.getShowShips()) updateGlobe();
  }, 2000);

  // Initial view - centered on Atlantic
  globe.pointOfView({ lat: 30, lng: -20, altitude: 2.2 });

  // Initial render after a small delay to ensure data is ready
  setTimeout(() => {
    updateGlobe();
    console.log('[Globe] Initialized');
  }, 500);
})();
