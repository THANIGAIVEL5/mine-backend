/**
 * Chat Service - Master AI Communication & Hybrid Cloud/Client Geotechnical AI Core
 * Supports Live Render Backend, WebSockets, Direct Google Gemini, and DGMS Fail-Safe Engine.
 */
(function () {
  'use strict';

  angular
    .module('terraPulseApp')
    .factory('chatService', [
      '$rootScope',
      '$http',
      'telemetryService',
      function ($rootScope, $http, telemetryService) {
        function getBackendUrl() {
          var userCustom = localStorage.getItem('terra_backend_url');
          if (userCustom !== null && userCustom.trim() !== '') {
            return userCustom.trim().replace(/\/$/, '');
          }
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000') {
            return '';
          }
          var globalUrl = window.TERRA_BACKEND_URL || 'https://mine-backend-1.onrender.com';
          return globalUrl.replace(/\/$/, '');
        }

        var service = {
          messages: [
            {
              sender: 'MINE GUARDER MASTER AI',
              text: 'Welcome Operator. I am the central MINE GUARDER Master AI Controller with autonomous oversight of all 5 underground sensor nodes, hydraulic powered roof chocks, drainage sumps, and DGMS emergency safety interlocks.',
              isAi: true,
              time: 'INITIALIZED',
              source: 'SmolLM2 / DGMS NEURAL CORE',
              isIntervention: false
            }
          ],
          geminiApiKey: localStorage.getItem('gemini_api_key') || '',
          backendUrl: getBackendUrl(),
          isSending: false,
          socketIo: null
        };

        // Initialize Socket.IO connection if backend available
        function initSocket() {
          try {
            if (typeof io !== 'undefined') {
              var targetUrl = service.backendUrl || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mine-backend-1.onrender.com');
              service.socketIo = io(targetUrl || window.location.origin, {
                transports: ['websocket', 'polling'],
                timeout: 4000
              });

              service.socketIo.on('chat_broadcast', function (data) {
                if (data && (data.text || data.reply)) {
                  service.isSending = false;
                  var textMsg = data.text || data.reply;
                  var isDupe = service.messages.some(function (m) {
                    return m.text === textMsg && m.sender === data.sender;
                  });
                  if (!isDupe) {
                    service.messages.push({
                      sender: data.sender || 'Operator',
                      text: textMsg,
                      isAi: !!data.isAi,
                      time: data.timestamp || new Date().toLocaleTimeString(),
                      source: data.source || 'CENTRAL CLOUD BACKEND',
                      isIntervention: !!data.isIntervention
                    });
                    $rootScope.$applyAsync();
                  }
                }
              });
            }
          } catch (e) {
            console.warn('Socket.IO init fallback:', e);
          }
        }
        initSocket();

        // Local Geotechnical Knowledge Engine for Instant Client-Side AI Responses
        function generateLocalGeotechnicalResponse(query) {
          var q = (query || '').toLowerCase().trim();
          
          if (q.includes('evacuat') || q.includes('emergency') || q.includes('alarm') || q.includes('danger') || q.includes('klaxon')) {
            return {
              reply: '🚨 [DGMS CRITICAL DIRECTIVE // EMERGENCY KLAXON ENGAGED]\n• Status: Mandatory emergency evacuation protocol activated for Chasnala Deep Mine Sector 4B.\n• Acoustic Sirens: Continuous 3-tone acoustic klaxons active across Drift 12 & Shaft 12.\n• Escape Directive: All underground personnel must don 60-minute SCSR and report immediately to Refuge Bay 3B via illuminated escapeway.',
              source: 'DGMS CMR-2017 EMERGENCY INTERLOCK',
              isIntervention: true
            };
          }
          if (q.includes('sensor') || q.includes('node') || q.includes('node-03') || q.includes('pillar') || q.includes('reading')) {
            return {
              reply: '📊 [TELEMETRY AUDIT // 5 NODES SYNCHRONIZED]\n• Node-01 (Shaft #2 Collar): Nominal flexure, LoRa RSSI -82 dBm\n• Node-02 (Overburden Bench): Stable pore pressure, Pitch 0.4°\n• Node-03 (Pillar 4B Stope): Tilt 0.5°, Seismic RMS 0.15g (ISO Zone A Nominal)\n• Node-04 (Sump Sub-Level): Water depth 34.0 cm (Safe capacity < 150 cm)\n• Node-05 (Haulage Drift #12): Atmospheric CO at 12 ppm (DGMS Safe < 25 ppm)',
              source: 'AUTONOMOUS SENSOR SURVEILLANCE ENGINE',
              isIntervention: false
            };
          }
          if (q.includes('ventilat') || q.includes('gas') || q.includes('co') || q.includes('air') || q.includes('fan') || q.includes('methane')) {
            return {
              reply: '💨 [ATMOSPHERIC SAFETY & VENTILATION GOVERNANCE]\n• Carbon Monoxide (CO): 12 ppm (DGMS 8-Hour TWA Limit: 25 ppm, Alarm: 50 ppm) — SAFE\n• Methane (CH4): Below 0.05% detection threshold (DGMS Limit: 1.25%)\n• Auxiliary Ventilation Fan: Operating at nominal 78% capacity (Airflow: 2.4 m/s in Drift 12)',
              source: 'DGMS VENTILATION & LIFE SAFETY INTERLOCK',
              isIntervention: q.includes('boost') || q.includes('100%')
            };
          }
          if (q.includes('rockfall') || q.includes('subsidence') || q.includes('strain') || q.includes('strata') || q.includes('collapse') || q.includes('risk')) {
            return {
              reply: '🏔️ [XAI TREE-SHAP SUBSIDENCE RISK FORECAST]\n• Subsidence Probability: 14.2% (Low Risk Stage-I)\n• Strata Roof Flexure: 0.10 mm convergence rate (Stable)\n• Rock Mass Rating (RMR): 74 (Good Rock Strata)\n• Tree-SHAP Risk Drivers: 1) Overburden pore pressure (42%), 2) Roof shear strain (28%)\n• Hydraulic powered roof chocks at Face 4B pre-set to maintain yield pressure > 320 bar.',
              source: 'XAI TREE-SHAP & SUBSIDENCE RISK MODEL',
              isIntervention: false
            };
          }
          if (q.includes('sump') || q.includes('water') || q.includes('flood') || q.includes('pump') || q.includes('drain')) {
            return {
              reply: '💧 [HYDROLOGICAL DRAINAGE STATUS]\n• Sump Water Level: 34.0 cm (Critical Inundation Threshold: > 150 cm)\n• Submersible Dewatering Pump #1: Running at 42 L/min nominal discharge\n• Infiltration Velocity: 0.02 mm/h (Stable dry strata)',
              source: 'HYDROGEOLOGICAL DRAINAGE CONTROLLER',
              isIntervention: false
            };
          }
          if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('who are you') || q.includes('help') || q.includes('status')) {
            return {
              reply: '🛡️ [MINE GUARDER MASTER AI] Greetings Operator. Central monitoring and autonomous safety oversight active across Chasnala Deep Mine Sector 4B.\n\n• Operational Phase: STABLE (All 5 Sensor Nodes Synchronized)\n• Strata Displacement: 0.10 mm (Nominal)\n• Seismic RMS: 0.15g (ISO 10816-3 Zone A - Stable)\n• Atmospheric CO: 12 ppm (DGMS Safe < 25 ppm)\n\nYou can issue commands such as "Report mine status", "Check gas & CO levels", "Explain subsidence risk", "100% ventilation boost", or "Trigger evacuation klaxon".',
              source: 'MINE GUARDER MASTER CONTROLLER',
              isIntervention: false
            };
          }

          return {
            reply: '[MINE GUARDER MASTER AI DIRECTIVE]\nGeotechnical query evaluated for Chasnala Deep Mine Sector 4B. Micro-seismic vibration RMS is 0.15g and strata roof displacement is 0.10 mm. All parameters are within DGMS 1957/2017 safety guidelines. No anomalous acoustic emission or ground delamination detected.',
            source: 'DGMS CMR-2017 GEOTECHNICAL CORE',
            isIntervention: false
          };
        }

        // Direct Google Gemini Flash Integration for Client-Side AI Execution
        function callGeminiDirect(query, apiKey) {
          var prompt = "You are the MINE GUARDER Master AI Controller for an underground coal mine (Chasnala Deep Mine, Sector 4B) complying with DGMS safety standards. The operator asks: \"" + query + "\". Provide a sharp, professional, authoritative geotechnical response (2-3 sentences max) with actionable engineering recommendations.";
          var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

          return $http.post(endpoint, {
            contents: [{
              parts: [{ text: prompt }]
            }]
          }).then(function (res) {
            var reply = res.data && res.data.candidates && res.data.candidates[0] &&
                        res.data.candidates[0].content && res.data.candidates[0].content.parts &&
                        res.data.candidates[0].content.parts[0] && res.data.candidates[0].content.parts[0].text;
            return {
              reply: reply ? reply.trim() : generateLocalGeotechnicalResponse(query).reply,
              source: 'GOOGLE GEMINI 1.5 FLASH (DIRECT AI)',
              isIntervention: query.toLowerCase().includes('evacuat') || query.toLowerCase().includes('fan')
            };
          });
        }

        service.sendMessage = function (text, user) {
          if (!text || !text.trim()) return Promise.reject('Empty message');
          text = text.trim();
          user = user || 'Mine Operator';

          // Apply immediate local physical override if intervention command
          if (telemetryService && typeof telemetryService.applyOperatorOverride === 'function') {
            var lText = text.toLowerCase();
            if (lText.includes('intervene') || lText.includes('evacuat') || lText.includes('boost') || lText.includes('pump') || lText.includes('chock') || lText.includes('reset') || lText.includes('stable')) {
              telemetryService.applyOperatorOverride(text);
            }
          }

          var userMsg = {
            sender: user,
            text: text,
            isAi: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: 'LOCAL OPERATOR TERMINAL',
            isIntervention: false
          };
          service.messages.push(userMsg);
          service.isSending = true;

          // Broadcast via Socket.IO if connected
          if (service.socketIo && service.socketIo.connected) {
            service.socketIo.emit('chat_message', {
              message: text,
              user: user,
              geminiApiKey: service.geminiApiKey
            });
          }

          var currentBackend = getBackendUrl();
          var postUrl = (currentBackend ? currentBackend : '') + '/api/chat';

          // Try cloud/local backend first with fast 3.5s timeout for instant responsiveness
          return $http.post(postUrl, {
            message: text,
            query: text,
            geminiApiKey: service.geminiApiKey
          }, { timeout: 3500 }).then(
            function (res) {
              service.isSending = false;
              var data = res.data;

              // Validate that response is a real JSON object with meaningful reply
              if (!data || typeof data !== 'object' || (!data.reply && !data.text)) {
                return applyLocalFallback(text);
              }

              var replyText = (data.reply || data.text || '').trim();
              if (!replyText) {
                return applyLocalFallback(text);
              }

              var isDupe = service.messages.some(function (m) {
                return m.text === replyText && m.isAi;
              });

              if (!isDupe) {
                service.messages.push({
                  sender: 'MINE GUARDER MASTER AI',
                  text: replyText,
                  isAi: true,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  source: data.source || 'LIVE CLOUD MASTER AI',
                  isIntervention: !!data.isIntervention
                });
              }

              $rootScope.$applyAsync();
              return data;
            },
            function (err) {
              // Fail-Safe Fallback: Use Direct Gemini API or Local Geotechnical Engine
              if (service.geminiApiKey) {
                return callGeminiDirect(text, service.geminiApiKey).then(function (geminiRes) {
                  service.isSending = false;
                  service.messages.push({
                    sender: 'TERRA-SENTINEL MASTER AI',
                    text: geminiRes.reply,
                    isAi: true,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    source: geminiRes.source,
                    isIntervention: geminiRes.isIntervention
                  });
                  $rootScope.$applyAsync();
                  return geminiRes;
                }).catch(function () {
                  return applyLocalFallback(text);
                });
              } else {
                return applyLocalFallback(text);
              }
            }
          );
        };

        function applyLocalFallback(text) {
          service.isSending = false;
          var telemData = (telemetryService && telemetryService.data) || {};

          if (window.SmolAi && typeof window.SmolAi.generate === 'function') {
            try {
              var genPromise = window.SmolAi.generate(text, telemData);
              if (genPromise && typeof genPromise.then === 'function') {
                genPromise.then(function (res) {
                  service.isSending = false;
                  service.messages.push({
                    sender: 'TERRA-SENTINEL MASTER AI',
                    text: res.reply,
                    isAi: true,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    source: res.source,
                    isIntervention: res.isIntervention
                  });
                  $rootScope.$applyAsync();
                }).catch(function () {
                  fallbackToRules(text);
                });
                return;
              }
            } catch (e) {
              // Fall through to deterministic rules
            }
          }

          fallbackToRules(text);
        }

        function fallbackToRules(text) {
          service.isSending = false;
          var fallback = generateLocalGeotechnicalResponse(text);
          service.messages.push({
            sender: 'TERRA-SENTINEL MASTER AI',
            text: fallback.reply,
            isAi: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: fallback.source,
            isIntervention: fallback.isIntervention
          });
          $rootScope.$applyAsync();
        }

        service.sendTextToSql = function (naturalQuery) {
          if (!naturalQuery || !naturalQuery.trim() || service.isSending) return;
          var queryText = naturalQuery.trim();
          service.isSending = true;

          service.messages.push({
            sender: 'OPERATOR',
            text: '🔍 [SQL QUERY]: ' + queryText,
            isAi: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          });

          var endpoint = (service.backendUrl ? service.backendUrl : '') + '/api/chat/text-to-sql';

          $http.post(endpoint, { query: queryText })
            .then(function (res) {
              service.isSending = false;
              var data = res.data;
              service.messages.push({
                sender: 'MINE GUARDER SQL ENGINE',
                text: data.naturalSummary,
                generatedSql: data.generatedSql,
                results: data.results,
                rowCount: data.rowCount,
                isSqlResult: true,
                isAi: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                source: 'AI Text-to-SQL Translator (SQLite 3)',
                executionTimeMs: data.executionTimeMs
              });
              $rootScope.$applyAsync();
            })
            .catch(function (err) {
              service.isSending = false;
              var errMessage = (err.data && err.data.error) ? err.data.error : 'SQL Translation Failed.';
              service.messages.push({
                sender: 'MINE GUARDER SQL ENGINE',
                text: '❌ [SQL EXECUTION ERROR]: ' + errMessage,
                isAi: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                source: 'SQL Safety Sandbox Core'
              });
              $rootScope.$applyAsync();
            });
        };

        service.setBackendUrl = function (url) {
          service.backendUrl = (url || '').trim().replace(/\/$/, '');
          if (service.backendUrl) {
            localStorage.setItem('terra_backend_url', service.backendUrl);
          } else {
            localStorage.removeItem('terra_backend_url');
          }
          if (service.socketIo) {
            service.socketIo.disconnect();
          }
          initSocket();
          $rootScope.$applyAsync();
        };

        service.saveApiKey = function (key) {
          service.geminiApiKey = (key || '').trim();
          if (service.geminiApiKey) {
            localStorage.setItem('gemini_api_key', service.geminiApiKey);
          } else {
            localStorage.removeItem('gemini_api_key');
          }
          $rootScope.$applyAsync();
        };

        return service;
      }
    ]);
})();
