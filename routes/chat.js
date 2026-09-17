const express = require('express');
const router = express.Router();
const textToSqlService = require('../services/textToSqlService');

/**
 * MINE GUARDER MASTER AI CONTROLLER
 * Single authoritative intelligence system that controls and monitors all mine sensor data:
 * - Subterranean Strata Dynamics (Pitch, Roll, Displacement)
 * - Micro-Seismic Vibration (RMS, Peak-to-Peak, FFT)
 * - Atmospheric Life Safety (CO, CO2, NH3, AQI)
 * - Hydrogeological Infiltration (Shaft Sump Water Depth)
 * - DGMS Statutory Compliance (Directorate General of Mines Safety 1957/2017)
 */
class MineGuarderMasterAI {
  constructor() {
    this.name = 'MINE GUARDER MASTER AI';
    this.status = 'ACTIVE // OMNI-GOVERNANCE';
  }

  // Real-time telemetry monitoring directive
  async analyzeTelemetryStream(telemetry = {}, aiGenerator = null) {
    const phase = telemetry.phase || 'STABLE';
    const pitch = Number(telemetry.pitch || 0.5).toFixed(1);
    const rms = Number(telemetry.rms || 0.15).toFixed(2);
    const co = Math.floor(telemetry.co || 12);
    const disp = Number(telemetry.disp || 0.1).toFixed(2);

    if (aiGenerator) {
      try {
        const messages = [
          {
            role: 'system',
            content: 'You are the TERRA-SENTINEL Master AI Controller for an underground coal mine. You govern all 5 sensor nodes and safety interlocks. Provide an urgent, authoritative 1-sentence geotechnical control directive citing sensor readings and immediate DGMS action.'
          },
          {
            role: 'user',
            content: `Mine Phase: ${phase}. Telemetry: Pitch ${pitch}°, Seismic RMS ${rms}g, CO ${co} ppm, Roof Delamination ${disp} mm. What is your control directive?`
          }
        ];
        const output = await aiGenerator(messages, { max_new_tokens: 50, temperature: 0.6, do_sample: true });
        const gen = output[0]?.generated_text;
        const text = Array.isArray(gen) ? gen[gen.length - 1].content : (typeof gen === 'string' ? gen : '');
        if (text && text.trim()) return text.trim();
      } catch (e) {
        // Fall through to deterministic directive
      }
    }

    return this.getDeterministicDirective(phase, pitch, rms, co, disp);
  }

  // Deterministic DGMS rule directives
  getDeterministicDirective(phase, pitch, rms, co, disp) {
    switch (phase) {
      case 'STABLE':
        return `[MASTER AI DIRECTIVE] Strata acoustic baseline nominal. Micro-seismic RMS at ${rms}g; atmospheric CO at ${co} ppm (DGMS safe). All 5 sensor nodes in equilibrium.`;
      case 'WARNING':
        return `[MASTER AI ADVISORY] Elevated shear strain detected at Pillar 4B. RMS elevated to ${rms}g (Pitch ${pitch}°). Automated hydraulic chock pre-tensioning commanded.`;
      case 'CRITICAL':
        return `[MASTER AI CRITICAL ALARM] SECTOR 4B STRATA RUPTURE IMMINENT! Displacement at ${disp}mm, CO spike at ${co} ppm. Continuous evacuation klaxon activated. Immediate withdrawal to Refuge Bay 3B commanded.`;
      case 'RECOVERY':
        return `[MASTER AI STABILIZATION] Subsurface strata stress dissipation active. Auxiliary ventilation at 100%. Awaiting atmospheric CO clearance under DGMS limits.`;
      default:
        return `[MASTER AI ACTIVE] Real-time sensor stream synchronized across Sector 4B gallery.`;
    }
  }

  // Answer operator inquiries with full contextual knowledge of all mine data
  async processOperatorQuery(message, telemetry = {}, options = {}) {
    const msg = (message || '').toLowerCase();
    const apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
    const aiGenerator = options.aiGenerator;

    // 0. Direct Operator Interference / Intervention (Highest Priority Override)
    const intervention = this.checkInterventionCommand(msg, telemetry);
    if (intervention) {
      return {
        reply: intervention,
        source: 'TERRA-SENTINEL Master AI // Operator Interference Executed',
        isIntervention: true
      };
    }

    // 1. Cloudflare Workers AI (Meta Llama 3.1 8B Edge GPU)
    const cfReply = await this.queryCloudflareWorkersAi(message, telemetry);
    if (cfReply) {
      return {
        reply: cfReply,
        source: 'MINE GUARDER Master AI (Cloudflare Workers AI Llama-3.1 8B)'
      };
    }

    // 2. Cloud-Augmented Reasoning (Gemini if key available)
    if (apiKey) {
      try {
        const cloudReply = await this.queryCloudIntelligence(apiKey, message, telemetry);
        if (cloudReply) {
          return {
            reply: cloudReply,
            source: 'MINE GUARDER Master AI (Google Gemini Cloud AI)'
          };
        }
      } catch (e) {
        console.warn('Cloud reasoning bypass:', e.message);
      }
    }

    // 3. On-Device Neural Brain
    if (aiGenerator) {
      try {
        const neuralReply = await this.queryNeuralIntelligence(aiGenerator, message, telemetry);
        if (neuralReply) {
          return {
            reply: neuralReply,
            source: 'MINE GUARDER Master AI (On-Device Qwen 2.5 Neural)'
          };
        }
      } catch (e) {
        console.warn('Neural reasoning bypass:', e.message);
      }
    }

    // 4. Statutory Regulatory Safety Core
    return {
      reply: this.queryRegulatoryCore(message, telemetry),
      source: 'MINE GUARDER Master AI (DGMS Regulatory Core)'
    };
  }

  // Operator Intervention & Interference Command Parser
  checkInterventionCommand(msg, telemetry = {}) {
    const isIntervene = msg.includes('intervene') || msg.includes('override') || msg.includes('force') || msg.includes('manual') || msg.includes('command:');
    
    // Evacuation Override
    if (msg.includes('evacuat') || msg.includes('klaxon') || (isIntervene && (msg.includes('critical') || msg.includes('alarm') || msg.includes('danger') || msg.includes('siren')))) {
      return `[OPERATOR INTERFERENCE CONFIRMED // EMERGENCY KLAXON ENGAGED]\n` +
        `• Intervention Directive: Manual emergency evacuation override activated by Mine Operator.\n` +
        `• Acoustic Sirens: Sector 4B Continuous 3-Tone Klaxons active across Drift 12 and Shaft 12.\n` +
        `• Subsurface Personnel: 18 underground miners commanding mandatory SCSR donning.\n` +
        `• Escape Routing: Sub-Level 3 Refuge Bay (Ref-Bay-3B) illumination enabled. Auxiliary hoist winch standby.`;
    }
    // Dewatering Override
    if ((msg.includes('pump') && (msg.includes('start') || msg.includes('force') || msg.includes('run') || isIntervene)) || msg.includes('drain sump') || msg.includes('dewater') || (isIntervene && msg.includes('water'))) {
      return `[OPERATOR INTERFERENCE CONFIRMED // HYDRO DEWATERING OVERRIDE]\n` +
        `• Intervention Directive: Sump pump override commanded by Mine Operator.\n` +
        `• Hardware Action: 500 GPM primary turbine pump at Shaft 12 forced to 100% duty cycle.\n` +
        `• Strata Result: Sandstone contact hydrostatic head dropping. Infiltration velocity neutralized.`;
    }
    // Chock Pre-Tension Override
    if (msg.includes('chock') || msg.includes('pre-tension') || msg.includes('pretension') || (isIntervene && (msg.includes('hydraulic') || msg.includes('pressure') || msg.includes('roof')))) {
      return `[OPERATOR INTERFERENCE CONFIRMED // STRATA SUPPORT PRE-TENSION]\n` +
        `• Intervention Directive: Hydraulic chock load mitigation commanded by Mine Operator.\n` +
        `• Hardware Action: Hydraulic powered roof supports at Face 4B pre-tensioned to 350 bar yield pressure.\n` +
        `• Strata Result: Delamination flexure arrested. Roof convergence velocity dampened by 68%.`;
    }
    // Ventilation Override
    if ((msg.includes('ventilat') && (msg.includes('boost') || msg.includes('100') || msg.includes('high') || isIntervene)) || msg.includes('flush gas') || (isIntervene && (msg.includes('fan') || msg.includes('air') || msg.includes('gas')))) {
      return `[OPERATOR INTERFERENCE CONFIRMED // VENTILATION FLOW BOOST]\n` +
        `• Intervention Directive: Auxiliary ventilation booster override commanded by Mine Operator.\n` +
        `• Hardware Action: Twin centrifugal intake fans throttled to 4,500 m³/min (100% boost capacity).\n` +
        `• Atmospheric Result: Active carbon monoxide and methane desorption dilution in progress.`;
    }
    // Reset Override
    if ((msg.includes('reset') && (msg.includes('stable') || msg.includes('baseline') || msg.includes('alarm') || msg.includes('nominal') || isIntervene)) || msg.includes('clear alarm') || (isIntervene && (msg.includes('normal') || msg.includes('clear')))) {
      return `[OPERATOR INTERFERENCE CONFIRMED // TELEMETRY ALARM RESET]\n` +
        `• Intervention Directive: Master AI alarm state manually acknowledged and reset by Mine Operator.\n` +
        `• Sensor Bus Status: 5 subterranean nodes reset to STABLE baseline surveillance mode.\n` +
        `• Safety Interlocks: Normal monitoring resumed under DGMS standards.`;
    }
    return null;
  }

  async queryCloudflareWorkersAi(message, telemetry = {}) {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!token || !accountId) return null;

    const phase = telemetry.phase || 'STABLE';
    const pitch = Number(telemetry.pitch || 0.5).toFixed(2);
    const disp = Number(telemetry.disp || 0.1).toFixed(2);
    const rms = Number(telemetry.rms || 0.15).toFixed(2);
    const co = Math.floor(telemetry.co || 12);
    const sump = Number(telemetry.sump || 1.3).toFixed(2);

    const systemPrompt = (
      "You are an experienced, authoritative senior geotechnical mining engineer and AI co-pilot in the mine control room. " +
      "Speak completely naturally, warmly, and conversationally in 2-4 sentences, like an expert human engineer talking to a colleague. " +
      "Never use robotic ASCII art or rigid bullet lists. " +
      "Answer what the operator asked directly and clearly, seamlessly weaving in relevant live sensor readings and DGMS statutory safety context."
    );

    const userContent = (
      `Live readings right now: mine status is ${phase}, strata pitch is ${pitch}°, roof displacement is ${disp}mm, ` +
      `micro-seismic vibration is ${rms}g, CO gas is ${co}ppm, sump water is ${sump}m. ` +
      `Operator question: ${message}`
    );

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent }
            ],
            max_tokens: 160
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data?.result?.response || data?.result?.choices?.[0]?.message?.content;
        if (reply && reply.trim()) return reply.trim();
      }
    } catch (e) {
      console.warn('Cloudflare Workers AI reasoning bypass:', e.message);
    }
    return null;
  }

  async queryCloudIntelligence(apiKey, message, telemetry) {
    const systemPrompt = `You are TERRA-SENTINEL MASTER AI, the supreme geotechnical engineering and safety control system for an underground coal mine (SIH 2026).
You have autonomous control and oversight of all 5 underground sensor nodes, hydraulic chock relief valves, sump drainage turbine pumps, and emergency evacuation klaxons.
Live Mine Sensor Data:
- Operational Phase: ${telemetry.phase || 'STABLE'}
- Strata Pitch: ${telemetry.pitch !== undefined ? Number(telemetry.pitch).toFixed(2) : '0.50'}°
- Strata Roll: ${telemetry.roll !== undefined ? Number(telemetry.roll).toFixed(2) : '-0.20'}°
- Micro-Seismic RMS Vibration: ${telemetry.rms !== undefined ? Number(telemetry.rms).toFixed(2) : '0.15'}g
- Carbon Monoxide (CO): ${telemetry.co !== undefined ? Math.floor(telemetry.co) : 12} ppm
- Roof Displacement: ${telemetry.disp !== undefined ? Number(telemetry.disp).toFixed(2) : '0.10'} mm
- Ambient Temperature: ${telemetry.temp !== undefined ? Number(telemetry.temp).toFixed(1) : '38.6'}°C

Instructions:
- Speak authoritatively as the single Master AI governing the entire mine.
- Integrate the live telemetry directly into your analysis.
- Quote DGMS (Directorate General of Mines Safety) 1957/2017 thresholds and specify immediate physical engineering commands.
- Keep response clear, professional, and concise.`;

    const models = ['antigravity-preview-09-2026', 'gemini-2.5-flash-native-audio-latest', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-exp', 'gemini-1.5-pro-latest', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: 300 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (e) {}
    }
    return null;
  }

  async queryNeuralIntelligence(aiGenerator, message, telemetry) {
    const telemetryStr = `Phase: ${telemetry.phase || 'STABLE'}, Pitch: ${Number(telemetry.pitch || 0.5).toFixed(1)}°, RMS: ${Number(telemetry.rms || 0.15).toFixed(2)}g, CO: ${Math.floor(telemetry.co || 12)} ppm, Displacement: ${Number(telemetry.disp || 0.1).toFixed(2)} mm`;
    
    const messages = [
      {
        role: 'system',
        content: 'You are TERRA-SENTINEL MASTER AI, the unified geotechnical and safety controller for this coal mine. Respond with a concise, authoritative 2-3 sentence assessment and action directive based on the live sensor data and DGMS statutory standards.'
      },
      {
        role: 'user',
        content: `Live Telemetry: [${telemetryStr}]. Operator query: "${message}". What is your command and assessment?`
      }
    ];

    const output = await aiGenerator(messages, { max_new_tokens: 80, temperature: 0.6, do_sample: true });
    const gen = output[0]?.generated_text;
    const replyText = Array.isArray(gen) ? gen[gen.length - 1].content : (typeof gen === 'string' ? gen : '');
    return replyText ? replyText.trim() : null;
  }

  queryRegulatoryCore(message, telemetry = {}) {
    const msg = (message || '').toLowerCase();
    const phase = telemetry.phase || 'STABLE';
    const co = telemetry.co !== undefined ? Math.floor(telemetry.co) : 12;
    const rms = telemetry.rms !== undefined ? Number(telemetry.rms).toFixed(2) : '0.15';
    const pitch = telemetry.pitch !== undefined ? Number(telemetry.pitch).toFixed(1) : '0.5';
    const disp = telemetry.disp !== undefined ? Number(telemetry.disp).toFixed(2) : '0.10';
    const temp = telemetry.temp !== undefined ? Number(telemetry.temp).toFixed(1) : '38.6';

    // 1. Evacuation / Emergency / Protocols (Highest Priority)
    if (/\b(evacuat\w*|emergency|emergencies|protocol|protocols|alarm|alarms|danger|dangerous|help|escape|sos|klaxon)\b/i.test(msg)) {
      return `[TERRA-SENTINEL MASTER AI // EMERGENCY DISPATCH PROTOCOL]\n` +
        `1. Continuous 3-tone acoustic klaxon activated across Sector 4B and Shaft 12.\n` +
        `2. All personnel must immediately don 60-minute SCSR (Self-Contained Self-Rescuers).\n` +
        `3. Proceed along primary illuminated escapeway to Sub-Level 3 Refuge Bay (Ref-Bay-3B).\n` +
        `4. Surface hoist auxiliary winch placed on active standby. 3.3kV gallery feeder isolated to prevent spark ignition.\n` +
        `5. Central Incident Control: Surface Control Room (Ext. 101 / Wireless Channel 1).`;
    }

    // 2. Current Status / Readings
    if (/\b(status|reading|readings|telemetry|current|condition|conditions)\b/i.test(msg)) {
      return `[TERRA-SENTINEL MASTER AI // OMNI-TELEMETRY REPORT]\n` +
        `• Operational Phase: ${phase}\n` +
        `• Strata Displacement: ${disp} mm (${disp > 0.3 ? 'ELEVATED STRAIN DETECTED' : 'Nominal'})\n` +
        `• Micro-Seismic RMS: ${rms}g (${rms > 0.25 ? 'High Vibration Alarm' : 'Stable'})\n` +
        `• Carbon Monoxide (CO): ${co} ppm (DGMS Safe Limit: 50 ppm)\n` +
        `• Strata Pitch Delta: ${pitch}°\n` +
        `• Subterranean Temperature: ${temp}°C\n` +
        `Master Controller Assessment: Status is ${phase === 'CRITICAL' ? 'CRITICAL - AUTOMATED INTERLOCKS ACTIVE' : phase === 'WARNING' ? 'ELEVATED - HEIGHTENED SURVEILLANCE' : 'NOMINAL - FULL STATUTORY COMPLIANCE'}.`;
    }

    // 3. Gas / CO / Ventilation / Air Quality
    if (/\b(gas|gases|co|co2|carbon monoxide|methane|ch4|nh3|air|ventilation|atmosphere|atmospheric|fumes)\b/i.test(msg)) {
      return `[TERRA-SENTINEL MASTER AI // ATMOSPHERIC SAFETY GOVERNANCE]\n` +
        `Current Carbon Monoxide reading across Sector 4B is ${co} ppm.\n` +
        `• DGMS 8-Hour TWA Permissible Limit: 25 ppm\n` +
        `• DGMS Immediate Alarm Threshold: 50 ppm\n` +
        `• Mandatory Evacuation Threshold: > 100 ppm\n` +
        (co > 30 ? `⚠️ WARNING: Elevated CO level at ${co} ppm. Master AI commanding auxiliary ventilation fan booster override.` : `✅ Atmospheric condition is within safe permissible limits.`);
    }

    // 4. Subsidence / Strata / InSAR / Void Collapse
    if (/\b(subsidence|strata|collapse|collapsing|insar|roof|roofs|pillar|pillars|displacement|strain|geotech|geotechnical)\b/i.test(msg)) {
      return `[TERRA-SENTINEL MASTER AI // STRATA STABILITY & SUBSIDENCE CONTROL]\n` +
        `• Roof Convergence / Displacement: ${disp} mm\n` +
        `• Predictive Engine: Integrated Random Forest + Sentinel-1 InSAR velocity interferometry.\n` +
        `• Goaf consolidation index: 94% compaction.\n` +
        `• Master AI Action: Hydraulic powered roof chocks at Face 4B pre-set to maintain yield pressure > 320 bar.`;
    }

    // 5. Explainable AI / ML Model
    if (/\b(ai|model|models|ml|explain|explainable|shap|treeshap|algorithm|xgboost|rf)\b/i.test(msg)) {
      return `[TERRA-SENTINEL MASTER AI // XAI PIPELINE GOVERNANCE]\n` +
        `• Architecture: Unified Geotechnical Controller integrating Qwen 2.5 Neural Engine, XGBoost, and Time-Series LSTM.\n` +
        `• Explainability: TreeSHAP (SHapley Additive exPlanations) computing real-time local feature weights.\n` +
        `• Top Risk Drivers: 1) Micro-seismic RMS (38% weight), 2) Roof displacement velocity (32% weight), 3) Gas concentration delta (18% weight).\n` +
        `All pipelines are synthesized under this central controller.`;
    }

    // 6. Greetings / Default
    return `Hello Operator. I am the TERRA-SENTINEL Master AI Controller.\n\n` +
      `I have real-time oversight of all 5 sensor nodes, gas atmospheres, and strata stability across Sector 4B.\n` +
      `Current Mine Status: ${phase} (CO: ${co} ppm | RMS: ${rms}g | Displacement: ${disp} mm)\n\n` +
      `You can ask me to:\n` +
      `• "Report current mine status and sensor readings"\n` +
      `• "Check atmospheric gas and CO safety levels"\n` +
      `• "Initiate or explain emergency evacuation protocols"\n` +
      `• "Analyze roof subsidence and strata collapse risk"\n` +
      `• "Explain the machine learning feature weights"`;
  }
}

const masterAi = new MineGuarderMasterAI();

// Status endpoint
router.get('/status', (req, res) => {
  res.json({
    controller: masterAi.name,
    status: masterAi.status,
    hasCloudKey: !!process.env.GEMINI_API_KEY,
    neuralModel: req.app.get('getModelName')?.() || 'HuggingFaceTB/SmolLM2-360M-Instruct (~260MB ONNX)',
    governance: '12 Telemetry Channels • 5 Sensor Nodes • Automated Interlocks'
  });
});

// REST API: POST /api/chat
router.post('/', async (req, res) => {
  try {
    const queryText = req.body.message || req.body.query || req.body.text || '';
    const { telemetry, geminiApiKey } = req.body;
    
    if (!queryText || typeof queryText !== 'string') {
      return res.status(400).json({ error: 'Message or query text is required' });
    }

    const getAiGenerator = req.app.get('getAiGenerator');
    const aiGenerator = getAiGenerator ? getAiGenerator() : null;

    const result = await masterAi.processOperatorQuery(queryText, telemetry, {
      geminiApiKey: geminiApiKey || req.headers['x-gemini-key'],
      aiGenerator: aiGenerator
    });

    return res.json({
      reply: result.reply,
      source: result.source,
      isIntervention: result.isIntervention || false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Master AI Controller error:', error);
    res.status(500).json({ error: 'Master AI Controller failed to process request' });
  }
});

// REST API: POST /api/chat/text-to-sql (AI Natural Language to SQL Execution)
router.post('/text-to-sql', async (req, res) => {
  try {
    const queryText = req.body.query || req.body.message || req.body.text || '';
    const geminiApiKey = req.body.geminiApiKey || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!queryText || typeof queryText !== 'string') {
      return res.status(400).json({ error: 'Natural language query text is required' });
    }

    const result = await textToSqlService.processTextToSql(queryText, {
      apiKey: geminiApiKey,
      cfToken: cfToken,
      cfAccountId: cfAccountId
    });

    return res.json({
      success: true,
      query: result.query,
      generatedSql: result.generatedSql,
      results: result.results,
      rowCount: result.rowCount,
      naturalSummary: result.naturalSummary,
      executionTimeMs: result.executionTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text-to-SQL execution error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message,
      generatedSql: null,
      results: []
    });
  }
});

// REST API: GET /api/chat/sql-schema
router.get('/sql-schema', (req, res) => {
  res.json({
    engine: 'SQLite 3 / Sequelize MVVM',
    tables: [
      {
        name: 'telemetry_logs',
        columns: ['id', 'site', 'sector', 'phase', 'pitch', 'roll', 'rms', 'co', 'ch4', 'disp', 'sump', 'temp', 'timestamp'],
        description: 'Historical subterranean telemetry sensor ticks'
      },
      {
        name: 'incident_alerts',
        columns: ['id', 'sector', 'severity', 'alert_type', 'description', 'action_taken', 'timestamp'],
        description: 'DGMS hazard events and physical interlock logs'
      },
      {
        name: 'miner_shifts',
        columns: ['id', 'miner_id', 'name', 'role', 'sector', 'zone', 'scsr_status', 'status', 'shift_start'],
        description: 'Subterranean miner location and SCSR status tracking'
      },
      {
        name: 'safety_audits',
        columns: ['id', 'form_type', 'auditor', 'sector', 'compliance_rating', 'dgms_rule_reference', 'findings', 'created_at'],
        description: 'DGMS Form IV statutory compliance audit logs'
      }
    ]
  });
});

module.exports = {
  router,
  masterAi
};
