/**
 * Theme Service - Light / Dark Tactical Mode Manager
 * SIH 2026 - TERRA-PULSE OS
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .factory('themeService', [
      '$rootScope',
      function ($rootScope) {
        // Default to Complete Light Theme per user request
        var savedTheme = localStorage.getItem('terra_theme_v2');
        var isDark = savedTheme ? (savedTheme === 'dark') : false;

        function applyTheme(dark) {
          isDark = dark;
          var html = document.documentElement;
          if (isDark) {
            html.classList.add('dark');
            html.classList.remove('light');
            localStorage.setItem('terra_theme_v2', 'dark');
          } else {
            html.classList.remove('dark');
            html.classList.add('light');
            localStorage.setItem('terra_theme_v2', 'light');
          }
          $rootScope.$broadcast('theme:changed', isDark);
          $rootScope.$applyAsync();
        }

        // Apply immediately
        applyTheme(isDark);

        return {
          get isDark() {
            return isDark;
          },
          toggleTheme: function () {
            applyTheme(!isDark);
            return isDark;
          },
          setLight: function () {
            applyTheme(false);
          },
          setDark: function () {
            applyTheme(true);
          }
        };
      }
    ]);
})();
