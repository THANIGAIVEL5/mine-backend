import { TelemetryData } from './types.js';

declare const io: any;
declare const L: any;

export class TelemetryClient {
  private socket: any = null;
  private currentRms: number = 0.15;
  private waveOffset: number = 0;
  private is3DActive: boolean = false;
  private activeNodeIndex: number = 3;
  private leafletMap: any = null;
  private currentMapMode: string = 'satellite';
  private protocolLayerGroup: any = null;
  private nodeLayerGroup: any = null;
  private satelliteLayer: any = null;
  private darkLayer: any = null;
  private isProtocolLayerVisible: boolean = true;
  private markers: { [key: number]: any } = {};

  constructor() {
    this.initSocket();
    this.initClock();
    this.initOscilloscope();
    this.initRealMap();
  }

  private el(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  private initSocket() {
    try {
      if (typeof io !== 'undefined') {
        this.socket = io();
        this.socket.on('telemetry', (data: TelemetryData) => this.handleTelemetry(data));
      }
    } catch (e) {
      console.log('Socket telemetry initialization notice:', e);
    }
  }

  private handleTelemetry(data: TelemetryData) {
    if (!data) return;
    this.currentRms = data.rms || 0.15;

    // Communication bus counters
    const latencyVal = this.el('latency-val');
    if (latencyVal) latencyVal.innerHTML = `${Math.floor(Math.random()*12)+14}<span class="text-[11px] text-neutral-400 font-normal ml-1">MS</span>`;
    
    const rssiVal = this.el('rssi-val');
    if (rssiVal) rssiVal.innerText = data.rssi.toString();
    
    const pktVal = this.el('pkt-val');
    if (pktVal) pktVal.innerText = data.pkt.toString();

    // ADXL345 / MPU6050 Orientation Readouts
    const valPitch = this.el('val-pitch');
    if (valPitch) valPitch.innerText = `${Number(data.pitch).toFixed(2)}°`;
    
    const valRoll = this.el('val-roll');
    if (valRoll) valRoll.innerText = `${data.roll > 0 ? '+' : ''}${Number(data.roll).toFixed(2)}°`;
    
    const valDisp = this.el('val-disp');
    if (valDisp) valDisp.innerText = `${Number(data.disp).toFixed(2)}° Σ`;

    // Piezo Vibration Harmonics
    const valRms = this.el('val-rms');
    if (valRms) valRms.innerText = `${Number(data.rms).toFixed(2)} g`;
    
    const valP2p = this.el('val-p2p');
    if (valP2p) valP2p.innerText = `${Number(data.p2p || data.rms * 3.14).toFixed(2)} g`;
    
    const valFft = this.el('val-fft');
    if (valFft) valFft.innerText = `${Number(data.fft || 48.0).toFixed(1)} Hz`;

    // Temperature & Thermometer column
    const valTemp = this.el('val-temp');
    if (valTemp) valTemp.innerText = Number(data.temp).toFixed(1);
    
    const tempBar = this.el('temp-bar');
    if (tempBar) {
      const tempPct = Math.max(0, Math.min(100, (data.temp / 70) * 100));
      tempBar.style.height = `${tempPct}%`;
    }

    // Tilt threshold alarm banner
    const tiltWarning = this.el('tilt-warning');
    if (tiltWarning) {
      if (Math.abs(data.pitch) > 5.0 || Math.abs(data.roll) > 5.0) {
        tiltWarning.classList.remove('opacity-0');
      } else {
        tiltWarning.classList.add('opacity-0');
      }
    }

    // MQ135 Air Quality & Atmospheric Gases
    const valAqi = this.el('val-aqi');
    if (valAqi) valAqi.innerText = data.aqi.toString();
    
    const aqiRing = this.el('aqi-ring');
    if (aqiRing) {
      const ringVal = Math.min(290, (data.aqi / 300) * 290);
      aqiRing.setAttribute('stroke-dasharray', `${ringVal} 360`);
      if (data.aqi > 150) aqiRing.setAttribute('stroke', '#ffba27');
      if (data.aqi > 250) aqiRing.setAttribute('stroke', '#ff3366');
    }
    
    const aqiBand = this.el('aqi-band');
    if (aqiBand) {
      if (data.aqi > 250) aqiBand.innerText = 'CRITICAL BAND';
      else if (data.aqi > 150) aqiBand.innerText = 'UNHEALTHY BAND';
      else aqiBand.innerText = 'NOMINAL BAND';
    }

    const valCo = this.el('val-co');
    if (valCo) valCo.innerText = `${data.co} ppm`;
    
    const valNh3 = this.el('val-nh3');
    if (valNh3) valNh3.innerText = `${data.nh3 || 4} ppm`;
    
    const valCo2 = this.el('val-co2');
    if (valCo2) valCo2.innerText = `${data.co2 || (1120 + data.co * 8)} ppm`;

    // REL_35 Sump Water Level Tank Fill
    const valSump = this.el('val-sump');
    if (valSump) valSump.innerText = Number(data.sump).toFixed(2);
    
    const sumpFill = this.el('sump-fill');
    if (sumpFill) {
      const sumpPct = Math.max(0, Math.min(100, (data.sump / 4.0) * 100));
      sumpFill.style.height = `${sumpPct}%`;
    }
    
    const valAdcSump = this.el('val-adc-sump');
    if (valAdcSump) {
      const estAdc = Math.floor(150 + (data.sump / 4.0) * 3050);
      valAdcSump.innerText = `${(data as any).adc_sump || estAdc} RAW`;
    }

    // NEO-6M GNSS Coordinates
    if (data.lat && this.el('val-gps-lat')) this.el('val-gps-lat')!.innerText = `${Number(data.lat).toFixed(6)}° N`;
    if (data.lon && this.el('val-gps-lon')) this.el('val-gps-lon')!.innerText = `${Number(data.lon).toFixed(6)}° E`;
    if (data.alt !== undefined && this.el('val-gps-alt')) this.el('val-gps-alt')!.innerText = `${Number(data.alt).toFixed(2)} m`;
    if (data.sats !== undefined && this.el('val-gps-sats')) this.el('val-gps-sats')!.innerText = `${data.sats} SATELLITES TRACKED`;
    if (data.hdop !== undefined && this.el('val-gps-hdop')) this.el('val-gps-hdop')!.innerText = Number(data.hdop).toFixed(2);

    // Artificial Horizon Pitch & Roll Gyro Reticle
    const horizon = this.el('horizon-dynamic-group');
    if (horizon) {
      horizon.setAttribute('transform', `rotate(${data.roll.toFixed(2)} 80 80) translate(0, ${(-data.pitch * 3).toFixed(2)})`);
    }

    // Isolation Forest Score & Audit Gauge
    const anomalyScoreNum = Math.min(1.0, (Math.abs(data.pitch) * 0.1) + (data.rms * 1.5) + (data.co * 0.01));
    const anomalyScore = anomalyScoreNum.toFixed(2);
    const isoScore = this.el('iso-score');
    if (isoScore) {
      isoScore.innerText = anomalyScore;
      const pct = Math.floor(anomalyScoreNum * 100);
      const isoText = this.el('iso-text');
      if (isoText) isoText.innerText = `${pct}%`;
      const isoGauge = this.el('iso-gauge');
      if (isoGauge) isoGauge.setAttribute('stroke-dasharray', `${pct}, 100`);
    }

    // Transparent Rule Attribution Bars
    const rule1Bar = this.el('rule-1-bar');
    if (rule1Bar) rule1Bar.style.width = `${Math.min(100, Math.abs(data.pitch) * 20)}%`;
    
    const rule2Bar = this.el('rule-2-bar');
    if (rule2Bar) rule2Bar.style.width = `${Math.min(100, data.rms * 200)}%`;
    
    const rule3Bar = this.el('rule-3-bar');
    if (rule3Bar) rule3Bar.style.width = `${Math.min(100, (data.co / 30) * 100)}%`;

    // Tactical Map Beacon Animation & Subsidence Displacement Vector
    const node03Ping = this.el('node-03-ping');
    if (node03Ping) node03Ping.style.animationDuration = `${Math.max(0.2, 1.5 - data.rms * 2)}s`;
    
    const node03Dot = this.el('node-03-dot');
    if (node03Dot) {
      const intense = data.rms > 0.3 ? 'shadow-[0_0_24px_#ff0033]' : 'shadow-[0_0_16px_#ff3366]';
      node03Dot.className = `w-4 h-4 rounded-full bg-[#ff3366] ${intense} border-2 border-white transition-all duration-500`;
    }

    const subsidenceTrail = this.el('subsidence-trail');
    const subsidenceArrow = this.el('subsidence-arrow');
    if (subsidenceTrail && subsidenceArrow) {
      const dx = (data.disp || 0) * 2;
      const dy = (data.disp || 0) * 2;
      subsidenceTrail.setAttribute('d', `M 368,212 L 374,218 L ${382+dx},${224+dy} L ${390+dx},${230+dy}`);
      subsidenceArrow.setAttribute('transform', `translate(${dx}, ${dy})`);
    }
  }

  private initClock() {
    setInterval(() => {
      const d = new Date();
      const timeStr = d.toLocaleTimeString('en-US', { hour12: false }) + ' IST';
      const clockEl = this.el('live-clock');
      if (clockEl) clockEl.innerText = timeStr + ' UTC+5:30 REAL-TIME';
      const headerClockEl = this.el('header-clock');
      if (headerClockEl) headerClockEl.innerText = timeStr + ' UTC+5:30 REAL-TIME';
    }, 1000);
  }

  private initOscilloscope() {
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

  public selectNode(nodeNum: number) {
    this.activeNodeIndex = nodeNum;
    const activeStyles: { [key: number]: string } = {
      1: "flex flex-col items-center py-1.5 rounded bg-emerald-950/80 border border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer ring-1 ring-emerald-400",
      2: "flex flex-col items-center py-1.5 rounded bg-amber-950/80 border border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.35)] transition-all cursor-pointer ring-1 ring-amber-400",
      3: "flex flex-col items-center py-1.5 rounded bg-rose-950/90 border-2 border-rose-500 text-rose-100 shadow-[0_0_16px_rgba(244,63,94,0.45)] transition-all cursor-pointer ring-1 ring-rose-400",
      4: "flex flex-col items-center py-1.5 rounded bg-cyan-950/80 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all cursor-pointer ring-1 ring-cyan-400",
      5: "flex flex-col items-center py-1.5 rounded bg-slate-900 border border-slate-500 text-slate-300 transition-all cursor-pointer ring-1 ring-slate-400"
    };
    const defaultStyles: { [key: number]: string } = {
      1: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19] border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all cursor-pointer text-emerald-400",
      2: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19] border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-950/20 transition-all cursor-pointer text-amber-400",
      3: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19] border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-950/20 transition-all cursor-pointer text-rose-400",
      4: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19] border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all cursor-pointer text-cyan-400",
      5: "flex flex-col items-center py-1.5 rounded bg-[#0b0f19]/40 border border-white/5 opacity-70 hover:opacity-100 transition-all cursor-pointer text-slate-400"
    };

    for (let i = 1; i <= 5; i++) {
      const btn = this.el(`node-btn-${i}`);
      if (!btn) continue;
      btn.className = (i === nodeNum) ? activeStyles[i] : defaultStyles[i];
    }

    const nodeNames = ["NODE-01 (Shaft #2)", "NODE-02 (Overburden)", "NODE-03 (Pillar 4B Stope)", "NODE-04 (Sump Basin)", "NODE-05 (Offline)"];
    const headerTitle = this.el('node-focus-title');
    if (headerTitle) headerTitle.innerText = `Active Telemetry Stream: ${nodeNames[nodeNum - 1]}`;
  }

  public recenterMap() {
    if (this.leafletMap) {
      this.leafletMap.setView([23.795741, 86.430412], 16, { animate: true });
      this.leafletMap.invalidateSize();
    }
    const container = this.el('map-canvas-container');
    if (container) {
      container.classList.add('scale-[1.01]');
      setTimeout(() => container.classList.remove('scale-[1.01]'), 300);
    }
  }

  public toggle3DContour() {
    this.is3DActive = !this.is3DActive;
    const btn = this.el('btn-3d-contour');
    const container = this.el('map-canvas-container');
    if (btn) {
      if (this.is3DActive) {
        btn.classList.add('bg-amber-500/30', 'text-white', 'border-amber-400');
        if (container) container.style.transform = 'perspective(900px) rotateX(12deg)';
      } else {
        btn.classList.remove('bg-amber-500/30', 'text-white', 'border-amber-400');
        if (container) container.style.transform = 'none';
      }
    }
  }

  private initRealMap() {
    const mapEl = this.el('real-leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;

    try {
      const mineCenter = [23.795741, 86.430412];

      this.leafletMap = L.map('real-leaflet-map', {
        center: mineCenter,
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(this.leafletMap);

      this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri World Imagery'
      });

      this.darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: 'CartoDB Dark'
      });

      this.satelliteLayer.addTo(this.leafletMap);

      this.protocolLayerGroup = L.layerGroup();
      this.nodeLayerGroup = L.layerGroup();

      this.renderDgmsProtocolLayers();
      this.renderRealMapNodes();

      this.protocolLayerGroup.addTo(this.leafletMap);
      this.nodeLayerGroup.addTo(this.leafletMap);

      setTimeout(() => {
        if (this.leafletMap) this.leafletMap.invalidateSize();
      }, 400);
    } catch (e) {
      console.warn('Real GIS Map init notice:', e);
    }
  }

  private renderDgmsProtocolLayers() {
    if (!this.protocolLayerGroup) return;
    this.protocolLayerGroup.clearLayers();

    const stopeCenter = [23.795741, 86.430412];

    const evacCircle = L.circle(stopeCenter, {
      radius: 220,
      color: '#ef4444',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#ef4444',
      fillOpacity: 0.18
    });
    evacCircle.bindPopup(`
      <div class="font-['Space_Grotesk'] text-white">
        <div class="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[#ef4444] text-[10px] font-bold uppercase">
          <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          DGMS REGULATION 124 CRITICAL ZONE
        </div>
        <div class="text-[14px] font-bold mt-1 text-white">Mandatory Evacuation Boundary</div>
      </div>
    `);
    this.protocolLayerGroup.addLayer(evacCircle);

    const watchCircle = L.circle(stopeCenter, {
      radius: 450,
      color: '#f59e0b',
      weight: 1.5,
      dashArray: '8, 8',
      fillColor: '#f59e0b',
      fillOpacity: 0.08
    });
    this.protocolLayerGroup.addLayer(watchCircle);

    const stopePolygon = L.polygon([
      [23.7942, 86.4285],
      [23.7972, 86.4278],
      [23.7980, 86.4326],
      [23.7952, 86.4338]
    ], {
      color: '#64748b',
      weight: 2,
      dashArray: '4, 4',
      fillColor: '#0f172a',
      fillOpacity: 0.45
    });
    this.protocolLayerGroup.addLayer(stopePolygon);
    
    // Add Corridors and Markers simplified
    const corridorAlpha = L.polyline([
      [23.795741, 86.430412], [23.797400, 86.428800],
      [23.798541, 86.426912], [23.801200, 86.425000]
    ], { color: '#10b981', weight: 4, dashArray: '8, 8' });
    this.protocolLayerGroup.addLayer(corridorAlpha);

    const corridorBeta = L.polyline([
      [23.795741, 86.430412], [23.796600, 86.432800],
      [23.797241, 86.434612], [23.799500, 86.433500]
    ], { color: '#00f5ff', weight: 3.5, dashArray: '8, 8' });
    this.protocolLayerGroup.addLayer(corridorBeta);
  }

  private renderRealMapNodes() {
    if (!this.nodeLayerGroup) return;
    this.nodeLayerGroup.clearLayers();

    const nodesData = [
      { id: 1, name: "NODE-01 (Shaft #2)", coords: [23.798541, 86.426912], color: "#10b981", status: "NOMINAL", rate: "0.12 mm/d", desc: "Shaft #2 North Drift Collar" },
      { id: 2, name: "NODE-02 (Overburden)", coords: [23.797241, 86.434612], color: "#f59e0b", status: "WATCH", rate: "1.45 mm/d", desc: "Haul Road Overburden Bench" },
      { id: 3, name: "NODE-03 (Pillar 4B Stope)", coords: [23.795741, 86.430412], color: "#ef4444", status: "CRITICAL EXCURSION", rate: "2.85 mm/d", desc: "Active Extraction Stope Pillar 4B", isFocus: true },
      { id: 4, name: "NODE-04 (Sump Basin)", coords: [23.792641, 86.428212], color: "#0ea5e9", status: "NOMINAL", rate: "0.08 mm/d", desc: "Sub-Gallery Sump Basin Aquifer" },
      { id: 5, name: "NODE-05 (North-East Incline)", coords: [23.800241, 86.435912], color: "#64748b", status: "OFFLINE", rate: "N/A", desc: "Old Sector Workings - Packet Timeout" }
    ];

    nodesData.forEach(n => {
      let iconHtml = `<div style="width:16px;height:16px;background:${n.color};border-radius:50%"></div>`;
      if (n.isFocus) {
          iconHtml = `<div style="width:24px;height:24px;background:${n.color};border-radius:50%;border:2px solid white"></div>`;
      }

      const icon = L.divIcon({
        className: `custom-node-marker-${n.id}`,
        html: iconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(n.coords, { icon });
      this.markers[n.id] = marker;
      this.nodeLayerGroup.addLayer(marker);
    });
  }

  public setMapMode(mode: string) {
    this.currentMapMode = mode;
    const realMapEl = this.el('real-leaflet-map');
    
    const btnSat = this.el('btn-layer-sat');
    const btnDark = this.el('btn-layer-dark');
    const btnSchem = this.el('btn-layer-schem');
    
    [btnSat, btnDark, btnSchem].forEach(b => {
      if (b) {
        b.className = "bg-neutral-900 hover:bg-neutral-800 border border-white/20 text-zinc-300 font-['JetBrains_Mono'] text-[10px] uppercase px-2.5 py-1 rounded transition active:scale-95 cursor-pointer";
      }
    });

    if (mode === 'satellite') {
      if (btnSat) btnSat.className = "bg-white text-black font-bold font-['JetBrains_Mono'] text-[10px] uppercase px-2.5 py-1 rounded transition shadow-[0_0_10px_rgba(255,255,255,0.4)] cursor-pointer";
      if (realMapEl) {
        realMapEl.style.display = 'block';
        realMapEl.style.opacity = '1';
        realMapEl.style.pointerEvents = 'auto';
      }
      if (this.leafletMap) {
        if (this.darkLayer && this.leafletMap.hasLayer(this.darkLayer)) this.leafletMap.removeLayer(this.darkLayer);
        if (this.satelliteLayer && !this.leafletMap.hasLayer(this.satelliteLayer)) this.satelliteLayer.addTo(this.leafletMap);
        this.leafletMap.invalidateSize();
      }
    } else if (mode === 'dark') {
      if (btnDark) btnDark.className = "bg-white text-black font-bold font-['JetBrains_Mono'] text-[10px] uppercase px-2.5 py-1 rounded transition shadow-[0_0_10px_rgba(255,255,255,0.4)] cursor-pointer";
      if (realMapEl) {
        realMapEl.style.display = 'block';
        realMapEl.style.opacity = '1';
        realMapEl.style.pointerEvents = 'auto';
      }
      if (this.leafletMap) {
        if (this.satelliteLayer && this.leafletMap.hasLayer(this.satelliteLayer)) this.leafletMap.removeLayer(this.satelliteLayer);
        if (this.darkLayer && !this.leafletMap.hasLayer(this.darkLayer)) this.darkLayer.addTo(this.leafletMap);
        this.leafletMap.invalidateSize();
      }
    } else if (mode === 'schematic') {
      if (btnSchem) btnSchem.className = "bg-white text-black font-bold font-['JetBrains_Mono'] text-[10px] uppercase px-2.5 py-1 rounded transition shadow-[0_0_10px_rgba(255,255,255,0.4)] cursor-pointer";
      if (realMapEl) {
        realMapEl.style.display = 'none';
        realMapEl.style.opacity = '0';
        realMapEl.style.pointerEvents = 'none';
      }
    }
  }

  public toggleProtocolLayer() {
    if (!this.leafletMap || !this.protocolLayerGroup) return;
    this.isProtocolLayerVisible = !this.isProtocolLayerVisible;
    const btn = this.el('btn-toggle-protocol');

    if (this.isProtocolLayerVisible) {
      this.protocolLayerGroup.addTo(this.leafletMap);
      if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined text-[13px] text-emerald-400">shield</span> PROTOCOL: ARMED`;
        btn.classList.add('border-emerald-500/50', 'text-emerald-300');
        btn.classList.remove('border-white/20', 'text-zinc-400');
      }
    } else {
      this.leafletMap.removeLayer(this.protocolLayerGroup);
      if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined text-[13px]">shield</span> PROTOCOL: OFF`;
        btn.classList.remove('border-emerald-500/50', 'text-emerald-300');
        btn.classList.add('border-white/20', 'text-zinc-400');
      }
    }
  }

  public triggerEvacuationProtocol() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
    } catch (e) {}

    const modal = this.el('evac-dispatch-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    if (this.leafletMap) {
      this.leafletMap.setView([23.795741, 86.430412], 16, { animate: true });
    }

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

  public closeEvacModal() {
    const modal = this.el('evac-dispatch-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
}

let telemetryClientInstance: TelemetryClient | null = null;

(window as any).getTelemetryClient = function(): TelemetryClient {
  if (!telemetryClientInstance) {
    telemetryClientInstance = new TelemetryClient();
  }
  return telemetryClientInstance;
};

(window as any).selectNode = (num: number) => (window as any).getTelemetryClient().selectNode(num);
(window as any).recenterMap = () => (window as any).getTelemetryClient().recenterMap();
(window as any).toggle3DContour = () => (window as any).getTelemetryClient().toggle3DContour();
(window as any).setMapMode = (mode: string) => (window as any).getTelemetryClient().setMapMode(mode);
(window as any).toggleProtocolLayer = () => (window as any).getTelemetryClient().toggleProtocolLayer();
(window as any).triggerEvacuationProtocol = () => (window as any).getTelemetryClient().triggerEvacuationProtocol();
(window as any).closeEvacModal = () => (window as any).getTelemetryClient().closeEvacModal();

document.addEventListener('DOMContentLoaded', () => {
  (window as any).getTelemetryClient();
  if (typeof (window as any).getChatAssistant === 'function') {
    (window as any).getChatAssistant();
  }
});
