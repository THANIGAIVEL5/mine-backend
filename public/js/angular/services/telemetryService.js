/**
 * Telemetry Service - Real-time Geotechnical Ingestion & Reactive State
 * Supports Live Cloud Backend, WebSockets, HTTP Polling, and Client-Side Autonomous Simulation
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .factory('telemetryService', [
      '$rootScope',
      '$http',
      '$interval',
      function ($rootScope, $http, $interval) {
        function getBackendUrl() {
          var userCustom = localStorage.getItem('terra_backend_url');
          if (userCustom !== null && userCustom.trim() !== '') {
            return userCustom.trim().replace(/\/$/, '');
          }
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000') {
            return '';
          }
          var globalUrl = window.TERRA_BACKEND_URL || 'https://mine-backend-1.onrender.com';
          return globalUrl.replace(/\/$/, '');
        }

        var service = {
          connected: false,
          connectionType: 'SIMULATION (EDGE)',
          latency: 16,
          rssi: -84,
          packetRate: 1.0,
          packetsReceived: 0,
          currentRms: 0.15,
          latestAiText: '[TERRA-SENTINEL MASTER AI] Telemetry baseline nominal. All 5 sensor nodes synchronized.',
          data: {
            pitch: 3.84,
            roll: 1.12,
            disp: 14.8,
            rms: 0.15,
            p2p: 0.42,
            fft: 48.0,
            temp: 28.4,
            aqi: 72,
            co: 12.0,
            nh3: 4.2,
            co2: 680,
            sump: 34.0,
            adc_sump: 1420,
            lat: 23.795741,
            lon: 86.430412,
            alt: 185.0,
            sats: 14,
            hdop: 0.85,
            isoScore: 88,
            isoStatus: 'NOMINAL (ISO 10816-3 CLASS II)',
            phase: 'STABLE',
            hazardLevel: 'IV',
            aiText: '[TERRA-SENTINEL MASTER AI] Telemetry baseline nominal. All 5 sensor nodes synchronized.'
          },
          listeners: [],
          onUpdate: function (cb) {
            this.listeners.push(cb);
          },
          applyOperatorOverride: function (commandText) {
            var text = (commandText || '').toLowerCase();
            var summary = '';

            if (text.includes('evacuat') || text.includes('klaxon')) {
              service.data.phase = 'CRITICAL';
              service.data.pitch = 7.8;
              service.data.roll = 3.4;
              service.data.rms = 1.95;
              service.data.co = 88;
              service.data.disp = 8.5;
              summary = '[OPERATOR INTERVENTION] Emergency evacuation klaxons activated across Sector 4B. Power to stope cut. SCSR donned.';
            } else if (text.includes('ventilat') || text.includes('boost') || text.includes('fan')) {
              service.data.co = Math.max(4.0, +(service.data.co * 0.4).toFixed(1));
              service.data.temp = Math.max(22.0, +(service.data.temp - 3.5).toFixed(1));
              summary = '[OPERATOR INTERVENTION] Auxiliary high-output fans throttled to 100%. Airflow boosted to 3.8 m/s. CO gas flushing.';
            } else if (text.includes('pump') || text.includes('drain') || text.includes('water') || text.includes('dewatering')) {
              service.data.sump = Math.max(2.0, +(service.data.sump * 0.25).toFixed(1));
              summary = '[OPERATOR INTERVENTION] 500 GPM submersible dewatering pump forced online. Sump depth dropping rapidly.';
            } else if (text.includes('chock') || text.includes('bar') || text.includes('pre-tension')) {
              service.data.pitch = Math.max(0.3, +(service.data.pitch * 0.5).toFixed(2));
              service.data.disp = Math.max(0.08, +(service.data.disp * 0.4).toFixed(2));
              summary = '[OPERATOR INTERVENTION] Hydraulic powered roof chocks pre-tensioned to 350 Bar. Strata roof convergence arrested.';
            } else if (text.includes('reset') || text.includes('stable')) {
              service.data.phase = 'STABLE';
              service.data.pitch = 0.5;
              service.data.roll = 0.2;
              service.data.rms = 0.15;
              service.data.co = 12.0;
              service.data.disp = 0.10;
              service.data.sump = 18.0;
              summary = '[OPERATOR INTERVENTION] Telemetry baseline reset to STABLE. Autonomous surveillance re-engaged.';
            }

            if (summary) {
              service.latestAiText = summary;
              service.data.aiText = summary;
              processSnapshot(service.data);
            }
            return { snapshot: service.data, summary: summary };
          }
        };

        var pollingPromise = null;
        var simIntervalPromise = null;
        var socketIo = null;

        // Process Incoming Raw Telemetry Payload
        function processSnapshot(snapshot) {
          if (!snapshot) return;

          service.packetsReceived++;
          service.latency = Math.floor(Math.random() * 12) + 14;
          service.rssi = -80 - Math.floor(Math.random() * 8);

          if (snapshot.pitch !== undefined) service.data.pitch = Number(snapshot.pitch);
          if (snapshot.roll !== undefined) service.data.roll = Number(snapshot.roll);
          if (snapshot.disp !== undefined) service.data.disp = Number(snapshot.disp);
          if (snapshot.rms !== undefined) {
            service.data.rms = Number(snapshot.rms);
            service.currentRms = service.data.rms;
          }
          if (snapshot.p2p !== undefined) service.data.p2p = Number(snapshot.p2p);
          if (snapshot.fft !== undefined) service.data.fft = Number(snapshot.fft);
          if (snapshot.temp !== undefined) service.data.temp = Number(snapshot.temp);
          if (snapshot.aqi !== undefined) service.data.aqi = Number(snapshot.aqi);
          if (snapshot.co !== undefined) service.data.co = Number(snapshot.co);
          if (snapshot.nh3 !== undefined) service.data.nh3 = Number(snapshot.nh3);
          if (snapshot.co2 !== undefined) service.data.co2 = Number(snapshot.co2);
          if (snapshot.sump !== undefined) service.data.sump = Number(snapshot.sump);
          if (snapshot.lat !== undefined) service.data.lat = Number(snapshot.lat);
          if (snapshot.lon !== undefined) service.data.lon = Number(snapshot.lon);
          if (snapshot.alt !== undefined) service.data.alt = Number(snapshot.alt);
          if (snapshot.sats !== undefined) service.data.sats = Number(snapshot.sats);
          if (snapshot.hdop !== undefined) service.data.hdop = Number(snapshot.hdop);
          if (snapshot.phase) service.data.phase = snapshot.phase;

          if (snapshot.aiText) {
            service.latestAiText = snapshot.aiText;
            service.data.aiText = snapshot.aiText;
          }

          // Compute Dynamic ISO 10816-3 Vibration Severity Score
          var rms = service.data.rms;
          if (rms < 0.28) {
            service.data.isoScore = 92;
            service.data.isoStatus = 'GOOD (ISO ZONE A)';
          } else if (rms < 0.71) {
            service.data.isoScore = 78;
            service.data.isoStatus = 'ACCEPTABLE (ISO ZONE B)';
          } else if (rms < 1.8) {
            service.data.isoScore = 54;
            service.data.isoStatus = 'UNRESTRICTED ALERT (ISO ZONE C)';
          } else {
            service.data.isoScore = 22;
            service.data.isoStatus = 'CRITICAL DAMAGE RISK (ISO ZONE D)';
          }

          // Notify subscriber callbacks
          for (var i = 0; i < service.listeners.length; i++) {
            try {
              service.listeners[i](service.data);
            } catch (e) {
              console.warn('Listener error:', e);
            }
          }

          $rootScope.$applyAsync();
        }

        // Initialize Realtime Stream
        function initRealtimeStream() {
          var backendUrl = getBackendUrl();
          var targetUrl = backendUrl || window.location.origin;

          try {
            if (typeof io !== 'undefined') {
              socketIo = io(targetUrl, {
                transports: ['websocket', 'polling'],
                timeout: 4000
              });

              socketIo.on('connect', function () {
                service.connected = true;
                service.connectionType = 'LIVE CLOUD (SOCKET.IO)';
                console.log('📡 [TelemetryService] Live Cloud Backend Connected:', targetUrl);
                if (simIntervalPromise) {
                  $interval.cancel(simIntervalPromise);
                  simIntervalPromise = null;
                }
                $rootScope.$applyAsync();
              });

              socketIo.on('telemetry', function (payload) {
                processSnapshot(payload);
              });

              socketIo.on('disconnect', function () {
                service.connected = false;
                service.connectionType = 'SIMULATION (EDGE)';
                startFallbackPolling();
                $rootScope.$applyAsync();
              });

              return;
            }
          } catch (e) {
            console.warn('Socket.IO init fallback:', e);
          }

          startFallbackPolling();
        }

        // 1Hz Polling / Client-Side Simulation Tick
        function startFallbackPolling() {
          if (pollingPromise || simIntervalPromise) return;

          var backendUrl = getBackendUrl();
          if (backendUrl) {
            var fetchTelemetry = function () {
              $http.get(backendUrl + '/api/telemetry', { timeout: 3000 }).then(
                function (res) {
                  service.connected = true;
                  service.connectionType = 'LIVE (HTTP/1Hz)';
                  var snapshot = res.data.snapshot || res.data.sensors || res.data.data || res.data;
                  processSnapshot(snapshot);
                },
                function () {
                  service.connected = false;
                  service.connectionType = 'SIMULATION (EDGE)';
                  runClientSimTick();
                }
              );
            };
            fetchTelemetry();
            pollingPromise = $interval(fetchTelemetry, 1000);
          } else {
            simIntervalPromise = $interval(runClientSimTick, 1000);
          }
        }

        // Autonomous Jitter / Edge Simulation when backend is offline
        function runClientSimTick() {
          var jitter = (Math.random() - 0.5) * 0.04;
          var pitch = +(Math.max(0.2, service.data.pitch + jitter)).toFixed(2);
          var roll = +(service.data.roll + (Math.random() - 0.5) * 0.02).toFixed(2);
          var rms = +(Math.max(0.08, 0.15 + (Math.random() - 0.5) * 0.03)).toFixed(2);
          var co = +(Math.max(8, 12 + (Math.random() - 0.5) * 1.5)).toFixed(1);
          var temp = +(28.4 + (Math.random() - 0.5) * 0.2).toFixed(1);

          processSnapshot({
            pitch: pitch,
            roll: roll,
            disp: +(Math.sqrt(pitch * pitch + roll * roll)).toFixed(2),
            rms: rms,
            p2p: +(rms * 2.8).toFixed(2),
            fft: 48.0,
            co: co,
            temp: temp,
            sump: 34.0,
            phase: 'STABLE'
          });
        }

        service.reconnect = function (customUrl) {
          if (customUrl !== undefined) {
            if (customUrl) {
              localStorage.setItem('terra_backend_url', customUrl);
            } else {
              localStorage.removeItem('terra_backend_url');
            }
          }
          if (socketIo) socketIo.disconnect();
          if (pollingPromise) { $interval.cancel(pollingPromise); pollingPromise = null; }
          if (simIntervalPromise) { $interval.cancel(simIntervalPromise); simIntervalPromise = null; }
          initRealtimeStream();
        };

        // Bootstrap on startup
        initRealtimeStream();

        return service;
      }
    ]);
})();
