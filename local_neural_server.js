const http = require('http');
const { pipeline } = require('@huggingface/transformers');

let generator = null;
const MODEL_NAME = process.env.LOCAL_AI_MODEL || 'HuggingFaceTB/SmolLM2-1.7B-Instruct';

async function loadModel() {
  console.log(`[NEURAL SERVER] Initializing on-device language model: ${MODEL_NAME}...`);
  try {
    generator = await pipeline('text-generation', MODEL_NAME, { dtype: 'q4' });
    console.log(`[NEURAL SERVER] Natural language model ${MODEL_NAME} is active on backend!`);
  } catch (err) {
    console.error(`[NEURAL SERVER] Model initialization error:`, err.message);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/generate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const prompt = payload.prompt || '';
        const maxTokens = payload.max_tokens || 80;

        if (!generator) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Model loading in progress' }));
        }

        const inputData = (payload.messages && payload.messages.length > 0) ? payload.messages : (payload.prompt || '');
        const output = await generator(inputData, {
          max_new_tokens: maxTokens,
          temperature: 0.7,
          do_sample: true
        });

        const gen = output[0]?.generated_text;
        const text = Array.isArray(gen) ? gen[gen.length - 1].content : (typeof gen === 'string' ? gen : '');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ generated_text: text, model: MODEL_NAME }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 5005;
server.listen(PORT, () => {
  console.log(`[NEURAL SERVER] Local neural language microservice running on http://127.0.0.1:${PORT}`);
  loadModel();
});
