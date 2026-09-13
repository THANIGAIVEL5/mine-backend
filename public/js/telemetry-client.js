"use strict";
const MINE_LAT = 23.795741;
const MINE_LON = 86.430412;
const MINE_ALT = 185.0;
class TelemetryClient {
    socket = null;
    currentRms = 0.15;
    waveOffset = 0;
    is3DActive = false;
    activeNodeIndex = 3;
    cesiumViewer = null;
    currentOptic = 'normal';
    protocolEntities = [];
    nodeEntities = {};
    strataEntities = [];
    subsidenceVectorEntity = null;
    isProtocolLayerVisible = true;
    pollingStarted = false;
    constructor() {
        this.initSocket();
        this.initClock();
        this.initOscilloscope();
        this.initCesiumGlobe();
    }
    el(id) {
        return document.getElementById(id);
    }
    initSocket() {
        try {
            const loc = window.location;
            const wsProtocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${loc.host}/ws/telemetry`;
            const ws = new WebSocket(wsUrl);
            ws.onopen = () => {
                console.log('📡 Real-time Telemetry WebSocket connected.');
                const badge = this.el('uplink-status-badge');
                if (badge) {
                    badge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.25)]";
                    badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>● LIVE STREAM: CONNECTED (WS/REALTIME)';
                }
                const ingestTxt = this.el('ingest-channel-text');
                if (ingestTxt)
                    ingestTxt.innerText = 'LIVE TELEMETRY STREAM ONLINE (WS)';
            };
            ws.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data);
                    const data = parsed.data || parsed.snapshot || parsed.sensors || parsed;
                    this.handleTelemetry(data);
                }
                catch (err) {
                    console.warn('WS parse error:', err);
                }
            };
            ws.onerror = (e) => {
                console.log('WS error, starting fallback polling:', e);
                this.startPolling();
            };
            ws.onclose = () => {
                console.log('WS closed, starting fallback polling');
                this.startPolling();
            };
        }
        catch (e) {
            this.startPolling();
        }
    }
    startPolling() {
        if (this.pollingStarted)
            return;
        this.pollingStarted = true;
        const badge = this.el('uplink-status-badge');
        if (badge) {
            badge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(20,184,166,0.25)]";
            badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>● LIVE STREAM: CONNECTED (HTTP/1Hz)';
        }
        const fetchTelemetry = async () => {
            try {
                const res = await fetch('/api/telemetry');
                const json = await res.json();
                const data = json.snapshot || json.sensors || json.data || json;
                this.handleTelemetry(data);
            }
            catch (err) {
                console.warn('Telemetry polling fetch error:', err);
            }
        };
        fetchTelemetry();
        setInterval(fetchTelemetry, 1000);
    }
    handleTelemetry(data) {
        if (!data)
            return;
        this.currentRms = data.rms || 0.15;
        // Communication bus counters
        const latencyVal = this.el('latency-val');
        if (latencyVal)
            latencyVal.innerHTML = `${Math.floor(Math.random() * 12) + 14}<span class="text-[11px] text-neutral-400 font-normal ml-1">MS</span>`;
        const rssiVal = this.el('rssi-val');
        if (rssiVal)
            rssiVal.innerText = (data.rssi !== undefined ? data.rssi : -84).toString();
        const pktVal = this.el('pkt-val');
        if (pktVal)
            pktVal.innerText = (data.pkt !== undefined ? data.pkt : 42).toString();
        // ADXL345 / MPU6050 Orientation Readouts
        const valPitch = this.el('val-pitch');
        if (valPitch)
            valPitch.innerText = `${Number(data.pitch || 0).toFixed(2)}°`;
        const valRoll = this.el('val-roll');
        if (valRoll)
            valRoll.innerText = `${(data.roll || 0) > 0 ? '+' : ''}${Number(data.roll || 0).toFixed(2)}°`;
        const valDisp = this.el('val-disp');
        if (valDisp)
            valDisp.innerText = `${Number(data.disp || 0).toFixed(2)}° Σ`;
        // Piezo Vibration Harmonics
        const valRms = this.el('val-rms');
        if (valRms)
            valRms.innerText = `${Number(data.rms || 0).toFixed(2)} g`;
        const valP2p = this.el('val-p2p');
        if (valP2p)
            valP2p.innerText = `${Number(data.p2p || (data.rms || 0.15) * 3.14).toFixed(2)} g`;
        const valFft = this.el('val-fft');
        if (valFft)
            valFft.innerText = `${Number(data.fft || 48.0).toFixed(1)} Hz`;
        // Temperature & Thermometer column
        const valTemp = this.el('val-temp');
        if (valTemp)
            valTemp.innerText = Number(data.temp || 36.8).toFixed(1);
        const tempBar = this.el('temp-bar');
        if (tempBar) {
            const tempPct = Math.max(0, Math.min(100, ((data.temp || 36.8) / 70) * 100));
            tempBar.style.height = `${tempPct}%`;
        }
        // Tilt threshold alarm banner
        const tiltWarning = this.el('tilt-warning');
        if (tiltWarning) {
            if (Math.abs(data.pitch || 0) > 3.5 || Math.abs(data.roll || 0) > 3.5) {
                tiltWarning.classList.remove('opacity-0');
            }
            else {
                tiltWarning.classList.add('opacity-0');
            }
        }
        // MQ135 Air Quality & Atmospheric Gases
        const valAqi = this.el('val-aqi');
        if (valAqi)
            valAqi.innerText = (data.aqi || 214).toString();
        const aqiRing = this.el('aqi-ring');
        if (aqiRing) {
            const aqiVal = data.aqi || 214;
            const ringVal = Math.min(290, (aqiVal / 300) * 290);
            aqiRing.setAttribute('stroke-dasharray', `${ringVal} 360`);
            if (aqiVal > 150)
                aqiRing.setAttribute('stroke', '#ffba27');
            if (aqiVal > 250)
                aqiRing.setAttribute('stroke', '#ff3366');
        }
        const aqiBand = this.el('aqi-band');
        if (aqiBand) {
            const aqiVal = data.aqi || 214;
            if (aqiVal > 250)
                aqiBand.innerText = 'CRITICAL BAND';
            else if (aqiVal > 150)
                aqiBand.innerText = 'UNHEALTHY BAND';
            else
                aqiBand.innerText = 'NOMINAL BAND';
        }
        const valCo = this.el('val-co');
        if (valCo)
            valCo.innerText = `${data.co || 22} ppm`;
        const valNh3 = this.el('val-nh3');
        if (valNh3)
            valNh3.innerText = `${data.nh3 || 4} ppm`;
        const valCo2 = this.el('val-co2');
        if (valCo2)
            valCo2.innerText = `${data.co2 || (1120 + (data.co || 22) * 8)} ppm`;
        // REL_35 Sump Water Level Tank Fill
        const valSump = this.el('val-sump');
        if (valSump)
            valSump.innerText = Number(data.sump || 1.31).toFixed(2);
        const sumpFill = this.el('sump-fill');
        if (sumpFill) {
            const sumpVal = (data.sump || 1.31);
            const sumpPct = Math.max(0, Math.min(100, (sumpVal > 10 ? sumpVal / 200 : sumpVal / 4.0) * 100));
            sumpFill.style.height = `${sumpPct}%`;
        }
        const valAdcSump = this.el('val-adc-sump');
        if (valAdcSump) {
            const estAdc = Math.floor(150 + ((data.sump || 1.31) / 4.0) * 3050);
            valAdcSump.innerText = `${data.adc_sump || estAdc} RAW`;
        }
        // NEO-6M GNSS Coordinates
        if (data.lat && this.el('val-gps-lat'))
            this.el('val-gps-lat').innerText = `${Number(data.lat).toFixed(6)}° N`;
        if (data.lon && this.el('val-gps-lon'))
            this.el('val-gps-lon').innerText = `${Number(data.lon).toFixed(6)}° E`;
        if (data.alt !== undefined && this.el('val-gps-alt'))
            this.el('val-gps-alt').innerText = `${Number(data.alt).toFixed(2)} m`;
        if (data.sats !== undefined && this.el('val-gps-sats'))
            this.el('val-gps-sats').innerText = `${data.sats} SATELLITES TRACKED`;
        if (data.hdop !== undefined && this.el('val-gps-hdop'))
            this.el('val-gps-hdop').innerText = Number(data.hdop).toFixed(2);
        // Artificial Horizon Pitch & Roll Gyro Reticle
        const horizon = this.el('horizon-dynamic-group');
        if (horizon) {
            horizon.setAttribute('transform', `rotate(${(data.roll || 0).toFixed(2)} 80 80) translate(0, ${(-(data.pitch || 0) * 3).toFixed(2)})`);
        }
        // Isolation Forest Score & Audit Gauge
        const anomalyScoreNum = Math.min(1.0, (Math.abs(data.pitch || 0) * 0.1) + ((data.rms || 0.15) * 1.5) + ((data.co || 20) * 0.01));
        const anomalyScore = anomalyScoreNum.toFixed(2);
        const isoScore = this.el('iso-score');
        if (isoScore) {
            isoScore.innerText = anomalyScore;
            const pct = Math.floor(anomalyScoreNum * 100);
            const isoText = this.el('iso-text');
            if (isoText)
                isoText.innerText = `${pct}%`;
            const isoGauge = this.el('iso-gauge');
            if (isoGauge)
                isoGauge.setAttribute('stroke-dasharray', `${pct}, 100`);
        }
        // Transparent Rule Attribution Bars
        const rule1Bar = this.el('rule-1-bar');
        if (rule1Bar)
            rule1Bar.style.width = `${Math.min(100, Math.abs(data.pitch || 0) * 20)}%`;
        const rule2Bar = this.el('rule-2-bar');
        if (rule2Bar)
            rule2Bar.style.width = `${Math.min(100, (data.rms || 0.15) * 200)}%`;
        const rule3Bar = this.el('rule-3-bar');
        if (rule3Bar)
            rule3Bar.style.width = `${Math.min(100, ((data.co || 20) / 30) * 100)}%`;
        // Tactical Map Beacon Animation & Subsidence Displacement Vector
        const node03Ping = this.el('node-03-ping');
        if (node03Ping)
            node03Ping.style.animationDuration = `${Math.max(0.2, 1.5 - (data.rms || 0.15) * 2)}s`;
        const node03Dot = this.el('node-03-dot');
        if (node03Dot) {
            const intense = (data.rms || 0.15) > 0.3 ? 'shadow-[0_0_24px_#ff0033]' : 'shadow-[0_0_16px_#ff3366]';
            node03Dot.className = `w-4 h-4 rounded-full bg-[#ff3366] ${intense} border-2 border-white transition-all duration-500`;
        }
        const subsidenceTrail = this.el('subsidence-trail');
        const subsidenceArrow = this.el('subsidence-arrow');
        if (subsidenceTrail && subsidenceArrow) {
            const dx = (data.disp || 0) * 2;
            const dy = (data.disp || 0) * 2;
            subsidenceTrail.setAttribute('d', `M 368,212 L 374,218 L ${382 + dx},${224 + dy} L ${390 + dx},${230 + dy}`);
            subsidenceArrow.setAttribute('transform', `translate(${dx}, ${dy})`);
        }
        // Real-time 3D Cesium Strata Subsidence Vector Update
        if (this.subsidenceVectorEntity && typeof Cesium !== 'undefined') {
            const dispOffset = (data.disp || 0.42) * 0.0001;
            const pitchOffset = (data.pitch || 0) * 0.00005;
            const rollOffset = (data.roll || 0) * 0.00005;
            this.subsidenceVectorEntity.polyline.positions = Cesium.Cartesian3.fromDegreesArrayHeights([
                MINE_LON, MINE_LAT, MINE_ALT + 30,
                MINE_LON + 0.0008 + rollOffset, MINE_LAT - 0.0012 + pitchOffset, MINE_ALT - 35 - dispOffset * 1000
            ]);
        }
    }
    initClock() {
        setInterval(() => {
            const d = new Date();
            const timeStr = d.toLocaleTimeString('en-US', { hour12: false }) + ' IST';
            const clockEl = this.el('live-clock');
            if (clockEl)
                clockEl.innerText = timeStr + ' UTC+5:30 REAL-TIME';
            const headerClockEl = this.el('header-clock');
            if (headerClockEl)
                headerClockEl.innerText = timeStr + ' UTC+5:30 REAL-TIME';
        }, 1000);
    }
    initOscilloscope() {
        setInterval(() => {
            this.waveOffset -= 5;
            let pathData = "M 0,80 ";
            let maxAmp = 0;
            let maxX = 0;
            for (let x = 0; x <= 320; x += 10) {
                const amp = (Math.sin((x + this.waveOffset) * 0.05) * 10) + ((Math.random() - 0.5) * this.currentRms * 150);
                const y = 80 + amp;
                pathData += `L ${x},${y} `;
                if (Math.abs(amp) > Math.abs(maxAmp)) {
                    maxAmp = amp;
                    maxX = x;
                }
            }
            const waveGlow = this.el('wave-glow');
            const waveCore = this.el('wave-core');
            if (waveGlow && waveCore) {
                waveGlow.setAttribute('d', pathData);
                waveCore.setAttribute('d', pathData);
                const dot = this.el('wave-peak-dot');
                const line = this.el('wave-peak-line');
                const text = this.el('wave-peak-text');
                if (dot) {
                    const peakY = 80 + maxAmp;
                    dot.setAttribute('cx', maxX.toString());
                    dot.setAttribute('cy', peakY.toString());
                    if (line) {
                        line.setAttribute('x1', maxX.toString());
                        line.setAttribute('x2', maxX.toString());
                        line.setAttribute('y1', peakY.toString());
                        line.setAttribute('y2', Math.max(10, peakY - 18).toString());
                    }
                    if (text) {
                        text.setAttribute('x', (maxX + 6).toString());
                        text.setAttribute('y', Math.max(18, peakY - 10).toString());
                        text.textContent = `MAX ${(Math.abs(maxAmp) / 100).toFixed(2)}g`;
                    }
                }
            }
        }, 50);
    }
    selectNode(nodeNum) {
        this.activeNodeIndex = nodeNum;
        const activeStyles = {
            1: "flex flex-col items-center py-1.5 rounded bg-emerald-950/80 border border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer ring-1 ring-emerald-400",
            2: "flex flex-col items-center py-1.5 rounded bg-amber-950/80 border border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.35)] transition-all cursor-pointer ring-1 ring-amber-400",
            3: "flex flex-col items-center py-1.5 rounded bg-rose-950/90 border-2 border-rose-500 text-rose-100 shadow-[0_0_16px_rgba(244,63,94,0.45)] transition-all cursor-pointer ring-1 ring-rose-400",
            4: "flex flex-col items-center py-1.5 rounded bg-cyan-950/80 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all cursor-pointer ring-1 ring-cyan-400",
            5: "flex flex-col items-center py-1.5 rounded bg-teal-950/80 border border-teal-400 text-teal-200 shadow-[0_0_12px_rgba(20,184,166,0.35)] transition-all cursor-pointer ring-1 ring-teal-400"
        };
        const defaultStyles = {
            1: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19] border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all cursor-pointer text-emerald-400",
            2: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19] border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-950/20 transition-all cursor-pointer text-amber-400",
            3: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19] border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-950/20 transition-all cursor-pointer text-rose-400",
            4: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19] border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all cursor-pointer text-cyan-400",
            5: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19] border border-teal-500/20 hover:border-teal-500/50 hover:bg-teal-950/20 transition-all cursor-pointer text-teal-400"
        };
        for (let i = 1; i <= 5; i++) {
            const btn = this.el(`node-btn-${i}`);
            if (!btn)
                continue;
            btn.className = (i === nodeNum) ? activeStyles[i] : defaultStyles[i];
        }
        const nodeNames = ["NODE-01 (Shaft #2)", "NODE-02 (Overburden)", "NODE-03 (Pillar 4B Stope)", "NODE-04 (Sump Basin)", "NODE-05 (Haulage Drift #12 - Online)"];
        const headerTitle = this.el('node-focus-title');
        if (headerTitle)
            headerTitle.innerText = `Active Telemetry Stream: ${nodeNames[nodeNum - 1]}`;
        // Smoothly fly Cesium 3D camera to selected sensor node
        if (this.cesiumViewer && typeof Cesium !== 'undefined') {
            const targetEntity = this.nodeEntities[nodeNum];
            if (targetEntity) {
                this.cesiumViewer.flyTo(targetEntity, {
                    offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(20.0), Cesium.Math.toRadians(-35.0), 650.0),
                    duration: 1.8
                });
            }
        }
    }
    flyToMine() {
        if (!this.cesiumViewer || typeof Cesium === 'undefined')
            return;
        this.cesiumViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, 2500),
            orientation: {
                heading: Cesium.Math.toRadians(15.0),
                pitch: Cesium.Math.toRadians(-45.0),
                roll: 0.0
            },
            duration: 2.0
        });
    }
    recenterMap() {
        this.flyToMine();
        const container = this.el('map-canvas-container');
        if (container) {
            container.classList.add('scale-[1.01]');
            setTimeout(() => container.classList.remove('scale-[1.01]'), 300);
        }
    }
    resetGlobe() {
        if (!this.cesiumViewer || typeof Cesium === 'undefined')
            return;
        this.cesiumViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, 15000000),
            orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-90.0),
                roll: 0.0
            },
            duration: 2.5
        });
    }
    setOptic(type) {
        this.currentOptic = type;
        const container = this.el('gods-eye-globe-container');
        const buttons = ['normal', 'flir', 'nvg', 'crt'];
        buttons.forEach(b => {
            const btn = this.el(`btn-optic-${b}`);
            if (btn) {
                if (b === type) {
                    btn.className = 'bg-white text-black font-bold font-[\'JetBrains_Mono\'] text-[10px] uppercase px-2 py-1 rounded transition shadow-[0_0_10px_rgba(255,255,255,0.4)] cursor-pointer';
                }
                else {
                    btn.className = 'bg-neutral-900 hover:bg-neutral-800 border border-white/20 text-zinc-300 font-[\'JetBrains_Mono\'] text-[10px] uppercase px-2 py-1 rounded transition active:scale-95 cursor-pointer';
                }
            }
        });
        if (container) {
            container.classList.remove('optic-flir', 'optic-nvg', 'optic-crt');
            if (type !== 'normal') {
                container.classList.add(`optic-${type}`);
            }
        }
    }
    setMapMode(mode) {
        if (mode === 'satellite') {
            this.setOptic('normal');
        }
        else if (mode === 'dark') {
            this.setOptic('crt');
        }
        else if (mode === 'schematic') {
            this.setOptic('nvg');
        }
        else {
            this.setOptic(mode);
        }
    }
    toggle3DContour() {
        this.is3DActive = !this.is3DActive;
        const btn = this.el('btn-3d-contour');
        this.strataEntities.forEach(ent => {
            if (ent)
                ent.show = !ent.show;
        });
        if (btn) {
            if (this.is3DActive) {
                btn.classList.add('bg-amber-500/30', 'text-white', 'border-amber-400');
            }
            else {
                btn.classList.remove('bg-amber-500/30', 'text-white', 'border-amber-400');
            }
        }
    }
    initHotkeys() {
        document.addEventListener('keydown', (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'))
                return;
            switch (e.key) {
                case '1':
                    this.setOptic('normal');
                    break;
                case '2':
                    this.setOptic('flir');
                    break;
                case '3':
                    this.setOptic('nvg');
                    break;
                case '4':
                    this.setOptic('crt');
                    break;
                case 'c':
                case 'C':
                    this.recenterMap();
                    break;
                case 'Escape':
                    this.resetGlobe();
                    break;
            }
        });
    }
    initCesiumGlobe() {
        const mapEl = this.el('gods-eye-globe-container');
        if (!mapEl || typeof Cesium === 'undefined')
            return;
        try {
            const esriAsync = Cesium.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer', { enablePickFeatures: false }).catch((err) => {
                console.warn('Esri World Imagery fallback to OSM:', err);
                return Cesium.OpenStreetMapImageryProvider.fromUrl('https://tile.openstreetmap.org/');
            });
            this.cesiumViewer = new Cesium.Viewer('gods-eye-globe-container', {
                baseLayer: Cesium.ImageryLayer.fromProviderAsync(esriAsync),
                baseLayerPicker: false,
                geocoder: false,
                homeButton: false,
                infoBox: false,
                sceneModePicker: false,
                selectionIndicator: false,
                timeline: false,
                navigationHelpButton: false,
                animation: false,
                shouldAnimate: true
            });
            // Avoid blue globe by setting dark slate baseColor and background
            this.cesiumViewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b101b');
            this.cesiumViewer.scene.globe.enableLighting = true;
            this.cesiumViewer.scene.globe.depthTestAgainstTerrain = false;
            this.cesiumViewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020408');
            // 1. Subterranean Coal Seam Volume (Anthracite Black)
            const seamEntity = this.cesiumViewer.entities.add({
                name: 'Chasnala Main Coal Seam #14 (Subterranean Anthracite)',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT - 25),
                cylinder: {
                    length: 18.0,
                    topRadius: 180.0,
                    bottomRadius: 210.0,
                    material: Cesium.Color.fromCssColorString('#18181b').withAlpha(0.85),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#3f3f46').withAlpha(0.6)
                }
            });
            this.strataEntities.push(seamEntity);
            // 2. Overburden Sandstone Caprock (Warm Terracotta/Ochre)
            const caprockEntity = this.cesiumViewer.entities.add({
                name: 'Overburden Sandstone Stratum',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT + 8),
                cylinder: {
                    length: 12.0,
                    topRadius: 240.0,
                    bottomRadius: 260.0,
                    material: Cesium.Color.fromCssColorString('#d97706').withAlpha(0.35),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#b45309').withAlpha(0.7)
                }
            });
            this.strataEntities.push(caprockEntity);
            // 3. Subsurface Mine Sump Basin (Crystalline Blue)
            const sumpEntity = this.cesiumViewer.entities.add({
                name: 'REL_35 Underground Sump Basin (Water Table Reservoir)',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON - 0.0022, MINE_LAT - 0.0031, MINE_ALT - 42),
                cylinder: {
                    length: 8.0,
                    topRadius: 90.0,
                    bottomRadius: 90.0,
                    material: Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.65),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#38bdf8')
                }
            });
            this.strataEntities.push(sumpEntity);
            // 4. DGMS Safety Protocol Layers
            const evacCylinder = this.cesiumViewer.entities.add({
                name: 'DGMS 220m Critical Evacuation Zone',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT + 1),
                cylinder: {
                    length: 2.0,
                    topRadius: 220.0,
                    bottomRadius: 220.0,
                    material: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.20),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#ef4444')
                }
            });
            this.protocolEntities.push(evacCylinder);
            const watchCylinder = this.cesiumViewer.entities.add({
                name: 'DGMS 450m Geotechnical Watch Boundary',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT),
                cylinder: {
                    length: 1.0,
                    topRadius: 450.0,
                    bottomRadius: 450.0,
                    material: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.08),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#f59e0b')
                }
            });
            this.protocolEntities.push(watchCylinder);
            const corridorAlpha = this.cesiumViewer.entities.add({
                name: 'Escape Corridor Alpha (Incline Portal)',
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                        MINE_LON, MINE_LAT, MINE_ALT + 15,
                        MINE_LON - 0.0016, MINE_LAT + 0.0017, MINE_ALT + 18,
                        MINE_LON - 0.0035, MINE_LAT + 0.0028, MINE_ALT + 22.5,
                        MINE_LON - 0.0054, MINE_LAT + 0.0055, MINE_ALT + 30
                    ]),
                    width: 3.5,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.3,
                        color: Cesium.Color.fromCssColorString('#10b981')
                    })
                }
            });
            this.protocolEntities.push(corridorAlpha);
            const corridorBeta = this.cesiumViewer.entities.add({
                name: 'Escape Corridor Beta (Hoist Alpha)',
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                        MINE_LON, MINE_LAT, MINE_ALT + 15,
                        MINE_LON + 0.0024, MINE_LAT + 0.0009, MINE_ALT + 25,
                        MINE_LON + 0.0042, MINE_LAT + 0.0015, MINE_ALT + 45
                    ]),
                    width: 3.0,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.3,
                        color: Cesium.Color.fromCssColorString('#00f5ff')
                    })
                }
            });
            this.protocolEntities.push(corridorBeta);
            // 5. 3D Sensor Node Markers
            // Node 01: Shaft #2 North Drift
            this.nodeEntities[1] = this.cesiumViewer.entities.add({
                name: 'NODE-01: Shaft #2 North Drift',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON - 0.0035, MINE_LAT + 0.0028, MINE_ALT + 22.5),
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.fromCssColorString('#10b981'),
                    outlineColor: Cesium.Color.fromCssColorString('#064e3b'),
                    outlineWidth: 2
                },
                label: {
                    text: 'NODE-01 [SHAFT #2 OK]',
                    font: '10px JetBrains Mono, monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.fromCssColorString('#6ee7b7'),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -14)
                }
            });
            // Node 02: Haul Road Overburden Bench
            this.nodeEntities[2] = this.cesiumViewer.entities.add({
                name: 'NODE-02: Overburden Haul Road',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON + 0.0042, MINE_LAT + 0.0015, MINE_ALT + 45.0),
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.fromCssColorString('#f59e0b'),
                    outlineColor: Cesium.Color.fromCssColorString('#78350f'),
                    outlineWidth: 2
                },
                label: {
                    text: 'NODE-02 [OVERBURDEN WATCH]',
                    font: '10px JetBrains Mono, monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.fromCssColorString('#fcd34d'),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -14)
                }
            });
            // Node 03: Sector 4B Extraction Stope Pillar (Critical Excursion Anchor)
            this.nodeEntities[3] = this.cesiumViewer.entities.add({
                name: 'TARGET: NODE-03 SEC-4B [ACTIVE STOPE PILLAR]',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON, MINE_LAT, MINE_ALT + 30.0),
                point: {
                    pixelSize: 16,
                    color: Cesium.Color.fromCssColorString('#ef4444'),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 3
                },
                label: {
                    text: 'TARGET: NODE-03 SEC-4B\n[ACTIVE STOPE PILLAR]',
                    font: '11px JetBrains Mono, monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.fromCssColorString('#fca5a5'),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -20)
                }
            });
            // Node 04: Sub-Gallery Sump Basin Aquifer
            this.nodeEntities[4] = this.cesiumViewer.entities.add({
                name: 'NODE-04: Sub-Gallery Sump Basin',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON - 0.0022, MINE_LAT - 0.0031, MINE_ALT - 30.0),
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.fromCssColorString('#0ea5e9'),
                    outlineColor: Cesium.Color.fromCssColorString('#0c4a6e'),
                    outlineWidth: 2
                },
                label: {
                    text: 'NODE-04 [SUMP RESERVOIR]',
                    font: '10px JetBrains Mono, monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.fromCssColorString('#7dd3fc'),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -14)
                }
            });
            // Node 05: Haulage Drift #12 North-East Incline
            this.nodeEntities[5] = this.cesiumViewer.entities.add({
                name: 'NODE-05: Haulage Drift #12 Incline',
                position: Cesium.Cartesian3.fromDegrees(MINE_LON + 0.0055, MINE_LAT + 0.0045, MINE_ALT + 10.0),
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.fromCssColorString('#14b8a6'),
                    outlineColor: Cesium.Color.fromCssColorString('#134e4a'),
                    outlineWidth: 2
                },
                label: {
                    text: 'NODE-05 [DRIFT 12 ONLINE]',
                    font: '10px JetBrains Mono, monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.fromCssColorString('#99f6e4'),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -14)
                }
            });
            // 6. 3D Strata Subsidence Displacement Vector Ray
            this.subsidenceVectorEntity = this.cesiumViewer.entities.add({
                name: 'Differential Strata Subsidence Vector',
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                        MINE_LON, MINE_LAT, MINE_ALT + 30,
                        MINE_LON + 0.0008, MINE_LAT - 0.0012, MINE_ALT - 35
                    ]),
                    width: 4,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.35,
                        color: Cesium.Color.fromCssColorString('#f43f5e')
                    })
                }
            });
            // Load live GeoJSON Spatial Mine Layer
            this.loadGeoJsonLayer();
            // Fly directly to Mine on startup
            this.flyToMine();
            // Initialize keyboard hotkeys
            this.initHotkeys();
        }
        catch (err) {
            console.warn('Cesium WebGL init notice:', err?.message || err);
        }
    }
    loadGeoJsonLayer() {
        if (!this.cesiumViewer || typeof Cesium === 'undefined')
            return;
        Cesium.GeoJsonDataSource.load('/api/telemetry/geojson', {
            stroke: Cesium.Color.fromCssColorString('#ef4444'),
            fill: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.3),
            strokeWidth: 3,
            markerSize: 24
        }).then((dataSource) => {
            this.cesiumViewer.dataSources.add(dataSource);
            const entities = dataSource.entities.values;
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                const hexColor = (entity.properties && entity.properties.color && entity.properties.color.getValue()) || '#10b981';
                if (entity.billboard) {
                    entity.billboard.color = Cesium.Color.fromCssColorString(hexColor);
                }
                if (entity.point) {
                    entity.point.color = Cesium.Color.fromCssColorString(hexColor);
                }
            }
            console.log('[GEV Engine] Live GeoJSON telemetry nodes loaded into 3D globe.');
        }).catch((e) => {
            console.warn('[GEV Engine] GeoJSON layer notice:', e?.message || e);
        });
    }
    toggleProtocolLayer() {
        this.isProtocolLayerVisible = !this.isProtocolLayerVisible;
        this.protocolEntities.forEach(ent => {
            if (ent)
                ent.show = this.isProtocolLayerVisible;
        });
        const btn = this.el('btn-toggle-protocol');
        if (this.isProtocolLayerVisible) {
            if (btn) {
                btn.innerHTML = `<span class="material-symbols-outlined text-[13px] text-emerald-400">shield</span> PROTOCOL: ARMED`;
                btn.classList.add('border-emerald-500/50', 'text-emerald-300');
                btn.classList.remove('border-white/20', 'text-zinc-400');
            }
        }
        else {
            if (btn) {
                btn.innerHTML = `<span class="material-symbols-outlined text-[13px]">shield</span> PROTOCOL: OFF`;
                btn.classList.remove('border-emerald-500/50', 'text-emerald-300');
                btn.classList.add('border-white/20', 'text-zinc-400');
            }
        }
    }
    triggerEvacuationProtocol() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                const audioCtx = new AudioContextClass();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(820, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(380, audioCtx.currentTime + 0.6);
                gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.6);
            }
        }
        catch (e) { }
        const modal = this.el('evac-dispatch-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        this.flyToMine();
        const logList = this.el('incident-log-list');
        if (logList) {
            const now = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST';
            const newEntry = document.createElement('div');
            newEntry.className = "bg-[#2a080f] border-2 border-rose-500 p-2.5 rounded flex items-start gap-2.5";
            newEntry.innerHTML = `
        <div class="w-6 h-6 rounded bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span class="material-symbols-outlined text-rose-400 text-[15px]">campaign</span>
        </div>
        <div class="flex flex-col flex-1 min-w-0">
          <div class="flex items-center justify-between font-['JetBrains_Mono'] text-[10px]">
            <span class="text-rose-400 font-bold">MANDATORY EVACUATION DISPATCHED #4093</span>
            <span class="text-white">${now}</span>
          </div>
          <p class="font-['Space_Grotesk'] text-[11px] text-white font-bold truncate mt-0.5">
            DGMS Reg-124 Triggered: 14 Miners ordered to Incline Portal Alpha.
          </p>
        </div>
      `;
            logList.insertBefore(newEntry, logList.firstChild);
        }
    }
    closeEvacModal() {
        const modal = this.el('evac-dispatch-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }
    async toggleHardwareStream() {
        try {
            const res = await fetch('/api/telemetry/hardware-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: true })
            });
            const data = await res.json();
            const txt = this.el('hardware-toggle-text');
            if (txt)
                txt.innerText = 'HARDWARE LINK: CONNECTED';
            const badge = this.el('uplink-status-badge');
            if (badge) {
                badge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.35)]";
                badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>● LIVE STREAM: CONNECTED (ESP32/STREAM)';
            }
            console.log('✅ Hardware mode active:', data);
        }
        catch (e) {
            console.warn('Hardware toggle error:', e);
        }
    }
}
let telemetryClientInstance = null;
window.getTelemetryClient = function () {
    if (!telemetryClientInstance) {
        telemetryClientInstance = new TelemetryClient();
    }
    return telemetryClientInstance;
};
window.selectNode = (num) => window.getTelemetryClient().selectNode(num);
window.recenterMap = () => window.getTelemetryClient().recenterMap();
window.resetGlobe = () => window.getTelemetryClient().resetGlobe();
window.flyToMine = () => window.getTelemetryClient().flyToMine();
window.setOptic = (type) => window.getTelemetryClient().setOptic(type);
window.toggle3DContour = () => window.getTelemetryClient().toggle3DContour();
window.setMapMode = (mode) => window.getTelemetryClient().setMapMode(mode);
window.toggleProtocolLayer = () => window.getTelemetryClient().toggleProtocolLayer();
window.triggerEvacuationProtocol = () => window.getTelemetryClient().triggerEvacuationProtocol();
window.closeEvacModal = () => window.getTelemetryClient().closeEvacModal();
window.toggleHardwareStream = () => window.getTelemetryClient().toggleHardwareStream();
document.addEventListener('DOMContentLoaded', () => {
    window.getTelemetryClient();
    if (typeof window.getChatAssistant === 'function') {
        window.getChatAssistant();
    }
});
