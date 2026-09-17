const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const RENDER_BACKEND_URL = process.env.RENDER_URL || 'https://mine-backend-1.onrender.com';
const MODE = process.argv[2] || 'local'; // 'local', 'render', or 'localtunnel'

// Path to cloudflared.exe (check root workspace and local directory)
const rootCloudflared = path.resolve(__dirname, '..', 'cloudflared.exe');
const localCloudflared = path.resolve(__dirname, 'cloudflared.exe');
const cloudflaredBin = fs.existsSync(rootCloudflared) 
  ? rootCloudflared 
  : fs.existsSync(localCloudflared) 
    ? localCloudflared 
    : 'cloudflared';

console.log('====================================================');
console.log('  MINE GUARDER OS // PUBLIC TUNNEL MANAGER');
console.log('====================================================');

if (MODE === 'localtunnel') {
  startLocaltunnel();
} else if (MODE === 'render') {
  startCloudflareTunnel(RENDER_BACKEND_URL, 'Render Cloud Backend');
} else {
  startCloudflareTunnel(`http://localhost:${PORT}`, `Local Server (Port ${PORT})`);
}

function startCloudflareTunnel(targetUrl, description) {
  console.log(`[TUNNEL] Launching Cloudflare Public Tunnel for: ${description} (${targetUrl})`);
  
  let cf;
  try {
    cf = spawn(cloudflaredBin, ['tunnel', '--url', targetUrl], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });
  } catch (err) {
    console.warn(`[WARN] Cloudflare binary spawn failed (${err.message}). Falling back to localtunnel...`);
    return startLocaltunnel();
  }

  let urlDetected = false;
  let allStderr = '';

  const handleOutput = (data) => {
    const output = data.toString();
    allStderr += output;
    const match = output.match(/https:\/\/(?!api\.)[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !urlDetected) {
      urlDetected = true;
      const tunnelUrl = match[0];
      console.log('\n====================================================');
      console.log('  PUBLIC TUNNEL ACTIVE (Cloudflare Quick Tunnel)');
      console.log(`  Target:     ${targetUrl}`);
      console.log(`  Public URL: ${tunnelUrl}`);
      console.log('====================================================');
      console.log('\nUse this URL for:');
      console.log(`1. ESP32 LoRa Gateway SERVER_URL: ${tunnelUrl}/api/telemetry`);
      console.log(`2. Web Dashboard Backend: Set terra_backend_url in localStorage or window.TERRA_BACKEND_URL\n`);
    }
  };

  cf.stdout.on('data', handleOutput);
  cf.stderr.on('data', handleOutput);

  cf.on('error', (err) => {
    console.warn(`[WARN] Cloudflare process error (${err.message}). Falling back to localtunnel...`);
    startLocaltunnel();
  });

  cf.on('close', (code) => {
    if (!urlDetected && code !== 0) {
      console.warn(`[WARN] Cloudflare exited with code ${code}. Falling back to localtunnel...`);
      if (allStderr.trim()) console.warn(`Details: ${allStderr.trim().split('\n').pop()}`);
      startLocaltunnel();
    } else {
      console.log(`[TUNNEL] Cloudflare tunnel stopped (code: ${code})`);
    }
  });
}

function startLocaltunnel() {
  console.log(`[TUNNEL] Launching Localtunnel for Local Port ${PORT}...`);
  try {
    const localtunnel = require('localtunnel');
    localtunnel({ port: Number(PORT) }).then((tunnel) => {
      console.log('\n====================================================');
      console.log('  PUBLIC TUNNEL ACTIVE (Localtunnel)');
      console.log(`  Target:     http://localhost:${PORT}`);
      console.log(`  Public URL: ${tunnel.url}`);
      console.log('====================================================\n');
      console.log(`1. ESP32 LoRa Gateway SERVER_URL: ${tunnel.url}/api/telemetry`);
      console.log(`2. Web Dashboard Backend: Set terra_backend_url in localStorage or window.TERRA_BACKEND_URL\n`);

      tunnel.on('close', () => {
        console.log('[TUNNEL] Localtunnel closed');
      });
    }).catch((err) => {
      console.error('[ERROR] Failed to start Localtunnel:', err.message);
    });
  } catch (err) {
    console.error('[ERROR] Localtunnel module error:', err.message);
  }
}
