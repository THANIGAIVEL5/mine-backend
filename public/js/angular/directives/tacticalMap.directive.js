/**
 * Tactical Mine Map Directive - High-Performance Interactive GIS Mine Infrastructure System
 * SIH 2026 - Chasnala Deep Mine Sector 4B Surveillance
 */
(function () {
  'use strict';

  var MINE_LAT = 23.795741;
  var MINE_LON = 86.430412;

  angular
    .module('terraPulseApp')
    .directive('tacticalMap', [
      '$timeout',
      'telemetryService',
      'themeService',
      function ($timeout, telemetryService, themeService) {
        return {
          restrict: 'A',
          link: function (scope, element, attrs) {
            var map = null;
            var baseLayers = {};
            var overlayLayers = {
              sensors: null,
              dgms: null,
              drifts: null,
              geology: null,
              sump: null,
              miners: null,
              seismic: null
            };
            var nodeMarkers = {};
            var nodePulseCircles = {};
            var seismicCircle = null;
            var currentBaseLayer = null;

            // Coordinates for Chasnala Sector 4B Subterranean Assets
            var SENSORS_GEO = [
              { id: 1, name: 'NODE-01 (Shaft #2)',         lat: 23.796850, lon: 86.429820, elev: '185m RL', location: 'Shaft #2 Collar' },
              { id: 2, name: 'NODE-02 (Overburden)',       lat: 23.797200, lon: 86.431800, elev: '210m RL', location: 'Overburden Bench' },
              { id: 3, name: 'NODE-03 (Pillar 4B Stope)',  lat: 23.795741, lon: 86.430412, elev: '142m RL', location: 'Pillar 4B Stope', critical: true },
              { id: 4, name: 'NODE-04 (Sump Basin)',       lat: 23.793800, lon: 86.428500, elev: '120m RL', location: 'Sump Sub-Level' },
              { id: 5, name: 'NODE-05 (Haulage Drift #12)', lat: 23.794600, lon: 86.432200, elev: '158m RL', location: 'Haulage Drift #12' }
            ];

            function initMap() {
              if (typeof L === 'undefined') {
                console.warn('Leaflet GIS library not detected.');
                return;
              }

              // Initialize Leaflet Map
              map = L.map(element[0], {
                center: [MINE_LAT, MINE_LON],
                zoom: 16,
                minZoom: 13,
                maxZoom: 19,
                zoomControl: false,
                attributionControl: false
              });

              // Add zoom control at bottom-right
              L.control.zoom({ position: 'bottomright' }).addTo(map);

              // 1. High-Resolution Tile Providers
              var satellite = L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                { maxZoom: 19, maxNativeZoom: 18 }
              );

              var topo = L.tileLayer(
                'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                { maxZoom: 17 }
              );

              var dark = L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                { maxZoom: 19, subdomains: 'abcd' }
              );

              var light = L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                { maxZoom: 19, subdomains: 'abcd' }
              );

              baseLayers = {
                satellite: satellite,
                topo: topo,
                dark: dark,
                light: light
              };

              // Select initial base layer based on current theme
              var isDarkTheme = document.documentElement.classList.contains('dark');
              currentBaseLayer = isDarkTheme ? satellite : satellite;
              currentBaseLayer.addTo(map);

              // Initialize Layer Groups
              overlayLayers.sensors = L.layerGroup().addTo(map);
              overlayLayers.dgms = L.layerGroup().addTo(map);
              overlayLayers.drifts = L.layerGroup().addTo(map);
              overlayLayers.geology = L.layerGroup().addTo(map);
              overlayLayers.sump = L.layerGroup().addTo(map);
              overlayLayers.miners = L.layerGroup().addTo(map);
              overlayLayers.seismic = L.layerGroup().addTo(map);

              // Render Map Elements
              buildGeologicalStrata();
              buildDgmsSafetyZones();
              buildUndergroundDriftNetwork();
              buildSumpReservoir();
              buildFaultLines();
              buildMinerPositions();
              buildSensorNodeMarkers();
              buildSeismicPulse();

              // Cursor Coordinate Inspector
              map.on('mousemove', function (e) {
                var coordEl = document.getElementById('map-cursor-coords');
                if (coordEl) {
                  var lat = e.latlng.lat.toFixed(5);
                  var lng = e.latlng.lng.toFixed(5);
                  var estElev = (175 - (e.latlng.lat - MINE_LAT) * 1500).toFixed(1);
                  coordEl.innerHTML = 'LAT: ' + lat + '° N | LNG: ' + lng + '° E | EL: ' + estElev + 'm RL';
                }
              });

              // Force map layout recalculation on load and resize
              $timeout(function () {
                if (map) map.invalidateSize();
              }, 250);
            }

            // --- 1. Subterranean Coal Seam 14 & Extraction Stopes ---
            function buildGeologicalStrata() {
              // Coal Seam #14 Extraction Stope Boundary
              var stopeCoords = [
                [23.7975, 86.4285],
                [23.7980, 86.4325],
                [23.7950, 86.4335],
                [23.7942, 86.4300],
                [23.7952, 86.4280]
              ];
              var stopePoly = L.polygon(stopeCoords, {
                color: '#38bdf8',
                weight: 1.5,
                dashArray: '4, 4',
                fillColor: '#0284c7',
                fillOpacity: 0.12
              }).bindTooltip('<b>CHASNALA SEAM #14</b><br/>Extraction Panel 4B (-210m RL)', {
                sticky: true,
                className: 'tactical-tooltip'
              });
              overlayLayers.geology.addLayer(stopePoly);

              // Goaf Area (Extracted Caved Zone)
              var goafCoords = [
                [23.7965, 86.4312],
                [23.7975, 86.4325],
                [23.7958, 86.4332],
                [23.7952, 86.4318]
              ];
              var goafPoly = L.polygon(goafCoords, {
                color: '#f59e0b',
                weight: 1,
                dashArray: '3, 3',
                fillColor: '#78350f',
                fillOpacity: 0.20
              }).bindTooltip('<b>HISTORIC GOAF (CAVED)</b><br/>High Subsidence Potential', {
                sticky: true,
                className: 'tactical-tooltip'
              });
              overlayLayers.geology.addLayer(goafPoly);
            }

            // --- 2. DGMS Regulation 124 Safety Buffer Zones ---
            function buildDgmsSafetyZones() {
              // 220m Critical Evacuation Ring (Red)
              var evacRing = L.circle([MINE_LAT, MINE_LON], {
                radius: 220,
                color: '#ef4444',
                weight: 2,
                dashArray: '6, 6',
                fillColor: '#ef4444',
                fillOpacity: 0.16
              }).bindPopup(
                '<div class="tactical-popup">' +
                '<div class="popup-title text-rose-500 font-bold">⚠️ DGMS 220m CRITICAL EXCLUSION ZONE</div>' +
                '<div class="popup-desc">Zone SEC-4B Pillar Tilt Excursion (+3.84° Δ). Immediate underground clearance mandated under Reg 124.</div>' +
                '</div>'
              );
              overlayLayers.dgms.addLayer(evacRing);

              // 450m Geotechnical Watch Boundary (Amber)
              var watchRing = L.circle([MINE_LAT, MINE_LON], {
                radius: 450,
                color: '#f59e0b',
                weight: 1.5,
                dashArray: '8, 8',
                fillColor: '#f59e0b',
                fillOpacity: 0.06
              }).bindTooltip('<b>DGMS 450m WATCH BOUNDARY</b><br/>Continuous InSAR & LoRa Monitoring', {
                sticky: true,
                className: 'tactical-tooltip'
              });
              overlayLayers.dgms.addLayer(watchRing);
            }

            // --- 3. Subterranean Drift & Evacuation Corridor Network ---
            function buildUndergroundDriftNetwork() {
              // Escape Corridor Alpha (Surface Incline Portal) - Emerald Green
              var corridorAlphaCoords = [
                [MINE_LAT, MINE_LON],
                [23.7965, 86.4288],
                [23.7978, 86.4265],
                [23.7990, 86.4240]
              ];
              var lineAlpha = L.polyline(corridorAlphaCoords, {
                color: '#10b981',
                weight: 3.5,
                opacity: 0.9,
                dashArray: '8, 6'
              }).bindTooltip('<b>ESCAPE CORRIDOR ALPHA</b><br/>Surface Incline Portal (Clear)', {
                sticky: true,
                className: 'tactical-tooltip'
              });
              overlayLayers.drifts.addLayer(lineAlpha);

              // Escape Corridor Beta (Shaft #2 Hoistway) - Sky Blue
              var corridorBetaCoords = [
                [MINE_LAT, MINE_LON],
                [23.7962, 86.4300],
                [23.796850, 86.429820]
              ];
              var lineBeta = L.polyline(corridorBetaCoords, {
                color: '#06b6d4',
                weight: 3.5,
                opacity: 0.9,
                dashArray: '6, 4'
              }).bindTooltip('<b>ESCAPE CORRIDOR BETA</b><br/>Shaft #2 Winder Cage Standby', {
                sticky: true,
                className: 'tactical-tooltip'
              });
              overlayLayers.drifts.addLayer(lineBeta);

              // Haulage Drift #12 - Amber
              var haulageCoords = [
                [MINE_LAT, MINE_LON],
                [23.7950, 86.4312],
                [23.7946, 86.4322],
                [23.7935, 86.4338]
              ];
              var lineHaulage = L.polyline(haulageCoords, {
                color: '#f59e0b',
                weight: 2.5,
                opacity: 0.8,
                dashArray: '4, 4'
              }).bindTooltip('<b>HAULAGE DRIFT #12</b><br/>Conveyor Belt Transit (-158m RL)', {
                sticky: true,
                className: 'tactical-tooltip'
              });
              overlayLayers.drifts.addLayer(lineHaulage);

              // Incline Portal Marker
              var portalIcon = L.divIcon({
                className: 'tactical-portal-icon',
                html: '<div class="portal-badge bg-emerald-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow font-bold flex items-center gap-1 border border-white/40">🚪 INCLINE PORTAL</div>',
                iconSize: [110, 24],
                iconAnchor: [55, 12]
              });
              var portalMarker = L.marker([23.7990, 86.4240], { icon: portalIcon });
              overlayLayers.drifts.addLayer(portalMarker);

              // Shaft #2 Headframe Marker
              var shaftIcon = L.divIcon({
                className: 'tactical-portal-icon',
                html: '<div class="portal-badge bg-cyan-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow font-bold flex items-center gap-1 border border-white/40">🏗️ SHAFT #2 HEADFRAME</div>',
                iconSize: [130, 24],
                iconAnchor: [65, 12]
              });
              var shaftMarker = L.marker([23.796850, 86.429820], { icon: shaftIcon });
              overlayLayers.drifts.addLayer(shaftMarker);
            }

            // --- 4. Subsurface Sump Reservoir (Inundation Risk) ---
            function buildSumpReservoir() {
              var sumpCoords = [
                [23.7932, 86.4278],
                [23.7942, 86.4292],
                [23.7935, 86.4300],
                [23.7925, 86.4285]
              ];
              var sumpPoly = L.polygon(sumpCoords, {
                color: '#0284c7',
                weight: 2,
                fillColor: '#0369a1',
                fillOpacity: 0.35
              }).bindPopup(
                '<div class="tactical-popup">' +
                '<div class="popup-title text-cyan-400 font-bold">🌊 REL-35 UNDERGROUND SUMP RESERVOIR</div>' +
                '<div class="popup-desc">Water Level: <b>34.0m</b> / 45.0m Maximum Capacity<br/>Inflow Rate: 1,420 LPM | Dewatering Pumps: 3 Active</div>' +
                '</div>'
              );
              overlayLayers.sump.addLayer(sumpPoly);
            }

            // --- 5. Geological Fault Lines ---
            function buildFaultLines() {
              var faultCoords = [
                [23.7985, 86.4310],
                [23.7965, 86.4308],
                [23.7940, 86.4302],
                [23.7920, 86.4298]
              ];
              var faultLine = L.polyline(faultCoords, {
                color: '#dc2626',
                weight: 2.5,
                dashArray: '5, 8',
                opacity: 0.85
              }).bindTooltip('<b>GEOLOGICAL FAULT F-4B</b><br/>Active Shear Fracture Plane', {
                sticky: true,
                className: 'tactical-tooltip'
              });
              overlayLayers.geology.addLayer(faultLine);
            }

            // --- 6. Live Miner Personnel Tracking Underground ---
            function buildMinerPositions() {
              var crews = [
                { name: 'Crew 4B (Drillers)', lat: 23.7958, lon: 86.4305, count: 8, status: 'EVAC_ALERT', color: '#ef4444' },
                { name: 'Crew Alpha (Haulage)', lat: 23.7965, lon: 86.4295, count: 6, status: 'STANDBY', color: '#10b981' },
                { name: 'Crew Sump (Pumps)', lat: 23.7938, lon: 86.4287, count: 3, status: 'NORMAL', color: '#06b6d4' },
                { name: 'Crew Bench (Surface)', lat: 23.7973, lon: 86.4317, count: 5, status: 'NORMAL', color: '#f59e0b' },
                { name: 'Crew Drift 12', lat: 23.7947, lon: 86.4321, count: 4, status: 'NORMAL', color: '#10b981' }
              ];

              crews.forEach(function (c) {
                var minerIcon = L.divIcon({
                  className: 'tactical-miner-icon',
                  html: '<div class="miner-badge flex items-center gap-1 px-1.5 py-0.5 rounded shadow text-[9px] font-mono font-bold text-white border border-white/30" style="background-color: ' + c.color + ';">' +
                        '<span>👷 ' + c.count + '</span>' +
                        '</div>',
                  iconSize: [42, 20],
                  iconAnchor: [21, 10]
                });

                var marker = L.marker([c.lat, c.lon], { icon: minerIcon }).bindTooltip(
                  '<b>' + c.name + '</b><br/>Personnel: ' + c.count + ' Active<br/>Status: ' + c.status,
                  { sticky: true, className: 'tactical-tooltip' }
                );
                overlayLayers.miners.addLayer(marker);
              });
            }

            // --- 7. LoRa Telemetry Sensor Nodes (1 to 5) ---
            function buildSensorNodeMarkers() {
              SENSORS_GEO.forEach(function (node) {
                var isCritical = node.id === 3;
                var iconHtml = createNodeIconHtml(node.id, isCritical, 3.84, 'CRITICAL');

                var nodeIcon = L.divIcon({
                  className: 'tactical-node-icon',
                  html: iconHtml,
                  iconSize: [38, 38],
                  iconAnchor: [19, 19]
                });

                var marker = L.marker([node.lat, node.lon], { icon: nodeIcon });
                marker.on('click', function () {
                  scope.$apply(function () {
                    if (scope.vm && scope.vm.selectNode) {
                      scope.vm.selectNode(node.id);
                    }
                  });
                  openNodePopup(node, marker);
                });

                overlayLayers.sensors.addLayer(marker);
                nodeMarkers[node.id] = marker;
              });
            }

            function createNodeIconHtml(nodeId, isCritical, pitchVal, statusText) {
              if (isCritical) {
                return '<div class="node-radar-wrapper critical relative flex items-center justify-center">' +
                       '<span class="node-radar-ring animate-ping"></span>' +
                       '<span class="node-radar-ring ring-2"></span>' +
                       '<div class="node-beacon-core bg-rose-600 border-2 border-white text-white font-black text-[11px] font-mono rounded-full w-8 h-8 flex items-center justify-center shadow-lg cursor-pointer">' +
                       'N' + nodeId +
                       '</div>' +
                       '<div class="node-badge-alert bg-rose-700 text-white font-mono text-[8px] font-bold px-1 rounded absolute -top-2 border border-white/40">' + (pitchVal ? pitchVal.toFixed(1) + '°' : 'ERR') + '</div>' +
                       '</div>';
              } else {
                return '<div class="node-radar-wrapper relative flex items-center justify-center">' +
                       '<span class="node-radar-ring pulse-green"></span>' +
                       '<div class="node-beacon-core bg-cyan-600 dark:bg-cyan-500 border-2 border-white dark:border-slate-900 text-white font-bold text-[10px] font-mono rounded-full w-7 h-7 flex items-center justify-center shadow-md cursor-pointer">' +
                       'N' + nodeId +
                       '</div>' +
                       '</div>';
              }
            }

            function openNodePopup(node, marker) {
              var d = telemetryService.data || {};
              var pitch = node.id === 3 ? (d.pitch || 3.84) : 0.42;
              var roll = node.id === 3 ? (d.roll || -1.15) : 0.12;
              var fft = node.id === 3 ? (d.fft || 48) : 12;
              var statusClass = node.id === 3 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-emerald-600 dark:text-emerald-400 font-bold';
              var statusText = node.id === 3 ? 'HAZARD CRITICAL TRIGGER' : 'NOMINAL TELEMETRY';

              var content = '<div class="tactical-node-popup p-3 font-sans text-[12px] min-w-[220px]">' +
                '<div class="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-1.5 mb-2">' +
                '<div class="font-mono font-bold text-slate-900 dark:text-white text-[13px]">' + node.name + '</div>' +
                '<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300">' + node.elev + '</span>' +
                '</div>' +
                '<div class="text-[10px] font-mono uppercase tracking-wider mb-2 ' + statusClass + '">● ' + statusText + '</div>' +
                '<div class="grid grid-cols-2 gap-2 font-mono text-[11px] mb-2 bg-slate-50 dark:bg-black/40 p-2 rounded border border-slate-200/60 dark:border-white/5">' +
                '<div><span class="text-slate-500 dark:text-zinc-400 block text-[9px]">PITCH TILT</span><b class="text-slate-900 dark:text-white">' + Number(pitch).toFixed(2) + '° Δ</b></div>' +
                '<div><span class="text-slate-500 dark:text-zinc-400 block text-[9px]">ROLL AXIS</span><b class="text-slate-900 dark:text-white">' + Number(roll).toFixed(2) + '°</b></div>' +
                '<div><span class="text-slate-500 dark:text-zinc-400 block text-[9px]">VIBRATION FFT</span><b class="text-slate-900 dark:text-white">' + Number(fft).toFixed(0) + ' Hz</b></div>' +
                '<div><span class="text-slate-500 dark:text-zinc-400 block text-[9px]">SX1278 RSSI</span><b class="text-slate-900 dark:text-white">-78 dBm</b></div>' +
                '</div>' +
                '<div class="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Location: ' + node.location + '</div>' +
                '</div>';

              marker.bindPopup(content, { className: 'tactical-leaflet-popup' }).openPopup();
            }

            // --- 8. Concentric Seismic Shockwave Animation ---
            function buildSeismicPulse() {
              seismicCircle = L.circle([MINE_LAT, MINE_LON], {
                radius: 80,
                color: '#ef4444',
                weight: 1.5,
                fillColor: '#f43f5e',
                fillOpacity: 0.15
              });
              overlayLayers.seismic.addLayer(seismicCircle);

              var radius = 80;
              var expanding = true;
              setInterval(function () {
                if (!map || !seismicCircle) return;
                if (expanding) {
                  radius += 6;
                  if (radius > 160) radius = 80;
                  seismicCircle.setRadius(radius);
                }
              }, 120);
            }

            // --- Realtime Telemetry Data Hook ---
            telemetryService.onUpdate(function (d) {
              if (!map || !nodeMarkers[3]) return;
              var pitch = d.pitch || 3.84;
              var isCritical = pitch > 3.0;
              var marker = nodeMarkers[3];
              if (marker) {
                var newIcon = L.divIcon({
                  className: 'tactical-node-icon',
                  html: createNodeIconHtml(3, isCritical, pitch, isCritical ? 'CRITICAL' : 'STABLE'),
                  iconSize: [38, 38],
                  iconAnchor: [19, 19]
                });
                marker.setIcon(newIcon);
              }
            });

            // --- Scope Event Listeners (Backward Compatible) ---
            scope.$on('map:flyToNode', function (e, nodeNum) {
              flyToNode(nodeNum);
            });
            scope.$on('cesium:flyToNode', function (e, nodeNum) {
              flyToNode(nodeNum);
            });

            scope.$on('map:recenter', function () {
              if (map) map.flyTo([MINE_LAT, MINE_LON], 16, { duration: 1.2 });
            });
            scope.$on('cesium:recenter', function () {
              if (map) map.flyTo([MINE_LAT, MINE_LON], 16, { duration: 1.2 });
            });

            scope.$on('map:reset', function () {
              if (map) map.flyTo([MINE_LAT, MINE_LON], 14, { duration: 1.4 });
            });
            scope.$on('cesium:reset', function () {
              if (map) map.flyTo([MINE_LAT, MINE_LON], 14, { duration: 1.4 });
            });

            scope.$on('map:setLayer', function (e, layerName) {
              setBaseLayer(layerName);
            });

            scope.$on('map:toggleOverlay', function (e, layerName, visible) {
              toggleOverlay(layerName, visible);
            });

            function flyToNode(nodeNum) {
              var target = SENSORS_GEO.find(function (n) { return n.id === nodeNum; });
              if (target && map) {
                map.flyTo([target.lat, target.lon], 18, { duration: 1.0 });
                $timeout(function () {
                  if (nodeMarkers[nodeNum]) {
                    openNodePopup(target, nodeMarkers[nodeNum]);
                  }
                }, 1000);
              }
            }

            function setBaseLayer(layerName) {
              if (!map || !baseLayers[layerName]) return;
              if (currentBaseLayer) map.removeLayer(currentBaseLayer);
              currentBaseLayer = baseLayers[layerName];
              currentBaseLayer.addTo(map);
            }

            function toggleOverlay(layerName, visible) {
              if (!map || !overlayLayers[layerName]) return;
              if (visible) {
                if (!map.hasLayer(overlayLayers[layerName])) {
                  map.addLayer(overlayLayers[layerName]);
                }
              } else {
                if (map.hasLayer(overlayLayers[layerName])) {
                  map.removeLayer(overlayLayers[layerName]);
                }
              }
            }

            // Expose map controller to window / scope for quick buttons
            window.terraMapController = {
              setLayer: setBaseLayer,
              toggleOverlay: toggleOverlay,
              focusSector4B: function () { if (map) map.flyTo([MINE_LAT, MINE_LON], 17, { duration: 1.0 }); },
              focusShaft2: function () { if (map) map.flyTo([23.796850, 86.429820], 18, { duration: 1.0 }); },
              focusSump: function () { if (map) map.flyTo([23.793800, 86.428500], 18, { duration: 1.0 }); },
              overview: function () { if (map) map.flyTo([MINE_LAT, MINE_LON], 15, { duration: 1.2 }); }
            };

            initMap();

            element.on('$destroy', function () {
              if (map) {
                map.remove();
                map = null;
              }
            });
          }
        };
      }
    ]);
})();
