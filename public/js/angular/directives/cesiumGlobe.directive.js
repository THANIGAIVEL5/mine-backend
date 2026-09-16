/**
 * Cesium Globe Directive - Isolates Photorealistic 3D Globe WebGL Lifecycle
 */
(function () {
  'use strict';

  var MINE_LAT = 23.795741;
  var MINE_LON = 86.430412;
  var MINE_ALT = 185.0;

  angular
    .module('terraPulseApp')
    .directive('cesiumGlobe', [
      '$timeout',
      function ($timeout) {
        return {
          restrict: 'A',
          link: function (scope, element, attrs) {
            var viewer = null;
            var nodeEntities = {};
            var strataEntities = [];
            var protocolEntities = [];
            var subsidenceVector = null;

            function initCesium() {
              if (typeof Cesium === 'undefined') {
                console.warn('Cesium library not detected, skipping 3D Globe init.');
                return;
              }

              try {
                var containerId = element[0].id || 'gods-eye-globe-container';
                var esriAsync = Cesium.ArcGisMapServerImageryProvider.fromUrl(
                  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                  { enablePickFeatures: false }
                ).catch(function (err) {
                  console.warn('Esri World Imagery fallback to OSM:', err);
                  return Cesium.OpenStreetMapImageryProvider.fromUrl('https://tile.openstreetmap.org/');
                });

                viewer = new Cesium.Viewer(element[0], {
                  baseLayer: Cesium.ImageryLayer.fromProviderAsync(esriAsync),
                  baseLayerPicker: false,
                  geocoder: false,
                  homeButton: false,
                  infoBox: false,
                  sceneModePicker: false,
                  selectionIndicator: false,
                  timeline: false,
                  navigationHelpButton: false,
                  animation: false,
                  shouldAnimate: true
                });

                viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b101b');
                viewer.scene.globe.enableLighting = true;
                viewer.scene.globe.depthTestAgainstTerrain = false;
                viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020408');

                // 1. Subterranean Coal Seam Volume
                var seamEntity = viewer.entities.add({
                  name: 'Chasnala Main Coal Seam #14 (Subterranean Anthracite)',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT - 25),
                  cylinder: {
                    length: 18.0,
                    topRadius: 180.0,
                    bottomRadius: 210.0,
                    material: Cesium.Color.fromCssColorString('#18181b').withAlpha(0.85),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#3f3f46').withAlpha(0.6)
                  }
                });
                strataEntities.push(seamEntity);

                // 2. Overburden Sandstone Caprock
                var caprockEntity = viewer.entities.add({
                  name: 'Overburden Sandstone Stratum',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT + 8),
                  cylinder: {
                    length: 12.0,
                    topRadius: 240.0,
                    bottomRadius: 260.0,
                    material: Cesium.Color.fromCssColorString('#d97706').withAlpha(0.35),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#b45309').withAlpha(0.7)
                  }
                });
                strataEntities.push(caprockEntity);

                // 3. Subsurface Mine Sump Basin
                var sumpEntity = viewer.entities.add({
                  name: 'REL_35 Underground Sump Basin (Water Table Reservoir)',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON - 0.0022, MINE_LAT - 0.0031, MINE_ALT - 42),
                  cylinder: {
                    length: 8.0,
                    topRadius: 90.0,
                    bottomRadius: 90.0,
                    material: Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.65),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#38bdf8')
                  }
                });
                strataEntities.push(sumpEntity);

                // 4. DGMS Safety Protocol Layers
                var evacCylinder = viewer.entities.add({
                  name: 'DGMS 220m Critical Evacuation Zone',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT + 1),
                  cylinder: {
                    length: 2.0,
                    topRadius: 220.0,
                    bottomRadius: 220.0,
                    material: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.20),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#ef4444')
                  }
                });
                protocolEntities.push(evacCylinder);

                var watchCylinder = viewer.entities.add({
                  name: 'DGMS 450m Geotechnical Watch Boundary',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT),
                  cylinder: {
                    length: 1.0,
                    topRadius: 450.0,
                    bottomRadius: 450.0,
                    material: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.08),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#f59e0b')
                  }
                });
                protocolEntities.push(watchCylinder);

                var corridorAlpha = viewer.entities.add({
                  name: 'Escape Corridor Alpha (Incline Portal)',
                  polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                      MINE_LON, MINE_LAT, MINE_ALT + 15,
                      MINE_LON - 0.0016, MINE_LAT + 0.0017, MINE_ALT + 18,
                      MINE_LON - 0.0035, MINE_LAT + 0.0028, MINE_ALT + 22.5,
                      MINE_LON - 0.0054, MINE_LAT + 0.0055, MINE_ALT + 30
                    ]),
                    width: 3.5,
                    material: new Cesium.PolylineGlowMaterialProperty({
                      glowPower: 0.3,
                      color: Cesium.Color.fromCssColorString('#10b981')
                    })
                  }
                });
                protocolEntities.push(corridorAlpha);

                var corridorBeta = viewer.entities.add({
                  name: 'Escape Corridor Beta (Hoist Alpha)',
                  polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                      MINE_LON, MINE_LAT, MINE_ALT + 15,
                      MINE_LON + 0.0024, MINE_LAT + 0.0009, MINE_ALT + 25,
                      MINE_LON + 0.0042, MINE_LAT + 0.0015, MINE_ALT + 45
                    ]),
                    width: 3.0,
                    material: new Cesium.PolylineGlowMaterialProperty({
                      glowPower: 0.3,
                      color: Cesium.Color.fromCssColorString('#00f5ff')
                    })
                  }
                });
                protocolEntities.push(corridorBeta);

                // 5. Sensor Nodes
                nodeEntities[1] = viewer.entities.add({
                  name: 'NODE-01: Shaft #2 North Drift',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON - 0.0035, MINE_LAT + 0.0028, MINE_ALT + 22.5),
                  point: { pixelSize: 12, color: Cesium.Color.fromCssColorString('#10b981'), outlineColor: Cesium.Color.fromCssColorString('#064e3b'), outlineWidth: 2 },
                  label: { text: 'NODE-01 [SHAFT #2 OK]', font: '10px JetBrains Mono, monospace', style: Cesium.LabelStyle.FILL_AND_OUTLINE, fillColor: Cesium.Color.fromCssColorString('#6ee7b7'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -14) }
                });

                nodeEntities[2] = viewer.entities.add({
                  name: 'NODE-02: Overburden Haul Road',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON + 0.0042, MINE_LAT + 0.0015, MINE_ALT + 45.0),
                  point: { pixelSize: 12, color: Cesium.Color.fromCssColorString('#f59e0b'), outlineColor: Cesium.Color.fromCssColorString('#78350f'), outlineWidth: 2 },
                  label: { text: 'NODE-02 [OVERBURDEN WATCH]', font: '10px JetBrains Mono, monospace', style: Cesium.LabelStyle.FILL_AND_OUTLINE, fillColor: Cesium.Color.fromCssColorString('#fcd34d'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -14) }
                });

                nodeEntities[3] = viewer.entities.add({
                  name: 'TARGET: NODE-03 SEC-4B [ACTIVE STOPE PILLAR]',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT + 30.0),
                  point: { pixelSize: 16, color: Cesium.Color.fromCssColorString('#ef4444'), outlineColor: Cesium.Color.WHITE, outlineWidth: 3 },
                  label: { text: 'TARGET: NODE-03 SEC-4B\n[ACTIVE STOPE PILLAR]', font: '11px JetBrains Mono, monospace', style: Cesium.LabelStyle.FILL_AND_OUTLINE, fillColor: Cesium.Color.fromCssColorString('#fca5a5'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -20) }
                });

                nodeEntities[4] = viewer.entities.add({
                  name: 'NODE-04: Sub-Gallery Sump Basin',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON - 0.0022, MINE_LAT - 0.0031, MINE_ALT - 30.0),
                  point: { pixelSize: 12, color: Cesium.Color.fromCssColorString('#0ea5e9'), outlineColor: Cesium.Color.fromCssColorString('#0c4a6e'), outlineWidth: 2 },
                  label: { text: 'NODE-04 [SUMP RESERVOIR]', font: '10px JetBrains Mono, monospace', style: Cesium.LabelStyle.FILL_AND_OUTLINE, fillColor: Cesium.Color.fromCssColorString('#7dd3fc'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -14) }
                });

                nodeEntities[5] = viewer.entities.add({
                  name: 'NODE-05: Haulage Drift #12 Incline',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON + 0.0055, MINE_LAT + 0.0045, MINE_ALT + 10.0),
                  point: { pixelSize: 12, color: Cesium.Color.fromCssColorString('#14b8a6'), outlineColor: Cesium.Color.fromCssColorString('#134e4a'), outlineWidth: 2 },
                  label: { text: 'NODE-05 [DRIFT 12 ONLINE]', font: '10px JetBrains Mono, monospace', style: Cesium.LabelStyle.FILL_AND_OUTLINE, fillColor: Cesium.Color.fromCssColorString('#99f6e4'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -14) }
                });

                // 5b. Dynamic Pulsing Radial Wave Ring around Active Stope Pillar (Node 3)
                var pulseRadius = 15;
                viewer.entities.add({
                  name: 'Dynamic Acoustic Emission Stress Wave',
                  position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT + 25.0),
                  ellipse: {
                    semiMinorAxis: new Cesium.CallbackProperty(function () {
                      pulseRadius += 1.2;
                      if (pulseRadius > 140) pulseRadius = 15;
                      return pulseRadius;
                    }, false),
                    semiMajorAxis: new Cesium.CallbackProperty(function () {
                      return pulseRadius;
                    }, false),
                    material: new Cesium.ColorMaterialProperty(
                      new Cesium.CallbackProperty(function () {
                        var alpha = Math.max(0, 0.7 - (pulseRadius / 140) * 0.7);
                        return Cesium.Color.fromCssColorString('#ef4444').withAlpha(alpha);
                      }, false)
                    ),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#fca5a5').withAlpha(0.6)
                  }
                });

                // 6. Subsidence Vector
                subsidenceVector = viewer.entities.add({
                  name: 'Differential Strata Subsidence Vector',
                  polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                      MINE_LON, MINE_LAT, MINE_ALT + 30,
                      MINE_LON + 0.0008, MINE_LAT - 0.0012, MINE_ALT - 35
                    ]),
                    width: 4,
                    material: new Cesium.PolylineGlowMaterialProperty({
                      glowPower: 0.35,
                      color: Cesium.Color.fromCssColorString('#f43f5e')
                    })
                  }
                });

                // Load GeoJSON Layer
                Cesium.GeoJsonDataSource.load('/api/telemetry/geojson', {
                  stroke: Cesium.Color.fromCssColorString('#ef4444'),
                  fill: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.3),
                  strokeWidth: 3,
                  markerSize: 24
                }).then(function (dataSource) {
                  viewer.dataSources.add(dataSource);
                }).catch(function (e) {
                  console.warn('GeoJSON load notice:', e);
                });

                flyToMine();
              } catch (e) {
                console.warn('Cesium directive init notice:', e);
              }
            }

            function flyToMine() {
              if (!viewer) return;
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, 2500),
                orientation: {
                  heading: Cesium.Math.toRadians(15.0),
                  pitch: Cesium.Math.toRadians(-45.0),
                  roll: 0.0
                },
                duration: 2.0
              });
            }

            function resetGlobe() {
              if (!viewer) return;
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, 15000000),
                orientation: {
                  heading: 0,
                  pitch: Cesium.Math.toRadians(-90.0),
                  roll: 0.0
                },
                duration: 2.5
              });
            }

            function flyToNode(nodeNum) {
              if (!viewer) return;
              var targetEntity = nodeEntities[nodeNum];
              if (targetEntity) {
                viewer.flyTo(targetEntity, {
                  offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(20.0), Cesium.Math.toRadians(-35.0), 650.0),
                  duration: 1.8
                });
              }
            }

            function setOptic(type) {
              element.removeClass('optic-flir optic-nvg optic-crt');
              if (type && type !== 'normal') {
                element.addClass('optic-' + type);
              }
            }

            function toggleProtocol(visible) {
              for (var i = 0; i < protocolEntities.length; i++) {
                if (protocolEntities[i]) {
                  protocolEntities[i].show = !!visible;
                }
              }
            }

            function startFlyThrough() {
              if (!viewer) return;
              // Step 1: Surface Collar
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT + 0.002, MINE_ALT + 350),
                orientation: {
                  heading: Cesium.Math.toRadians(180),
                  pitch: Cesium.Math.toRadians(-45),
                  roll: 0
                },
                duration: 3.5,
                complete: function () {
                  // Step 2: Dive down Chasnala Shaft 4B (-120m depth)
                  viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT - 120),
                    orientation: {
                      heading: Cesium.Math.toRadians(90),
                      pitch: Cesium.Math.toRadians(-20),
                      roll: 0
                    },
                    duration: 4.5,
                    complete: function () {
                      // Step 3: Inspect Pillar 4B Stope (-180m depth)
                      viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(MINE_LON + 0.0008, MINE_LAT - 0.0004, MINE_ALT - 180),
                        orientation: {
                          heading: Cesium.Math.toRadians(45),
                          pitch: Cesium.Math.toRadians(-15),
                          roll: 0
                        },
                        duration: 4.0,
                        complete: function () {
                          // Step 4: Ascend back to tactical overview
                          flyToMine();
                        }
                      });
                    }
                  });
                }
              });
            }

            // Scope Event Handlers
            scope.$on('cesium:flyToNode', function (evt, nodeNum) {
              flyToNode(nodeNum);
            });

            scope.$on('cesium:startFlyThrough', function () {
              startFlyThrough();
            });

            scope.$on('cesium:setOptic', function (evt, mode) {
              setOptic(mode);
            });

            scope.$on('cesium:toggleProtocol', function (evt, visible) {
              toggleProtocol(visible);
            });

            scope.$on('cesium:recenter', function () {
              flyToMine();
            });

            scope.$on('cesium:reset', function () {
              resetGlobe();
            });

            // Initialize after DOM layout settles
            $timeout(initCesium, 100);

            // Cleanup on scope destruction
            scope.$on('$destroy', function () {
              if (viewer && !viewer.isDestroyed()) {
                viewer.destroy();
                viewer = null;
              }
            });
          }
        };
      }
    ]);
})();
