require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./db');

// Core Services & Routers
const telemetryService = require('./services/telemetryService');
const telemetryRoutes = require('./routes/telemetry');
const authRoutes = require('./routes/auth');
const { router: chatRoutes, masterAi } = require('./routes/chat');
const seedDatabase = require('./services/seedDatabase');

// Master AI Controller Initialization (SmolLM2-360M-Instruct / Cloud AI / DGMS Rule Core)
const MODEL_NAME = 'HuggingFaceTB/SmolLM2-360M-Instruct';
let latestAiAnalysis = masterAi.getDeterministicDirective('STABLE', 0.5, 0.15, 12.0, 0.1);
let currentAiPhase = null;
let generatingAi = false;

console.log(`🤖 MINE GUARDER MASTER AI online (Primary: ${MODEL_NAME} Serverless Engine / Multi-Tier AI).`);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

// Share Dependencies and Handlers across Express
app.set('io', io);
app.set('getModelName', () => MODEL_NAME);
app.set('getLatestAiAnalysis', () => latestAiAnalysis);
app.set('telemetryService', telemetryService);

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Safe Body Parser JSON Error Handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('[WARN] Malformed JSON payload received from hardware/client:', err.message);
    return res.status(400).json({ error: 'Malformed JSON payload', message: err.message });
  }
  next(err);
});

// View Engine & Static Assets
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Application View Routes
app.get('/', (req, res) => res.render('index', {
  title: 'MINE GUARDER OS - Live Telemetry & GIS | SIH 2026',
  activePage: 'live'
}));

app.get('/explainable-ml', (req, res) => res.render('explainable-ml', {
  title: 'MINE GUARDER OS - Explainable ML & Subsidence Risk | SIH 2026',
  activePage: 'ml'
}));

app.get('/gods-eye-view', (req, res) => res.render('gods-eye-view', {
  title: "MINE GUARDER OS // GOD'S EYE VIEW - 3D Satellite & Spatial Intel",
  activePage: 'gods-eye'
}));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/telemetry', telemetryRoutes);

// WebSockets for Live Real-Time Telemetry & Master AI Chat
io.on('connection', (socket) => {
  console.log('Control Room Client connected to Master AI stream');

  // Push immediate state snapshot to new connection
  socket.emit('telemetry', {
    ...telemetryService.getSnapshot(),
    aiText: latestAiAnalysis
  });

  // Handle incoming operator messages via WebSocket
  socket.on('chat_message', async (data) => {
    const text = (data && data.message) || (typeof data === 'string' ? data : '');
    const user = (data && data.user) || 'Mine Operator';
    const geminiApiKey = (data && data.geminiApiKey) || process.env.GEMINI_API_KEY;
    
    if (!text) return;

    const currentTelemetry = telemetryService.getSnapshot();

    // Broadcast user's message immediately to all connected terminals
    io.emit('chat_broadcast', {
      sender: user,
      text: text,
      timestamp: new Date().toLocaleTimeString(),
      isAi: false
    });

    // Process through the Single Master AI Controller
    const result = await masterAi.processOperatorQuery(text, currentTelemetry, {
      geminiApiKey
    });

    // If the operator intervened, directly apply physical simulation overrides
    if (result.isIntervention) {
      const { snapshot, summary } = telemetryService.applyOperatorOverride(text);
      if (summary) {
        latestAiAnalysis = summary;
      }
      // Immediately emit updated telemetry to all dashboards
      io.emit('telemetry', {
        ...snapshot,
        aiText: latestAiAnalysis
      });
    }

    // Emit Master AI response
    io.emit('chat_broadcast', {
      sender: 'MINE GUARDER MASTER AI',
      text: result.reply,
      source: result.source,
      isIntervention: result.isIntervention || false,
      timestamp: new Date().toLocaleTimeString(),
      isAi: true
    });
  });
});

// Autonomous Continuous Simulation & Telemetry Emission Loop (1000ms)
setInterval(() => {
  const snapshot = telemetryService.simulateTick();

  // Master AI Continuous Telemetry Analysis on Phase Transition
  if (snapshot.phase !== currentAiPhase) {
    currentAiPhase = snapshot.phase;
    if (!generatingAi) {
      generatingAi = true;
      masterAi.analyzeTelemetryStream(snapshot).then(directive => {
        latestAiAnalysis = directive;
        generatingAi = false;
      }).catch(e => {
        latestAiAnalysis = masterAi.getDeterministicDirective(
          snapshot.phase,
          snapshot.pitch,
          snapshot.rms,
          snapshot.co,
          snapshot.disp
        );
        generatingAi = false;
      });
    }
  }

  io.emit('telemetry', {
    ...snapshot,
    aiText: latestAiAnalysis
  });
}, 1000);

// Database Initialization, Seeding and Server Start
sequelize.sync().then(async () => {
  console.log('Database synced');
  await seedDatabase();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MINE GUARDER Master Controller running on port ${PORT} (0.0.0.0:${PORT})`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});
