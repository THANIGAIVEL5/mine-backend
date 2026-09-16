/**
 * TERRA-PULSE OS - AngularJS Application Module
 * SIH 2026 Deep Mine Geotechnical Telemetry & Autonomous AI Console
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp', [])
    .config([
      '$compileProvider',
      function ($compileProvider) {
        // High performance mode
        $compileProvider.debugInfoEnabled(false);
        $compileProvider.commentDirectivesEnabled(false);
        $compileProvider.cssClassDirectivesEnabled(false);
      }
    ])
    .run([
      '$rootScope',
      function ($rootScope) {
        $rootScope.systemOnline = true;
        $rootScope.appTitle = 'TERRA-PULSE OS';
        console.log('🚀 [TERRA-PULSE OS] Modern AngularJS Application Core Bootstrapped.');
      }
    ])
    .filter('default', function () {
      return function (input, defaultValue) {
        return (input !== undefined && input !== null && input !== '') ? input : defaultValue;
      };
    });
})();
