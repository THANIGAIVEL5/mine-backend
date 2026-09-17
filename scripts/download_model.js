/**
 * Model Pre-caching Script for Render / Docker Builds
 * Downloads and caches HuggingFaceTB/SmolLM2-360M-Instruct (Q4 ONNX) during build time.
 */
const { pipeline, env } = require('@huggingface/transformers');
const path = require('path');

// Set unified cache directory
env.cacheDir = path.join(__dirname, '..', '.cache');

const MODEL_NAME = process.env.LOCAL_AI_MODEL || 'HuggingFaceTB/SmolLM2-360M-Instruct';

async function downloadModel() {
  console.log(`====================================================`);
  console.log(`  PRE-CACHING MODEL FOR RENDER: ${MODEL_NAME}`);
  console.log(`  Cache Directory: ${env.cacheDir}`);
  console.log(`====================================================`);
  try {
    const generator = await pipeline('text-generation', MODEL_NAME, {
      dtype: 'q4',
      device: 'cpu'
    });
    console.log(`✅ Model ${MODEL_NAME} downloaded and pre-cached successfully for Render deployment!`);
    process.exit(0);
  } catch (error) {
    console.warn(`⚠️ Model download notice during build (${error.message}). Will load at runtime.`);
    process.exit(0); // Do not fail build if network times out
  }
}

downloadModel();
