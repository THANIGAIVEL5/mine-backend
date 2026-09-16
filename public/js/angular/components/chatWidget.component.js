/**
 * Chat Widget Component - Modern Angular Controller for Master AI Terminal with Push-to-Talk Voice & Live Cloud Backend Link
 * SIH 2026 - TERRA-PULSE OS
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .controller('ChatWidgetController', [
      '$scope',
      '$timeout',
      'chatService',
      'telemetryService',
      'audioService',
      function ($scope, $timeout, chatService, telemetryService, audioService) {
        var vm = this;

        vm.isOpen = false;
        vm.isMaximized = false;
        vm.isKeyModalOpen = false;
        vm.messageInput = '';
        vm.apiKeyInput = chatService.geminiApiKey;
        vm.backendUrlInput = localStorage.getItem('terra_backend_url') || '';
        vm.hasUnread = false;

        Object.defineProperty(vm, 'isListening', {
          get: function () {
            return audioService.isListening;
          }
        });

        Object.defineProperty(vm, 'messages', {
          get: function () {
            return chatService.messages;
          }
        });

        Object.defineProperty(vm, 'isSending', {
          get: function () {
            return chatService.isSending;
          }
        });

        Object.defineProperty(vm, 'geminiApiKey', {
          get: function () {
            return chatService.geminiApiKey;
          }
        });

        Object.defineProperty(vm, 'backendUrl', {
          get: function () {
            return chatService.backendUrl;
          }
        });

        Object.defineProperty(vm, 'connectionType', {
          get: function () {
            return telemetryService.connectionType;
          }
        });

        vm.openWindow = function () {
          vm.isOpen = true;
          vm.hasUnread = false;
          audioService.playBeep(880, 0.08, 'sine');
          $timeout(function () {
            var input = document.getElementById('chat-input');
            if (input) input.focus();
            vm.scrollToBottom();
          }, 100);
        };

        vm.closeWindow = function () {
          vm.isOpen = false;
          audioService.playBeep(440, 0.08, 'sine');
        };

        vm.toggleMaximize = function () {
          vm.isMaximized = !vm.isMaximized;
          $timeout(vm.scrollToBottom, 150);
        };

        vm.toggleKeyModal = function () {
          vm.isKeyModalOpen = !vm.isKeyModalOpen;
          if (vm.isKeyModalOpen) {
            vm.apiKeyInput = chatService.geminiApiKey;
            vm.backendUrlInput = localStorage.getItem('terra_backend_url') || '';
          }
        };

        vm.saveSettings = function () {
          chatService.saveApiKey(vm.apiKeyInput);
          var bUrl = (vm.backendUrlInput || '').trim();
          chatService.setBackendUrl(bUrl);
          telemetryService.reconnect(bUrl);
          alert(
            'Settings Applied!\n' +
            (bUrl ? '• Live Cloud Backend: ' + bUrl + '\n' : '• Live Backend: Default (Local/Direct)\n') +
            (vm.apiKeyInput ? '• Direct Gemini Cloud AI: Active' : '• AI: Autonomous DGMS & Neural Core')
          );
          vm.isKeyModalOpen = false;
        };

        vm.sendMessage = function () {
          if (!vm.messageInput || !vm.messageInput.trim()) return;
          var text = vm.messageInput;
          vm.messageInput = '';
          audioService.playBeep(920, 0.06, 'triangle');
          chatService.sendMessage(text);
          $timeout(vm.scrollToBottom, 50);
        };

        // Push-to-Talk Voice Command Handler
        vm.startVoiceCommand = function () {
          audioService.playBeep(1050, 0.1, 'sine');
          audioService.startSpeechRecognition(
            function (transcript) {
              $scope.$applyAsync(function () {
                vm.messageInput = transcript;
                vm.sendMessage();
              });
            },
            function (err) {
              console.warn('Voice recognition notice:', err);
            }
          );
        };

        vm.sendQuickChat = function (query) {
          vm.openWindow();
          chatService.sendMessage(query);
          $timeout(vm.scrollToBottom, 50);
        };

        vm.scrollToBottom = function () {
          var container = document.getElementById('chat-messages');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        };
      }
    ]);
})();
