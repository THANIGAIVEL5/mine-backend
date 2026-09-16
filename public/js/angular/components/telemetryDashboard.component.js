/**
 * Telemetry Dashboard Component - Reactive HUD Geotechnical Telemetry & AI Tactical Audio
 * SIH 2026 - TERRA-PULSE OS
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .controller('TelemetryDashboardController', [
      '$scope',
      '$interval',
      '$timeout',
      'telemetryService',
      'audioService',
      'themeService',
      function ($scope, $interval, $timeout, telemetryService, audioService, themeService) {
        var vm = this;

        vm.activeNode = 3;
        vm.currentOptic = 'normal';
        vm.isProtocolLayerVisible = true;
        vm.isEvacModalOpen = false;
        vm.anomalyAcknowledged = false;
        vm.liveClock = '';
        vm.headerClock = '';
        vm.isFlyingThrough = false;
        vm.isReplayMode = false;
        vm.replayIndex = 19;

        // Layout Switcher
        vm.layout = 'standard'; // 'standard' | 'cinema' | 'wall'
        vm.setLayout = function (mode) {
          vm.layout = mode;
          audioService.playBeep(640, 0.06, 'sine');
        };

        // DGMS Audit Report Modal
        vm.isAuditModalOpen = false;
        vm.officerName = '';
        vm.officerBadge = '';
        vm.officerAction = '';
        vm.auditTimestamp = '';

        vm.openAuditModal = function () {
          vm.isAuditModalOpen = true;
          vm.auditTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
          audioService.playBeep(780, 0.07);
        };
        vm.closeAuditModal = function () {
          vm.isAuditModalOpen = false;
        };
        vm.printAuditReport = function () {
          vm.closeAuditModal();
          $timeout(function () { window.print(); }, 120);
        };

        // Miner Personnel Tracking
        vm.personnel = [
          { sector: 'Shaft #2 Collar',    zone: 'SEC-1', count: 6,  critical: false },
          { sector: 'Overburden Bench',   zone: 'SEC-2', count: 5,  critical: false },
          { sector: 'Pillar 4B Stope',    zone: 'SEC-4B',count: 8,  critical: true  },
          { sector: 'Sump Sub-Level',     zone: 'SEC-3', count: 3,  critical: false },
          { sector: 'Haulage Drift #12',  zone: 'SEC-5', count: 4,  critical: false },
        ];
        vm.totalMiners = vm.personnel.reduce(function (s, p) { return s + p.count; }, 0);
        vm.evacuatedCount = 0;
        vm.evacuationInProgress = false;
        vm.startEvacuationHeadcount = function () {
          vm.evacuationInProgress = true;
          vm.evacuatedCount = 0;
          var timer = $interval(function () {
            if (vm.evacuatedCount < vm.totalMiners) {
              vm.evacuatedCount += Math.floor(Math.random() * 3) + 1;
              if (vm.evacuatedCount > vm.totalMiners) vm.evacuatedCount = vm.totalMiners;
            } else {
              $interval.cancel(timer);
            }
          }, 800);
        };

        // Theme management
        Object.defineProperty(vm, 'isDark', {
          get: function () {
            return themeService.isDark;
          }
        });

        vm.toggleTheme = function () {
          themeService.toggleTheme();
          audioService.playBeep(720, 0.08);
        };

        // Rolling metric history for sparkline charts (20 rolling samples)
        vm.pitchHistory = [3.2, 3.3, 3.4, 3.5, 3.4, 3.6, 3.7, 3.5, 3.8, 3.9, 3.7, 3.8, 3.84, 3.82, 3.84];
        vm.rmsHistory = [0.11, 0.12, 0.13, 0.12, 0.14, 0.15, 0.16, 0.15, 0.14, 0.15, 0.15, 0.16, 0.15];
        vm.coHistory = [8.5, 9.0, 9.2, 10.1, 10.5, 11.0, 11.4, 12.0, 11.8, 12.2, 12.0];
        vm.sumpHistory = [28.0, 29.5, 30.0, 31.2, 32.0, 33.1, 33.8, 34.0, 34.2, 34.0];

        vm.nodeNames = [
          'NODE-01 (Shaft #2)',
          'NODE-02 (Overburden)',
          'NODE-03 (Pillar 4B Stope)',
          'NODE-04 (Sump Basin)',
          'NODE-05 (Haulage Drift #12 - Online)'
        ];

        vm.nodes = [
          { id: 1, name: 'NODE-01', location: 'Shaft #2 Collar',   status: 'ONLINE',   ping: '14ms', statusClass: 'text-emerald-400',                     battery: 4.12, batPct: 92, packetLoss: 0.1, humidity: 68 },
          { id: 2, name: 'NODE-02', location: 'Overburden Bench',  status: 'ONLINE',   ping: '18ms', statusClass: 'text-amber-400',                       battery: 3.88, batPct: 74, packetLoss: 0.4, humidity: 72 },
          { id: 3, name: 'NODE-03', location: 'Pillar 4B Stope',   status: 'CRITICAL', ping: '12ms', statusClass: 'text-rose-500 font-bold animate-pulse', battery: 3.72, batPct: 58, packetLoss: 1.2, humidity: 81 },
          { id: 4, name: 'NODE-04', location: 'Sump Sub-Level',    status: 'ONLINE',   ping: '22ms', statusClass: 'text-cyan-400',                        battery: 4.01, batPct: 84, packetLoss: 0.2, humidity: 89 },
          { id: 5, name: 'NODE-05', location: 'Haulage Drift #12', status: 'ONLINE',   ping: '16ms', statusClass: 'text-teal-400',                        battery: 3.94, batPct: 80, packetLoss: 0.3, humidity: 75 }
        ];

        vm.getBatBarClass = function (pct) {
          if (pct >= 75) return '';
          if (pct >= 45) return 'med';
          return 'low';
        };

        // Bind directly to telemetry service
        vm.telemetry = telemetryService.data;

        // Sound state
        Object.defineProperty(vm, 'soundEnabled', {
          get: function () {
            return audioService.soundEnabled;
          }
        });

        vm.toggleSound = function () {
          var state = audioService.toggleSound();
          if (state) {
            audioService.playBeep(980, 0.1, 'sine');
          }
        };

        Object.defineProperty(vm, 'connected', {
          get: function () {
            return telemetryService.connected;
          }
        });

        Object.defineProperty(vm, 'connectionType', {
          get: function () {
            return telemetryService.connectionType;
          }
        });

        Object.defineProperty(vm, 'latency', {
          get: function () {
            return telemetryService.latency;
          }
        });

        Object.defineProperty(vm, 'rssi', {
          get: function () {
            return telemetryService.rssi;
          }
        });

        Object.defineProperty(vm, 'packetRate', {
          get: function () {
            return telemetryService.packetRate;
          }
        });

        Object.defineProperty(vm, 'activeNodeTitle', {
          get: function () {
            return 'Active Telemetry Stream: ' + vm.nodeNames[vm.activeNode - 1];
          }
        });

        // Listen for new telemetry updates to feed rolling sparklines
        telemetryService.onUpdate(function (d) {
          if (vm.isReplayMode) return;
          if (d.pitch !== undefined) {
            vm.pitchHistory.push(Number(d.pitch));
            if (vm.pitchHistory.length > 25) vm.pitchHistory.shift();
          }
          if (d.rms !== undefined) {
            vm.rmsHistory.push(Number(d.rms));
            if (vm.rmsHistory.length > 25) vm.rmsHistory.shift();
          }
          if (d.co !== undefined) {
            vm.coHistory.push(Number(d.co));
            if (vm.coHistory.length > 25) vm.coHistory.shift();
          }
          if (d.sump !== undefined) {
            vm.sumpHistory.push(Number(d.sump));
            if (vm.sumpHistory.length > 25) vm.sumpHistory.shift();
          }
        });

        // Dynamic visual computations
        vm.getAqiColorClass = function (aqi) {
          if (aqi <= 50) return 'text-emerald-700 dark:text-emerald-400';
          if (aqi <= 100) return 'text-amber-600 dark:text-yellow-400';
          if (aqi <= 150) return 'text-orange-600 dark:text-amber-500';
          return 'text-rose-700 dark:text-rose-500';
        };

        vm.getAqiBand = function (aqi) {
          if (aqi <= 50) return 'BAND: GOOD';
          if (aqi <= 100) return 'BAND: MODERATE';
          if (aqi <= 150) return 'BAND: UNHEALTHY SENSITIVE';
          return 'BAND: HAZARDOUS';
        };

        vm.getAqiOffset = function (aqi) {
          var pct = Math.min(100, Math.max(0, (aqi / 200) * 100));
          return 138.2 - (138.2 * pct) / 100;
        };

        vm.getHorizonTransform = function () {
          var pitch = vm.telemetry.pitch || 0;
          var roll = vm.telemetry.roll || 0;
          var translateY = pitch * 4.2;
          return 'rotate(' + roll + ' 100 100) translate(0, ' + translateY + ')';
        };

        vm.getIsoGaugeOffset = function () {
          var score = vm.telemetry.isoScore || 88;
          return 125.66 * (1 - score / 100);
        };

        // Actions
        vm.selectNode = function (nodeNum) {
          vm.activeNode = nodeNum;
          audioService.playSonarPing();
          $scope.$broadcast('cesium:flyToNode', nodeNum);
        };

        vm.setOptic = function (mode) {
          vm.currentOptic = mode;
          audioService.playBeep(640, 0.08, 'square');
          $scope.$broadcast('cesium:setOptic', mode);
        };

        vm.toggleProtocolLayer = function () {
          vm.isProtocolLayerVisible = !vm.isProtocolLayerVisible;
          audioService.playBeep(520, 0.06, 'triangle');
          $scope.$broadcast('cesium:toggleProtocol', vm.isProtocolLayerVisible);
        };

        // Autonomous Drone / Shaft Fly-through Tour
        vm.startShaftFlyThrough = function () {
          vm.isFlyingThrough = true;
          audioService.speak('Autonomous subterranean drone surveillance flight path engaged.', true);
          $scope.$broadcast('cesium:startFlyThrough');
          $timeout(function () {
            vm.isFlyingThrough = false;
          }, 18000);
        };

        // Black Box Incident Playback Mode
        vm.toggleReplay = function () {
          vm.isReplayMode = !vm.isReplayMode;
          if (vm.isReplayMode) {
            audioService.speak('Entering forensic black box incident playback mode.');
          } else {
            audioService.speak('Resuming live real-time ingestion.');
          }
        };

        vm.scrubReplay = function (val) {
          vm.replayIndex = val;
          // Interpolate historical incident snapshot
          var fraction = val / 20;
          vm.telemetry.pitch = Number((1.5 + fraction * 4.8).toFixed(2));
          vm.telemetry.rms = Number((0.08 + fraction * 0.85).toFixed(2));
          vm.telemetry.sump = Number((20 + fraction * 45).toFixed(1));
          vm.telemetry.co = Number((5 + fraction * 22).toFixed(1));
        };

        // Statutory DGMS Regulation 124 Evacuation Trigger
        vm.openEvacModal = function () {
          vm.isEvacModalOpen = true;
          audioService.startSiren();
          audioService.speak('Critical hazard trigger. Statutory evacuation protocol initiated under DGMS Regulation 124.', true);
        };

        vm.closeEvacModal = function () {
          vm.isEvacModalOpen = false;
          audioService.stopSiren();
        };

        vm.confirmEvacDispatch = function () {
          audioService.stopSiren();
          audioService.speak('Evacuation order broadcast to all underground miners and surface sirens confirmed.');
          alert('DGMS REGULATION 124 EVACUATION DIRECTIVE CONFIRMED & BROADCAST TO RADIO COMM CHANNEL 4 & UNDERGROUND REPEATERS');
          vm.closeEvacModal();
        };

        vm.recenterMap = function () {
          audioService.playBeep(720, 0.08);
          $scope.$broadcast('cesium:recenter');
        };

        vm.resetGlobe = function () {
          audioService.playBeep(480, 0.08);
          $scope.$broadcast('cesium:reset');
        };

        vm.acknowledgeAnomaly = function () {
          vm.anomalyAcknowledged = true;
          audioService.playBeep(880, 0.1);
        };

        // Real-time Clock Updater
        function updateClock() {
          var d = new Date();
          var timeStr = d.toLocaleTimeString('en-US', { hour12: false }) + ' IST';
          vm.liveClock = timeStr;
          vm.headerClock = timeStr + ' UTC+5:30 REAL-TIME';
        }
        updateClock();
        var clockTimer = $interval(updateClock, 1000);

        $scope.$on('$destroy', function () {
          if (clockTimer) $interval.cancel(clockTimer);
          audioService.stopSiren();
        });

        // Command Palette event listeners
        $scope.$on('cmd:droneTour',    function () { vm.startShaftFlyThrough(); });
        $scope.$on('cmd:toggleReplay', function () { vm.toggleReplay(); });
        $scope.$on('cmd:openEvac',     function () { vm.openEvacModal(); });
        $scope.$on('cmd:toggleProtocol', function () { vm.toggleProtocolLayer(); });
        $scope.$on('cmd:openAudit',    function () { $scope.$applyAsync(function () { vm.openAuditModal(); }); });
        $scope.$on('cmd:setLayout',    function (e, mode) { $scope.$applyAsync(function () { vm.setLayout(mode); }); });
        $scope.$on('cmd:selectNode',   function (e, id) { $scope.$applyAsync(function () { vm.selectNode(id); }); });

        // Global compatibility helpers for HTML links
        window.openEvacModal = function () {
          $scope.$applyAsync(function () {
            vm.openEvacModal();
          });
        };
        window.openAuditModal = function () {
          $scope.$applyAsync(function () {
            vm.openAuditModal();
          });
        };
        window.closeEvacModal = function () {
          $scope.$applyAsync(function () {
            vm.closeEvacModal();
          });
        };
        window.setOptic = function (mode) {
          $scope.$applyAsync(function () {
            vm.setOptic(mode);
          });
        };
        window.selectNode = function (nodeNum) {
          $scope.$applyAsync(function () {
            vm.selectNode(nodeNum);
          });
        };
        window.toggleProtocolLayer = function () {
          $scope.$applyAsync(function () {
            vm.toggleProtocolLayer();
          });
        };
        window.triggerEvacuationProtocol = function () {
          $scope.$applyAsync(function () {
            vm.openEvacModal();
          });
        };
        window.recenterMap = function () {
          $scope.$applyAsync(function () {
            vm.recenterMap();
          });
        };
        window.resetGlobe = function () {
          $scope.$applyAsync(function () {
            vm.resetGlobe();
          });
        };
      }
    ]);
})();
