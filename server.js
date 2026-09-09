require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./db');
const { pipeline, env } = require('@huggingface/transformers');

const os = require('os');

// Backend AI Setup
let aiGenerator = null;
let latestAiAnalysis = "Sentinel AI Geotechnical Engine Active.";
let currentAiPhase = null;
let generatingAi = false;

function generateExpertAiAnalysis(p, pitchVal, rmsVal, coVal) {
  switch (p) {
    case 'STABLE':
      return `[TERRA-SENTINEL AI] Strata acoustic baseline stable. Micro-seismic RMS at ${rmsVal.toFixed(2)}g; methane/CO levels within DGMS permissible limits. No void subsidence detected.`;
    case 'WARNING':
      return `[TERRA-SENTINEL AI] ALERT: Micro-fracture propagation detected at Face 4B. Vibration RMS elevated to ${rmsVal.toFixed(2)}g with pitch delta ${pitchVal.toFixed(1)}°. Recommend automated hydraulic support pre-tensioning.`;
    case 'CRITICAL':
      return `[TERRA-SENTINEL AI] CRITICAL EVACUATION WARNING: Shear displacement exceedance! CO gas spike at ${Math.floor(coVal)} ppm with high pillar strain. Immediate workforce withdrawal required to safety refuge bay.`;
    case 'RECOVERY':
      return `[TERRA-SENTINEL AI] Post-ventilation stabilization underway. Atmospheric dilution active; rock mass stress dissipating. Awaiting multi-gas sensor clearance.`;
    default:
      return `[TERRA-SENTINEL AI] Real-time sensor telemetry streaming. Predictive subsidence model active.`;
  }
}

async function initAi() {
    // Render Free Tier has 512MB RAM; only load heavy local model if memory > 1GB or explicitly requested
    const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
    console.log(`Available System Memory: ${totalMemMb}MB`);
    
    if (totalMemMb < 1024 && process.env.ENABLE_LOCAL_AI !== 'true') {
        console.log("Low memory environment detected. Operating in High-Efficiency Geotechnical AI Mode.");
        latestAiAnalysis = generateExpertAiAnalysis('STABLE', 0.5, 0.15, 12.0);
        return;
    }

    try {
        console.log("Loading AI Model on Server...");
        aiGenerator = await pipeline('text-generation', 'HuggingFaceTB/SmolLM2-135M-Instruct', {
            dtype: 'q8'
        });
        console.log("Server AI Model Loaded Successfully!");
        latestAiAnalysis = "Server AI Model Loaded. Awaiting telemetry...";
    } catch(e) {
        console.error("AI Load Error:", e);
        latestAiAnalysis = generateExpertAiAnalysis('STABLE', 0.5, 0.15, 12.0);
    }
}
initAi();

const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static assets from public folder

// View Routes
app.get('/', (req, res) => res.render('index'));
app.get('/explainable-ml', (req, res) => res.render('explainable-ml'));

// Routes
app.use('/api/auth', authRoutes);

// WebSockets for live telemetry
io.on('connection', (socket) => {
  console.log('Client connected for live telemetry');
});

// State Machine Scenario Variables
let ticks = 0;
let phase = 'STABLE';

// Baseline values
let pitch = 0.5;
let roll = -0.2;
let rms = 0.15;
let co = 12.0;
let disp = 0.0;
let temp = 38.6;
let sump = 2.74;

setInterval(() => {
  ticks++;
  
  // Phase logic (Approx 75s loop assuming 1 tick = 1 sec)
  if (ticks <= 30) {
    phase = 'STABLE';
  } else if (ticks <= 50) {
    phase = 'WARNING';
  } else if (ticks <= 65) {
    phase = 'CRITICAL';
  } else if (ticks <= 75) {
    phase = 'RECOVERY';
  } else {
    ticks = 0; // Loop back
  }

  // Jitter for realism
  const jitter = (mag) => (Math.random() - 0.5) * mag;

  switch(phase) {
    case 'STABLE':
      pitch = 0.5 + jitter(0.2);
      roll = -0.2 + jitter(0.2);
      rms = 0.15 + jitter(0.05);
      co = 12.0 + jitter(1.0);
      disp = 0.1 + jitter(0.05);
      break;

    case 'WARNING':
      // Gradual buildup
      pitch += 0.08 + jitter(0.1);
      roll -= 0.05 + jitter(0.1);
      rms += 0.01 + jitter(0.02);
      co += 0.5 + jitter(1.0);
      disp += 0.05 + jitter(0.02);
      break;

    case 'CRITICAL':
      // Dangerous spikes
      pitch += 0.25 + jitter(0.3);
      rms += 0.03 + jitter(0.05);
      co += 1.5 + jitter(2.0);
      disp += 0.2 + jitter(0.1);
      break;

    case 'RECOVERY':
      // Rapid fallback to baseline
      pitch += (0.5 - pitch) * 0.2;
      roll += (-0.2 - roll) * 0.2;
      rms += (0.15 - rms) * 0.2;
      co += (12.0 - co) * 0.2;
      disp += (0.1 - disp) * 0.2;
      break;
  }

  // Secondary slowly drifting values
  temp += jitter(0.05);
  sump += 0.01 + jitter(0.01);

  // Backend AI Generation Logic
  if (phase !== currentAiPhase) {
      currentAiPhase = phase;
      if (aiGenerator && !generatingAi) {
          generatingAi = true;
          latestAiAnalysis = `Analyzing ${phase} telemetry locally...`;
          
          const prompt = `Current Phase: ${phase}. Telemetry: Pitch ${pitch.toFixed(1)} deg, Vibration RMS ${rms.toFixed(2)}g, Gas CO ${Math.floor(co)} ppm. Give a short, urgent 1-sentence analysis.`;
          const messages = [
              { role: 'system', content: 'You are an emergency AI geotechnical analyst for a coal mine. Respond with a very short (max 2 sentences), urgent assessment based on the sensor data provided.' },
              { role: 'user', content: prompt }
          ];

          aiGenerator(messages, { max_new_tokens: 40, temperature: 0.7, do_sample: true }).then(output => {
              const text = output[0].generated_text;
              latestAiAnalysis = text[text.length - 1].content || text;
              generatingAi = false;
          }).catch(e => {
              latestAiAnalysis = generateExpertAiAnalysis(phase, pitch, rms, co);
              generatingAi = false;
          });
      } else {
          latestAiAnalysis = generateExpertAiAnalysis(phase, pitch, rms, co);
      }
  }

  io.emit('telemetry', {
    latency: Math.floor(Math.random() * 15) + 18,
    rssi: -Math.floor(Math.random() * 10) - 75,
    pkt: Math.floor(Math.random() * 5) + 40,
    pitch: pitch,
    roll: roll,
    disp: disp,
    rms: rms,
    p2p: rms * 3.14,
    fft: 48.0 + jitter(1.0),
    temp: temp,
    aqi: 180 + Math.floor(co * 1.5),
    co: Math.floor(co),
    nh3: 4 + Math.floor(jitter(2)),
    co2: 1120 + Math.floor(co * 8),
    sump: sump,
    phase: phase,
    aiText: latestAiAnalysis
  });
}, 1000);

// Sync Database and Start Server
sequelize.sync().then(() => {
  console.log('Database synced');
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});
