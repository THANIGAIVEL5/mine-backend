/**
 * Vibration Oscilloscope Directive - Renders Real-time Geotechnical Micro-Seismic Waveform
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .directive('vibrationOscilloscope', [
      '$interval',
      'telemetryService',
      function ($interval, telemetryService) {
        return {
          restrict: 'A',
          link: function (scope, element) {
            var waveOffset = 0;
            var waveGlow = element[0].querySelector('#wave-glow');
            var waveCore = element[0].querySelector('#wave-core');
            var dot = element[0].querySelector('#wave-peak-dot');
            var line = element[0].querySelector('#wave-peak-line');
            var text = element[0].querySelector('#wave-peak-text');

            var animTimer = $interval(function () {
              waveOffset -= 5;
              var pathData = 'M 0,80 ';
              var maxAmp = 0;
              var maxX = 0;
              var currentRms = telemetryService.currentRms || 0.15;

              for (var x = 0; x <= 320; x += 10) {
                var amp = Math.sin((x + waveOffset) * 0.05) * 10 + (Math.random() - 0.5) * currentRms * 150;
                var y = 80 + amp;
                pathData += 'L ' + x + ',' + y + ' ';
                if (Math.abs(amp) > Math.abs(maxAmp)) {
                  maxAmp = amp;
                  maxX = x;
                }
              }

              if (!waveGlow) waveGlow = element[0].querySelector('#wave-glow');
              if (!waveCore) waveCore = element[0].querySelector('#wave-core');
              if (!dot) dot = element[0].querySelector('#wave-peak-dot');
              if (!line) line = element[0].querySelector('#wave-peak-line');
              if (!text) text = element[0].querySelector('#wave-peak-text');

              if (waveGlow && waveCore) {
                waveGlow.setAttribute('d', pathData);
                waveCore.setAttribute('d', pathData);

                if (dot) {
                  var peakY = 80 + maxAmp;
                  dot.setAttribute('cx', maxX.toString());
                  dot.setAttribute('cy', peakY.toString());

                  if (line) {
                    line.setAttribute('x1', maxX.toString());
                    line.setAttribute('x2', maxX.toString());
                    line.setAttribute('y1', peakY.toString());
                    line.setAttribute('y2', Math.max(10, peakY - 18).toString());
                  }

                  if (text) {
                    text.setAttribute('x', (maxX + 6).toString());
                    text.setAttribute('y', Math.max(18, peakY - 10).toString());
                    text.textContent = 'MAX ' + (Math.abs(maxAmp) / 100).toFixed(2) + 'g';
                  }
                }
              }
            }, 50);

            scope.$on('$destroy', function () {
              if (animTimer) $interval.cancel(animTimer);
            });
          }
        };
      }
    ]);
})();
