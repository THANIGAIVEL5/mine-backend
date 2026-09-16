/**
 * Command Palette Component — Ctrl+K Spotlight for TERRA-PULSE OS
 * SIH 2026 — Quick-action modal for navigation, controls, and tactical ops
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .controller('CommandPaletteController', [
      '$scope',
      '$document',
      '$timeout',
      'audioService',
      'themeService',
      function ($scope, $document, $timeout, audioService, themeService) {
        var cp = this;

        cp.isOpen = false;
        cp.query = '';
        cp.activeIndex = 0;

        var ALL_COMMANDS = [
          { icon: 'public',          label: 'Go to Live Telemetry & GIS',          category: 'NAV',      action: function () { window.location.href = '/'; } },
          { icon: 'schema',          label: 'Go to Explainable ML & Risk',          category: 'NAV',      action: function () { window.location.href = '/explainable-ml'; } },
          { icon: 'my_location',     label: '3D Target Focus — Pillar 4B',          category: 'MAP',      action: function () { $scope.$broadcast('cesium:recenter'); } },
          { icon: 'public',          label: 'Reset Globe to Orbital View',          category: 'MAP',      action: function () { $scope.$broadcast('cesium:reset'); } },
          { icon: 'flight_takeoff',  label: 'Engage Autonomous Drone Tour',         category: 'DRONE',    action: function () { $scope.$broadcast('cmd:droneTour'); } },
          { icon: 'history',         label: 'Toggle Forensic Black Box Replay',     category: 'REPLAY',   action: function () { $scope.$broadcast('cmd:toggleReplay'); } },
          { icon: 'campaign',        label: 'Trigger DGMS Evacuation Protocol',     category: 'CRITICAL', action: function () { $scope.$broadcast('cmd:openEvac'); } },
          { icon: 'shield',          label: 'Toggle DGMS Protocol Layer',           category: 'MAP',      action: function () { $scope.$broadcast('cmd:toggleProtocol'); } },
          { icon: 'dark_mode',       label: 'Toggle Light / Dark Theme',            category: 'UI',       action: function () { themeService.toggleTheme(); audioService.playBeep(720, 0.08); } },
          { icon: 'volume_up',       label: 'Toggle Tactical Audio / Sirens',       category: 'AUDIO',    action: function () { audioService.toggleSound(); } },
          { icon: 'visibility',      label: 'Optical Mode — Standard',              category: 'OPTICS',   action: function () { $scope.$broadcast('cesium:setOptic', 'normal'); } },
          { icon: 'thermostat',      label: 'Optical Mode — FLIR Thermal',          category: 'OPTICS',   action: function () { $scope.$broadcast('cesium:setOptic', 'flir'); } },
          { icon: 'brightness_high', label: 'Optical Mode — Night Vision (NVG)',    category: 'OPTICS',   action: function () { $scope.$broadcast('cesium:setOptic', 'nvg'); } },
          { icon: 'tv',              label: 'Optical Mode — CRT Phosphor',          category: 'OPTICS',   action: function () { $scope.$broadcast('cesium:setOptic', 'crt'); } },
          { icon: 'grid_view',       label: 'Layout — Standard HUD',               category: 'LAYOUT',   action: function () { $scope.$broadcast('cmd:setLayout', 'standard'); } },
          { icon: 'fullscreen',      label: 'Layout — God\'s Eye Cinema Mode',      category: 'LAYOUT',   action: function () { $scope.$broadcast('cmd:setLayout', 'cinema'); } },
          { icon: 'dashboard',       label: 'Layout — Telemetry Wall (All Nodes)', category: 'LAYOUT',   action: function () { $scope.$broadcast('cmd:setLayout', 'wall'); } },
          { icon: 'sensors',         label: 'Select Node-01 (Shaft #2 Collar)',     category: 'NODE',     action: function () { $scope.$broadcast('cmd:selectNode', 1); } },
          { icon: 'sensors',         label: 'Select Node-02 (Overburden Bench)',    category: 'NODE',     action: function () { $scope.$broadcast('cmd:selectNode', 2); } },
          { icon: 'sensors',         label: 'Select Node-03 (Pillar 4B Stope)',     category: 'NODE',     action: function () { $scope.$broadcast('cmd:selectNode', 3); } },
          { icon: 'sensors',         label: 'Select Node-04 (Sump Sub-Level)',      category: 'NODE',     action: function () { $scope.$broadcast('cmd:selectNode', 4); } },
          { icon: 'sensors',         label: 'Select Node-05 (Haulage Drift #12)',   category: 'NODE',     action: function () { $scope.$broadcast('cmd:selectNode', 5); } },
          { icon: 'print',           label: 'Generate DGMS Audit Report (PDF)',     category: 'REPORT',   action: function () { $scope.$broadcast('cmd:openAudit'); } },
          { icon: 'cloud_sync',      label: 'Configure Live Cloud Backend URL',     category: 'CLOUD',    action: function () { var current = localStorage.getItem('terra_backend_url') || ''; var input = prompt('Enter your Live Cloud Backend URL (e.g. Cloudflare Tunnel, Railway, Cloud Run, Render):\nLeave blank to reset.', current); if (input !== null) { input = input.trim().replace(/\/$/, ''); if (input) { localStorage.setItem('terra_backend_url', input); } else { localStorage.removeItem('terra_backend_url'); } alert(input ? 'Live Cloud Backend set to: ' + input : 'Using default backend settings.'); window.location.reload(); } } },
          { icon: 'terminal',        label: 'Open AI Command Terminal',             category: 'AI',       action: function () { var btn = document.getElementById('chat-toggle-btn'); if (btn) btn.click(); } },
        ];

        cp.filtered = ALL_COMMANDS.slice();

        cp.filterCommands = function () {
          var q = (cp.query || '').toLowerCase().trim();
          if (!q) {
            cp.filtered = ALL_COMMANDS.slice();
          } else {
            cp.filtered = ALL_COMMANDS.filter(function (cmd) {
              return cmd.label.toLowerCase().indexOf(q) > -1 ||
                     cmd.category.toLowerCase().indexOf(q) > -1;
            });
          }
          cp.activeIndex = 0;
        };

        cp.open = function () {
          cp.isOpen = true;
          cp.query = '';
          cp.filtered = ALL_COMMANDS.slice();
          cp.activeIndex = 0;
          $timeout(function () {
            var inp = document.getElementById('cmd-palette-input');
            if (inp) inp.focus();
          }, 60);
          audioService.playBeep(880, 0.06, 'sine');
        };

        cp.close = function () {
          cp.isOpen = false;
          cp.query = '';
          audioService.playBeep(440, 0.04, 'sine');
        };

        cp.execute = function (cmd) {
          if (!cmd) return;
          cp.close();
          $timeout(function () {
            cmd.action();
          }, 80);
        };

        cp.getCategoryColor = function (cat) {
          var map = {
            'CRITICAL': 'text-rose-400',
            'NAV':      'text-sky-400',
            'MAP':      'text-cyan-400',
            'DRONE':    'text-cyan-300',
            'REPLAY':   'text-amber-400',
            'OPTICS':   'text-purple-400',
            'LAYOUT':   'text-teal-400',
            'NODE':     'text-emerald-400',
            'AUDIO':    'text-orange-400',
            'REPORT':   'text-indigo-400',
            'AI':       'text-pink-400',
            'UI':       'text-slate-300',
          };
          return map[cat] || 'text-slate-400';
        };

        // Global keyboard listener — Ctrl+K or Cmd+K
        function onKeydown(e) {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            $scope.$applyAsync(function () {
              if (cp.isOpen) { cp.close(); } else { cp.open(); }
            });
          }
          if (!cp.isOpen) return;
          if (e.key === 'Escape') {
            $scope.$applyAsync(function () { cp.close(); });
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            $scope.$applyAsync(function () {
              cp.activeIndex = Math.min(cp.activeIndex + 1, cp.filtered.length - 1);
            });
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            $scope.$applyAsync(function () {
              cp.activeIndex = Math.max(cp.activeIndex - 1, 0);
            });
          } else if (e.key === 'Enter') {
            $scope.$applyAsync(function () {
              cp.execute(cp.filtered[cp.activeIndex]);
            });
          }
        }

        $document[0].addEventListener('keydown', onKeydown);

        $scope.$on('$destroy', function () {
          $document[0].removeEventListener('keydown', onKeydown);
        });

        // Expose globally for btn triggers
        window.openCommandPalette = function () {
          $scope.$applyAsync(function () { cp.open(); });
        };
      }
    ]);
})();
