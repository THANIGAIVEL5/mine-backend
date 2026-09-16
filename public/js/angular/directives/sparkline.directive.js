/**
 * Sparkline Directive - Real-time Subterranean Rolling Metric Trend Graph
 * SIH 2026 - TERRA-PULSE OS
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .directive('sparklineTrend', function () {
      return {
        restrict: 'EA',
        scope: {
          data: '=',
          color: '@',
          height: '@',
          width: '@'
        },
        template:
          '<svg class="w-full overflow-visible" ng-attr-view_box="0 0 {{w}} {{h}}" ng-attr-height="{{h}}">' +
          '  <defs>' +
          '    <linearGradient id="{{gradId}}" x1="0" y1="0" x2="0" y2="1">' +
          '      <stop offset="0%" stop-color="{{strokeColor}}" stop-opacity="0.35" />' +
          '      <stop offset="100%" stop-color="{{strokeColor}}" stop-opacity="0.0" />' +
          '    </linearGradient>' +
          '  </defs>' +
          '  <polygon ng-if="areaPath" ng-attr-points="{{areaPath}}" fill="url(#{{gradId}})" />' +
          '  <polyline ng-attr-points="{{polyPoints}}" fill="none" stroke="{{strokeColor}}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />' +
          '  <circle ng-if="lastX !== undefined" ng-attr-cx="{{lastX}}" ng-attr-cy="{{lastY}}" r="3" fill="{{strokeColor}}" class="animate-ping" opacity="0.7" />' +
          '  <circle ng-if="lastX !== undefined" ng-attr-cx="{{lastX}}" ng-attr-cy="{{lastY}}" r="2.5" fill="{{strokeColor}}" />' +
          '</svg>',
        link: function (scope, element, attrs) {
          scope.w = parseInt(scope.width, 10) || 120;
          scope.h = parseInt(scope.height, 10) || 28;
          scope.strokeColor = scope.color || '#00f5ff';
          scope.gradId = 'grad-' + Math.random().toString(36).substring(2, 9);

          function render() {
            var raw = scope.data;
            if (!raw || !raw.length) {
              scope.polyPoints = '';
              scope.areaPath = '';
              return;
            }

            var pts = raw.slice();
            if (pts.length === 1) pts.push(pts[0]);

            var min = Math.min.apply(null, pts);
            var max = Math.max.apply(null, pts);
            if (max === min) {
              max = min + 1;
            }

            var pad = 3;
            var usableH = scope.h - (pad * 2);
            var stepX = scope.w / (pts.length - 1);

            var polyArr = [];
            for (var i = 0; i < pts.length; i++) {
              var x = (i * stepX).toFixed(1);
              var norm = (pts[i] - min) / (max - min);
              var y = (scope.h - pad - (norm * usableH)).toFixed(1);
              polyArr.push(x + ',' + y);
              if (i === pts.length - 1) {
                scope.lastX = x;
                scope.lastY = y;
              }
            }

            scope.polyPoints = polyArr.join(' ');
            scope.areaPath = '0,' + scope.h + ' ' + scope.polyPoints + ' ' + scope.w + ',' + scope.h;
          }

          scope.$watchCollection('data', render);
          render();
        }
      };
    });
})();
