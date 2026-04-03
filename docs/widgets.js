// Interactive optics & process calculators for Albu documentation

// === Spin Coating Thickness Calculator ===
function initSpinCoatingWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="widget">
      <h3 class="widget-title">Spin Coating Thickness Calculator</h3>
      <p class="widget-desc">Predict egg white film thickness based on spin speed. Data fitted from Jiang et al. 2017 Figure S11.</p>
      <div class="widget-controls">
        <div class="widget-slider-group">
          <label>Spin Speed: <strong id="sc-rpm-val">3000</strong> RPM</label>
          <input type="range" id="sc-rpm" min="500" max="8000" value="3000" step="100">
          <div class="widget-range-labels"><span>500</span><span>8000</span></div>
        </div>
        <div class="widget-slider-group">
          <label>Dilution (albumen:water): <strong id="sc-dil-val">1:0</strong> (undiluted)</label>
          <input type="range" id="sc-dil" min="0" max="5" value="0" step="1">
          <div class="widget-range-labels"><span>Undiluted</span><span>1:5</span></div>
        </div>
      </div>
      <div class="widget-result">
        <div class="widget-result-main">
          <span class="widget-result-num" id="sc-thickness">300</span>
          <span class="widget-result-unit">nm</span>
        </div>
        <div class="widget-result-sub" id="sc-use">Standard photoresist thickness</div>
      </div>
      <canvas id="sc-chart" width="600" height="200"></canvas>
    </div>
  `;

  const rpmSlider = document.getElementById('sc-rpm');
  const dilSlider = document.getElementById('sc-dil');
  const rpmVal = document.getElementById('sc-rpm-val');
  const dilVal = document.getElementById('sc-dil-val');
  const thicknessEl = document.getElementById('sc-thickness');
  const useEl = document.getElementById('sc-use');
  const chart = document.getElementById('sc-chart');
  const chartCtx = chart.getContext('2d');

  // Empirical fit: t ≈ A / sqrt(rpm), calibrated to paper data
  // At 1000 RPM -> 900nm, 6000 RPM -> 100nm
  // t = 28460 / rpm^0.82  (power law fit)
  function calcThickness(rpm, dilution) {
    const base = 28460 / Math.pow(rpm, 0.82);
    const factor = 1 / (1 + dilution * 0.8);
    return Math.round(base * factor);
  }

  function getUse(t) {
    if (t > 600) return 'Thick resist - easy to see, good for initial experiments';
    if (t > 350) return 'Gate dielectric range - suitable for ZnO TFT (Phase 2)';
    if (t > 200) return 'Standard photoresist thickness';
    if (t > 100) return 'Thin resist - high resolution patterning';
    return 'Ultra-thin film - approaching monolayer regime';
  }

  function drawChart(currentRpm, currentDil) {
    const dpr = window.devicePixelRatio || 1;
    const W = chart.parentElement.clientWidth - 48;
    const H = 180;
    chart.width = W * dpr;
    chart.height = H * dpr;
    chart.style.width = W + 'px';
    chart.style.height = H + 'px';
    chartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { l: 50, r: 20, t: 10, b: 30 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;

    chartCtx.clearRect(0, 0, W, H);

    // Axes
    chartCtx.strokeStyle = '#e5e7eb';
    chartCtx.lineWidth = 1;
    chartCtx.beginPath();
    chartCtx.moveTo(pad.l, pad.t);
    chartCtx.lineTo(pad.l, H - pad.b);
    chartCtx.lineTo(W - pad.r, H - pad.b);
    chartCtx.stroke();

    // Grid lines
    chartCtx.strokeStyle = '#f3f4f6';
    for (let t = 200; t <= 800; t += 200) {
      const y = pad.t + ph - (t / 1000) * ph;
      chartCtx.beginPath();
      chartCtx.moveTo(pad.l, y);
      chartCtx.lineTo(W - pad.r, y);
      chartCtx.stroke();
    }

    // Axis labels
    chartCtx.fillStyle = '#6b7280';
    chartCtx.font = '11px Inter, sans-serif';
    chartCtx.textAlign = 'right';
    for (let t = 0; t <= 1000; t += 200) {
      const y = pad.t + ph - (t / 1000) * ph;
      chartCtx.fillText(t + 'nm', pad.l - 6, y + 4);
    }
    chartCtx.textAlign = 'center';
    for (let r = 1000; r <= 8000; r += 1000) {
      const x = pad.l + ((r - 500) / 7500) * pw;
      chartCtx.fillText(r/1000 + 'k', x, H - pad.b + 18);
    }

    // Curve (undiluted)
    chartCtx.strokeStyle = '#dbeafe';
    chartCtx.lineWidth = 2;
    chartCtx.beginPath();
    for (let r = 500; r <= 8000; r += 50) {
      const x = pad.l + ((r - 500) / 7500) * pw;
      const t = calcThickness(r, 0);
      const y = pad.t + ph - (Math.min(t, 1000) / 1000) * ph;
      r === 500 ? chartCtx.moveTo(x, y) : chartCtx.lineTo(x, y);
    }
    chartCtx.stroke();

    // Curve (current dilution)
    if (currentDil > 0) {
      chartCtx.strokeStyle = '#434e64';
      chartCtx.lineWidth = 2;
      chartCtx.setLineDash([4, 3]);
      chartCtx.beginPath();
      for (let r = 500; r <= 8000; r += 50) {
        const x = pad.l + ((r - 500) / 7500) * pw;
        const t = calcThickness(r, currentDil);
        const y = pad.t + ph - (Math.min(t, 1000) / 1000) * ph;
        r === 500 ? chartCtx.moveTo(x, y) : chartCtx.lineTo(x, y);
      }
      chartCtx.stroke();
      chartCtx.setLineDash([]);
    }

    // Current point
    const cx = pad.l + ((currentRpm - 500) / 7500) * pw;
    const ct = calcThickness(currentRpm, currentDil);
    const cy = pad.t + ph - (Math.min(ct, 1000) / 1000) * ph;
    chartCtx.fillStyle = '#2563eb';
    chartCtx.beginPath();
    chartCtx.arc(cx, cy, 6, 0, Math.PI * 2);
    chartCtx.fill();
    chartCtx.fillStyle = '#fff';
    chartCtx.beginPath();
    chartCtx.arc(cx, cy, 3, 0, Math.PI * 2);
    chartCtx.fill();

    // Paper data points
    const paperData = [[1000,900],[2000,450],[3000,300],[4000,200],[6000,100]];
    chartCtx.fillStyle = '#434e64';
    for (const [r, t] of paperData) {
      const px = pad.l + ((r - 500) / 7500) * pw;
      const py = pad.t + ph - (t / 1000) * ph;
      chartCtx.beginPath();
      chartCtx.arc(px, py, 3.5, 0, Math.PI * 2);
      chartCtx.fill();
    }
  }

  function update() {
    const rpm = parseInt(rpmSlider.value);
    const dil = parseInt(dilSlider.value);
    rpmVal.textContent = rpm;
    dilVal.textContent = dil === 0 ? '1:0 (undiluted)' : '1:' + dil;
    const t = calcThickness(rpm, dil);
    thicknessEl.textContent = t;
    useEl.textContent = getUse(t);
    drawChart(rpm, dil);
  }

  rpmSlider.addEventListener('input', update);
  dilSlider.addEventListener('input', update);
  update();
}

// === Laser Spot Size Calculator ===
function initLaserSpotWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="widget">
      <h3 class="widget-title">Laser Spot Size & Power Density Calculator</h3>
      <p class="widget-desc">Calculate focused spot diameter and power density for different objective and laser configurations.</p>
      <div class="widget-controls">
        <div class="widget-slider-group">
          <label>Wavelength: <strong id="ls-wl-val">450</strong> nm</label>
          <input type="range" id="ls-wl" min="250" max="550" value="450" step="5">
          <div class="widget-range-labels"><span>250nm (UV-C)</span><span>550nm</span></div>
        </div>
        <div class="widget-slider-group">
          <label>Objective NA: <strong id="ls-na-val">0.25</strong></label>
          <input type="range" id="ls-na" min="10" max="90" value="25" step="1">
          <div class="widget-range-labels"><span>0.10 (4x)</span><span>0.90 (60x oil)</span></div>
        </div>
        <div class="widget-slider-group">
          <label>Laser Power: <strong id="ls-pw-val">500</strong> mW</label>
          <input type="range" id="ls-pw" min="1" max="5000" value="500" step="10">
          <div class="widget-range-labels"><span>1 mW</span><span>5000 mW</span></div>
        </div>
        <div class="widget-slider-group">
          <label>Beam Quality (M&sup2;): <strong id="ls-m2-val">10</strong></label>
          <input type="range" id="ls-m2" min="1" max="50" value="10" step="1">
          <div class="widget-range-labels"><span>1 (ideal)</span><span>50 (cheap diode)</span></div>
        </div>
      </div>
      <div class="widget-results-row">
        <div class="widget-result">
          <div class="widget-result-main">
            <span class="widget-result-num" id="ls-spot">11.0</span>
            <span class="widget-result-unit">&mu;m</span>
          </div>
          <div class="widget-result-sub">Focused spot diameter</div>
        </div>
        <div class="widget-result">
          <div class="widget-result-main">
            <span class="widget-result-num" id="ls-density">5.3</span>
            <span class="widget-result-unit" id="ls-density-unit">kW/cm&sup2;</span>
          </div>
          <div class="widget-result-sub">Power density at focus</div>
        </div>
        <div class="widget-result">
          <div class="widget-result-main">
            <span class="widget-result-num" id="ls-feature">22</span>
            <span class="widget-result-unit">&mu;m</span>
          </div>
          <div class="widget-result-sub">Min. feature (spot + HAZ)</div>
        </div>
      </div>
      <div class="widget-note" id="ls-note"></div>
    </div>
  `;

  const wlSlider = document.getElementById('ls-wl');
  const naSlider = document.getElementById('ls-na');
  const pwSlider = document.getElementById('ls-pw');
  const m2Slider = document.getElementById('ls-m2');

  function update() {
    const wl = parseInt(wlSlider.value);
    const na = parseInt(naSlider.value) / 100;
    const pw = parseInt(pwSlider.value);
    const m2 = parseInt(m2Slider.value);

    document.getElementById('ls-wl-val').textContent = wl;
    document.getElementById('ls-na-val').textContent = na.toFixed(2);
    document.getElementById('ls-pw-val').textContent = pw;
    document.getElementById('ls-m2-val').textContent = m2;

    // Spot diameter: d = M² × 1.22 × λ / NA (in µm)
    const spotUm = m2 * 1.22 * (wl / 1000) / na;

    // Power density: P / (π × (d/2)²)  in W/cm²
    const spotCm = spotUm * 1e-4;
    const area = Math.PI * Math.pow(spotCm / 2, 2);
    const densityWcm2 = (pw / 1000) / area;

    // Min feature: spot + ~50% HAZ
    const feature = spotUm * 2;

    document.getElementById('ls-spot').textContent = spotUm < 100 ? spotUm.toFixed(1) : Math.round(spotUm);
    document.getElementById('ls-feature').textContent = Math.round(feature);

    let densityStr, densityUnit;
    if (densityWcm2 > 1e6) {
      densityStr = (densityWcm2 / 1e6).toFixed(1);
      densityUnit = 'MW/cm\u00B2';
    } else if (densityWcm2 > 1e3) {
      densityStr = (densityWcm2 / 1e3).toFixed(1);
      densityUnit = 'kW/cm\u00B2';
    } else {
      densityStr = densityWcm2.toFixed(1);
      densityUnit = 'W/cm\u00B2';
    }
    document.getElementById('ls-density').textContent = densityStr;
    document.getElementById('ls-density-unit').innerHTML = densityUnit;

    // Notes
    let note = '';
    if (densityWcm2 > 1e6) note = 'This power density will ablate most metals and melt silicon.';
    else if (densityWcm2 > 1e4) note = 'Sufficient for thin metal film ablation (Al, Cu, Ag).';
    else if (densityWcm2 > 100) note = 'Suitable for egg white photoresist exposure.';
    else note = 'Very low power density - may be insufficient for crosslinking.';
    document.getElementById('ls-note').textContent = note;
  }

  [wlSlider, naSlider, pwSlider, m2Slider].forEach(s => s.addEventListener('input', update));
  update();
}

// Auto-init widgets when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initSpinCoatingWidget('widget-spin-coating');
  initLaserSpotWidget('widget-laser-spot');
});
