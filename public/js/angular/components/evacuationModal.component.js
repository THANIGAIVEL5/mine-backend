/**
 * Evacuation Modal Component - Statutory DGMS Regulation 124 Emergency Protocol
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .component('evacuationModal', {
      bindings: {
        isOpen: '=',
        telemetry: '<',
        onClose: '&',
        onConfirm: '&'
      },
      template: [
        '<div ng-show="$ctrl.isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-md p-4 animate-fadeIn">',
        '  <div class="hud-bracket-danger relative w-full max-w-xl bg-white dark:bg-[#0b0608] border-2 border-rose-500 rounded-lg p-6 shadow-2xl dark:shadow-[0_0_50px_rgba(239,68,68,0.7)] klaxon-active">',
        '    <div class="flex items-start justify-between border-b border-rose-200 dark:border-rose-500/40 pb-4">',
        '      <div class="flex items-center gap-3">',
        '        <div class="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-sm dark:shadow-[0_0_20px_rgba(239,68,68,0.5)]">',
        '          <span class="material-symbols-outlined text-[28px] animate-ping absolute opacity-50">warning</span>',
        '          <span class="material-symbols-outlined text-[28px]">warning</span>',
        '        </div>',
        '        <div>',
        '          <div class="font-[\'JetBrains_Mono\'] text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest">',
        '            DGMS STATUTORY CMR-2017 REGULATION 124',
        '          </div>',
        '          <h2 class="font-[\'Space_Grotesk\'] text-[20px] text-slate-900 dark:text-white font-bold tracking-tight">',
        '            MANDATORY MINE EVACUATION ORDER ISSUED',
        '          </h2>',
        '        </div>',
        '      </div>',
        '      <button ng-click="$ctrl.dismiss()" class="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white p-1 rounded transition cursor-pointer">',
        '        <span class="material-symbols-outlined text-[24px]">close</span>',
        '      </button>',
        '    </div>',
        '    <div class="mt-5 space-y-4 font-[\'Space_Grotesk\'] text-slate-700 dark:text-zinc-200">',
        '      <div class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 p-3 rounded">',
        '        <div class="flex items-center justify-between font-[\'JetBrains_Mono\'] text-[11px]">',
        '          <span class="text-rose-700 dark:text-rose-300 font-bold">TARGET GEOMETRY: CHASNALA SECTOR 4B STOPE</span>',
        '          <span class="text-white font-mono bg-rose-600 px-2 py-0.5 rounded font-bold">HAZARD LEVEL IV</span>',
        '        </div>',
        '        <p class="text-[13px] text-slate-800 dark:text-white mt-1.5 font-medium leading-relaxed">',
        '          Geotechnical sensor Node-03 has detected acute pillar tilt excursion (+{{ $ctrl.telemetry.pitch | number:2 }}° Δ) and continuous high-frequency vibration harmonics ({{ $ctrl.telemetry.fft | number:1 }}Hz) in Sector 4B. Under Regulation 124 of Coal Mines Regulations 2017, all subsurface operatives within the 220m critical perimeter are directed to evacuate immediately.',
        '        </p>',
        '      </div>',
        '      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 font-[\'JetBrains_Mono\'] text-[11px]">',
        '        <div class="bg-emerald-50/70 dark:bg-[#0e171f] border border-emerald-200 dark:border-emerald-500/40 p-3 rounded flex flex-col gap-1">',
        '          <span class="text-emerald-700 dark:text-emerald-400 font-bold">PRIMARY ESCAPE ROUTE:</span>',
        '          <span class="text-slate-900 dark:text-white font-semibold text-[12px]">Corridor Alpha (Incline Drift)</span>',
        '          <span class="text-slate-500 dark:text-zinc-400 text-[10px]">Destination: Surface Incline Portal Muster Ground (CLEAR - 100%)</span>',
        '        </div>',
        '        <div class="bg-cyan-50/70 dark:bg-[#0e171f] border border-cyan-200 dark:border-cyan-500/40 p-3 rounded flex flex-col gap-1">',
        '          <span class="text-cyan-700 dark:text-cyan-400 font-bold">SECONDARY ESCAPE ROUTE:</span>',
        '          <span class="text-slate-900 dark:text-white font-semibold text-[12px]">Corridor Beta (Shaft #2 Hoist)</span>',
        '          <span class="text-slate-500 dark:text-zinc-400 text-[10px]">Destination: Pithead Cage #2 (STANDBY / 24 Miner Cap)</span>',
        '        </div>',
        '      </div>',
        '      <div class="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 p-3 rounded font-[\'JetBrains_Mono\'] text-[11px] space-y-1 text-slate-700 dark:text-zinc-300">',
        '        <div class="flex items-center justify-between">',
        '          <span>Subterranean Operatives Logged:</span>',
        '          <span class="text-slate-900 dark:text-white font-bold">14 Personnel</span>',
        '        </div>',
        '        <div class="flex items-center justify-between">',
        '          <span>Acoustic Surface Klaxon:</span>',
        '          <span class="text-rose-600 dark:text-rose-400 font-bold">ACTIVATED (110 dB BEACON)</span>',
        '        </div>',
        '        <div class="flex items-center justify-between">',
        '          <span>DGMS Dhanbad Central Safety Office:</span>',
        '          <span class="text-emerald-600 dark:text-emerald-400 font-bold">AUTOMATIC DISPATCH CONFIRMED</span>',
        '        </div>',
        '        <div class="flex items-center justify-between">',
        '          <span>Mines Rescue Station (CMR-MRS Sindri):</span>',
        '          <span class="text-emerald-600 dark:text-emerald-400 font-bold">RESCUE TEAM ALERTED</span>',
        '        </div>',
        '      </div>',
        '    </div>',
        '    <div class="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-rose-200 dark:border-rose-500/30 font-[\'JetBrains_Mono\'] text-[11px]">',
        '      <button ng-click="$ctrl.dismiss()" class="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-white/20 uppercase font-bold transition cursor-pointer">',
        '        DISMISS HUD',
        '      </button>',
        '      <button ng-click="$ctrl.confirm()" class="px-5 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase transition shadow-lg dark:shadow-[0_0_20px_rgba(239,68,68,0.7)] cursor-pointer">',
        '        CONFIRM DISPATCH EXECUTION',
        '      </button>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join(''),
      controller: function () {
        var ctrl = this;
        ctrl.dismiss = function () {
          ctrl.isOpen = false;
          if (ctrl.onClose) ctrl.onClose();
        };
        ctrl.confirm = function () {
          alert('EVACUATION DIRECTIVE CONFIRMED & RE-TRANSMITTED TO RADIO COMM CHANNEL 4');
          ctrl.dismiss();
          if (ctrl.onConfirm) ctrl.onConfirm();
        };
      }
    });
})();
