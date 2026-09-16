/**
 * Audio Service - Web Audio API Tactical Synthesizer & Speech AI
 * SIH 2026 - TERRA-PULSE OS
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .factory('audioService', [
      '$rootScope',
      function ($rootScope) {
        var audioCtx = null;
        var sirenOsc = null;
        var sirenGain = null;
        var sirenInterval = null;
        var isSirenPlaying = false;
        var soundEnabled = true;
        var speechEnabled = true;

        function getAudioContext() {
          if (!audioCtx) {
            var AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
              audioCtx = new AudioContextClass();
            }
          }
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          return audioCtx;
        }

        var service = {
          soundEnabled: true,
          speechEnabled: true,
          isSirenActive: false,
          isListening: false,

          // Toggle sound FX
          toggleSound: function () {
            this.soundEnabled = !this.soundEnabled;
            if (!this.soundEnabled && this.isSirenActive) {
              this.stopSiren();
            }
            return this.soundEnabled;
          },

          // Tactical UI Ping / Click
          playBeep: function (freq, duration, type) {
            if (!this.soundEnabled) return;
            try {
              var ctx = getAudioContext();
              if (!ctx) return;
              var osc = ctx.createOscillator();
              var gain = ctx.createGain();
              osc.type = type || 'sine';
              osc.frequency.setValueAtTime(freq || 880, ctx.currentTime);
              gain.gain.setValueAtTime(0.08, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.1));
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + (duration || 0.1));
            } catch (e) {
              // Silently handle autoplay policy
            }
          },

          // Sonar Ping for Sensor Node Selection
          playSonarPing: function () {
            this.playBeep(1200, 0.25, 'triangle');
          },

          // DGMS Regulation 124 Emergency Evacuation Klaxon Siren (Dual Modulated Oscillators)
          startSiren: function () {
            if (this.isSirenActive) return;
            this.isSirenActive = true;
            if (!this.soundEnabled) return;

            try {
              var ctx = getAudioContext();
              if (!ctx) return;

              sirenOsc = ctx.createOscillator();
              sirenGain = ctx.createGain();
              sirenOsc.type = 'sawtooth';
              sirenGain.gain.setValueAtTime(0.12, ctx.currentTime);

              var up = true;
              sirenOsc.frequency.setValueAtTime(450, ctx.currentTime);
              sirenOsc.connect(sirenGain);
              sirenGain.connect(ctx.destination);
              sirenOsc.start();

              sirenInterval = setInterval(function () {
                if (!ctx || !sirenOsc) return;
                var now = ctx.currentTime;
                if (up) {
                  sirenOsc.frequency.linearRampToValueAtTime(850, now + 0.5);
                } else {
                  sirenOsc.frequency.linearRampToValueAtTime(450, now + 0.5);
                }
                up = !up;
              }, 500);
            } catch (e) {
              console.warn('Siren audio error:', e);
            }
          },

          stopSiren: function () {
            this.isSirenActive = false;
            if (sirenInterval) {
              clearInterval(sirenInterval);
              sirenInterval = null;
            }
            if (sirenOsc) {
              try {
                sirenOsc.stop();
                sirenOsc.disconnect();
              } catch (e) {}
              sirenOsc = null;
            }
            if (sirenGain) {
              try {
                sirenGain.disconnect();
              } catch (e) {}
              sirenGain = null;
            }
          },

          // Tactical HUD Speech Synthesis
          speak: function (text, priority) {
            if (!this.speechEnabled || !window.speechSynthesis) return;
            try {
              if (priority) {
                window.speechSynthesis.cancel(); // Interrupt ongoing speech
              }
              var utterance = new SpeechSynthesisUtterance(text);
              utterance.rate = 1.05;
              utterance.pitch = 0.9; // Lower authoritative tactical tone
              var voices = window.speechSynthesis.getVoices();
              // Prefer natural English voice if available
              var voice = voices.find(function (v) {
                return v.lang.indexOf('en') !== -1 && (v.name.indexOf('Google') !== -1 || v.name.indexOf('Natural') !== -1 || v.name.indexOf('David') !== -1);
              });
              if (voice) utterance.voice = voice;
              window.speechSynthesis.speak(utterance);
            } catch (e) {
              console.warn('Speech synthesis error:', e);
            }
          },

          // Web Speech Recognition (Push-to-Talk)
          startSpeechRecognition: function (onResult, onError) {
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
              if (onError) onError('Speech recognition not supported in this browser. Please use Chrome/Edge.');
              return null;
            }

            try {
              var recognition = new SpeechRecognition();
              recognition.continuous = false;
              recognition.interimResults = false;
              recognition.lang = 'en-US';

              service.isListening = true;
              $rootScope.$applyAsync();

              recognition.onresult = function (event) {
                service.isListening = false;
                var transcript = event.results[0][0].transcript;
                if (onResult) onResult(transcript);
                $rootScope.$applyAsync();
              };

              recognition.onerror = function (err) {
                service.isListening = false;
                if (onError) onError(err.error);
                $rootScope.$applyAsync();
              };

              recognition.onend = function () {
                service.isListening = false;
                $rootScope.$applyAsync();
              };

              recognition.start();
              return recognition;
            } catch (e) {
              service.isListening = false;
              if (onError) onError(e.message);
              return null;
            }
          }
        };

        return service;
      }
    ]);
})();
