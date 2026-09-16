/**
 * Explainable ML Component - TreeSHAP & Interactive What-If Stress Simulator
 * SIH 2026 - TERRA-PULSE OS
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .controller('ExplainableMlController', [
      '$scope',
      '$interval',
      'telemetryService',
      'audioService',
      'themeService',
      function ($scope, $interval, telemetryService, audioService, themeService) {
        var ml = this;

        ml.activeTab = 'insar';
        ml.latency = '18ms';
        ml.bayesConf = '94.2%';
        ml.aiInsightDisplay = '[TERRA-SENTINEL MASTER AI] Telemetry baseline nominal. All 5 sensor nodes synchronized.';

        ml.isEvacModalOpen = false;
        ml.isPumpActive = false;
        ml.dossierSent = false;

        // Language toggle (English / Hindi)
        ml.lang = 'en';
        ml.toggleLang = function () {
          ml.lang = ml.lang === 'en' ? 'hi' : 'en';
          audioService.playBeep(680, 0.05);
        };
        ml.t = function (en, hi) {
          return ml.lang === 'hi' ? hi : en;
        };

        // Officer Chain-of-Custody Acknowledgement
        ml.isOfficerAckOpen = false;
        ml.officerName = '';
        ml.officerBadge = '';
        ml.officerMitigation = '';
        ml.officerAcknowledged = false;
        ml.openOfficerAck = function () {
          ml.isOfficerAckOpen = true;
          audioService.playBeep(780, 0.06);
        };
        ml.closeOfficerAck = function () {
          ml.isOfficerAckOpen = false;
        };
        ml.submitOfficerAck = function () {
          if (!ml.officerName) return;
          ml.officerAcknowledged = true;
          ml.isOfficerAckOpen = false;
          audioService.playBeep(880, 0.1);
          audioService.speak('Anomaly acknowledgement recorded by ' + ml.officerName + '.');
        };

        // Theme management
        Object.defineProperty(ml, 'isDark', {
          get: function () {
            return themeService.isDark;
          }
        });

        ml.toggleTheme = function () {
          themeService.toggleTheme();
          audioService.playBeep(720, 0.08);
        };

        // Interactive What-If Stress Simulator State
        ml.whatIf = {
          poreRelief: 20,       // % relief from dewatering pumps
          propReinforce: 35,    // % support chock pre-load boost
          gasDrain: 15          // % methane drainage rate
        };

        ml.tabTitles = {
          insar: 'Subsurface Strata Stress Vector & Void Delamination (InSAR/GNSS)',
          strain: 'Zone SEC-4B High-Resolution Strain Gauge Network',
          hydro: 'Hydrostatic Pore Pressure vs Sump Delamination Interface',
          seismic: 'Acoustic Emission & FFT Micro-Seismic Resonances'
        };

        ml.telemetry = telemetryService.data;

        ml.getProjectionTitle = function () {
          return ml.tabTitles[ml.activeTab] || ml.tabTitles.insar;
        };

        ml.selectTab = function (tabKey) {
          ml.activeTab = tabKey;
          audioService.playBeep(780, 0.06);
        };

        // Simulated Subsidence Risk & TTF under What-if adjustments
        ml.getSimulatedRisk = function () {
          var base = 74.5;
          var relief = (ml.whatIf.poreRelief * 0.28) + (ml.whatIf.propReinforce * 0.32) + (ml.whatIf.gasDrain * 0.12);
          var finalRisk = Math.max(12.0, base - relief);
          return finalRisk.toFixed(1);
        };

        ml.getSimulatedTTF = function () {
          var baseTTF = 4.2; // 4.2 hours baseline
          var extension = (ml.whatIf.poreRelief * 0.08) + (ml.whatIf.propReinforce * 0.12) + (ml.whatIf.gasDrain * 0.03);
          return (baseTTF + extension).toFixed(1);
        };

        ml.resetWhatIf = function () {
          ml.whatIf.poreRelief = 0;
          ml.whatIf.propReinforce = 0;
          ml.whatIf.gasDrain = 0;
          ml.isPumpActive = false;
          audioService.playBeep(440, 0.08);
        };

        // Actions
        ml.togglePump = function () {
          ml.isPumpActive = !ml.isPumpActive;
          if (ml.isPumpActive) {
            ml.whatIf.poreRelief = 50;
            audioService.speak('High capacity 500 GPM dewatering pump engaged.');
          } else {
            ml.whatIf.poreRelief = 10;
            audioService.speak('Sump pump returned to automatic float regulation.');
          }
          audioService.playBeep(880, 0.1);
        };

        ml.transmitDossier = function () {
          ml.dossierSent = true;
          audioService.speak('DGMS Form IV incident dossier serialized and transmitted to Mines Safety Inspectorate.');
          alert('DGMS Form IV serialized dossier #9928-DG successfully transmitted to Directorate General of Mines Safety (Dhanbad HQ).');
        };

        ml.openEvacModal = function () {
          ml.isEvacModalOpen = true;
          audioService.startSiren();
          audioService.speak('Statutory evacuation protocol initiated under DGMS Regulation 124.', true);
        };

        ml.closeEvacModal = function () {
          ml.isEvacModalOpen = false;
          audioService.stopSiren();
        };

        ml.confirmEvacDispatch = function () {
          ml.closeEvacModal();
          alert('EVACUATION DIRECTIVE CONFIRMED & BROADCAST TO UNDERGROUND REPEATERS.');
        };

        // TreeSHAP dynamic calculations
        ml.getShap1Width = function () {
          var pitch = Math.abs(ml.telemetry.pitch || 3.84);
          var reduction = ml.whatIf.propReinforce * 0.15;
          return Math.min(100, Math.max(15, 38.4 + pitch * 5 - reduction)) + '%';
        };

        ml.getShap2Width = function () {
          var rms = ml.telemetry.rms || 0.15;
          var reduction = ml.whatIf.propReinforce * 0.12;
          return Math.min(100, Math.max(12, 27.1 + rms * 50 - reduction)) + '%';
        };

        ml.getShap3Width = function () {
          var co = ml.telemetry.co || 12.0;
          var reduction = ml.whatIf.gasDrain * 0.15;
          return Math.min(100, Math.max(8, 14.8 + co / 2 - reduction)) + '%';
        };

        // Zone Max Flexure
        ml.getZoneMaxFlexure = function () {
          var disp = ml.telemetry.disp || 0.15;
          var reduction = (ml.whatIf.propReinforce * 0.04);
          return Math.max(2.5, 14.18 + disp * 5 - reduction).toFixed(2);
        };

        // SVG Delamination Polygon Transform
        ml.getDelaminationTransform = function () {
          var disp = ml.telemetry.disp || 0.15;
          var strainScale = Math.max(1.0, 1.0 + disp * 0.5 - (ml.whatIf.propReinforce * 0.003));
          var tx = -(strainScale - 1) * 370;
          var ty = -(strainScale - 1) * 210;
          return 'scale(' + strainScale + ') translate(' + tx + ', ' + ty + ')';
        };

        // Typewriter animation for Master AI Insight
        var typewriterInterval = null;
        var lastAiText = null;

        function updateTypewriter(newText) {
          if (!newText || newText === lastAiText) return;
          lastAiText = newText;
          if (typewriterInterval) $interval.cancel(typewriterInterval);

          ml.aiInsightDisplay = '';
          var charIdx = 0;
          typewriterInterval = $interval(
            function () {
              if (charIdx < newText.length) {
                ml.aiInsightDisplay += newText.charAt(charIdx);
                charIdx++;
              } else {
                $interval.cancel(typewriterInterval);
              }
            },
            25,
            newText.length
          );
        }

        $scope.$watch(
          function () {
            return telemetryService.data.aiText;
          },
          function (newVal) {
            if (newVal) updateTypewriter(newVal);
          }
        );

        // Header State Integration
        ml.nodes = [
          { id: 1, name: 'NODE-01', location: 'Shaft #2 Collar', status: 'ONLINE' },
          { id: 2, name: 'NODE-02', location: 'Overburden Bench', status: 'ONLINE' },
          { id: 3, name: 'NODE-03', location: 'Pillar 4B Stope', status: 'CRITICAL' },
          { id: 4, name: 'NODE-04', location: 'Sump Sub-Level', status: 'ONLINE' },
          { id: 5, name: 'NODE-05', location: 'Haulage Drift #12', status: 'ONLINE' }
        ];

        Object.defineProperty(ml, 'connected', {
          get: function () {
            return telemetryService.connected;
          }
        });

        Object.defineProperty(ml, 'connectionType', {
          get: function () {
            return telemetryService.connectionType;
          }
        });

        Object.defineProperty(ml, 'soundEnabled', {
          get: function () {
            return audioService.soundEnabled;
          }
        });

        ml.toggleSound = function () {
          audioService.toggleSound();
        };

        // Real-time Clock Updater
        function updateClock() {
          var d = new Date();
          var timeStr = d.toLocaleTimeString('en-US', { hour12: false }) + ' IST';
          ml.liveClock = timeStr;
        }
        updateClock();
        var clockTimer = $interval(updateClock, 1000);

        $scope.$on('$destroy', function () {
          if (typewriterInterval) $interval.cancel(typewriterInterval);
          if (clockTimer) $interval.cancel(clockTimer);
          audioService.stopSiren();
        });

        // Command Palette event listeners
        $scope.$on('cmd:openEvac',  function () { $scope.$applyAsync(function () { ml.openEvacModal(); }); });
        $scope.$on('cmd:setLayout', function () { /* layout managed per-page */ });
      }
    ]);
})();
