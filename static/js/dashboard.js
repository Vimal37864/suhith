/* ═══════════════════════════════════════════════════════════
   Dashboard JavaScript — Charts, Maps, Predictions
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadTemporalCharts();
  loadHeatmap();
  loadModelPerformance();
});

// ── Chart.js Global Config ────────────────────────────────────
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.elements.bar.borderRadius = 6;
Chart.defaults.elements.arc.borderWidth = 2;
Chart.defaults.scale.grid = { color: 'rgba(56,189,248,0.06)' };

const COLORS = {
  cyan: '#22d3ee', blue: '#3b82f6', purple: '#a855f7',
  pink: '#ec4899', green: '#10b981', orange: '#f59e0b',
  red: '#ef4444', yellow: '#eab308', indigo: '#6366f1', teal: '#14b8a6'
};
const PALETTE = Object.values(COLORS);

// ── Animated Counter ──────────────────────────────────────────
function animateCounter(el, target, suffix = '') {
  const duration = 1500;
  const start = performance.now();
  const from = 0;
  const step = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(from + (target - from) * eased);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Load Statistics ───────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    animateCounter(document.getElementById('stat-total'), data.total_crimes);
    animateCounter(document.getElementById('stat-arrest'), data.arrest_rate, '%');
    animateCounter(document.getElementById('stat-highrisk'), data.high_risk_pct, '%');
    animateCounter(document.getElementById('stat-accuracy'), data.best_model_accuracy, '%');
  } catch (e) {
    console.error('Stats error:', e);
  }
}

// ── Load Temporal Charts ──────────────────────────────────────
async function loadTemporalCharts() {
  try {
    const res = await fetch('/api/temporal');
    const data = await res.json();

    // Hourly chart
    new Chart(document.getElementById('hourlyChart'), {
      type: 'bar',
      data: {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{
          label: 'Crimes',
          data: data.hourly,
          backgroundColor: data.hourly.map((v, i) =>
            (i >= 20 || i <= 5) ? 'rgba(239,68,68,0.7)' : 'rgba(34,211,238,0.6)'
          ),
          borderColor: data.hourly.map((v, i) =>
            (i >= 20 || i <= 5) ? '#ef4444' : '#22d3ee'
          ),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { maxRotation: 45, font: { size: 10 } } },
          y: { beginAtZero: true }
        }
      }
    });

    // Daily chart
    new Chart(document.getElementById('dailyChart'), {
      type: 'line',
      data: {
        labels: data.daily_labels.map(d => d.slice(0, 3)),
        datasets: [{
          label: 'Crimes by Day',
          data: data.daily,
          borderColor: COLORS.purple,
          backgroundColor: 'rgba(168,85,247,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: COLORS.purple,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Monthly chart
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    new Chart(document.getElementById('monthlyChart'), {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Crimes by Month',
          data: data.monthly,
          borderColor: COLORS.cyan,
          backgroundColor: 'rgba(34,211,238,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: COLORS.cyan,
          pointBorderColor: '#0a0e1a',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Crime type doughnut
    const crimeLabels = Object.keys(data.crime_types);
    const crimeValues = Object.values(data.crime_types);
    new Chart(document.getElementById('crimeTypeChart'), {
      type: 'doughnut',
      data: {
        labels: crimeLabels,
        datasets: [{
          data: crimeValues,
          backgroundColor: PALETTE.slice(0, crimeLabels.length).map(c => c + 'cc'),
          borderColor: '#0a0e1a',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { font: { size: 11 }, padding: 10 } }
        }
      }
    });

    // Area distribution bar
    const areaLabels = Object.keys(data.areas);
    const areaValues = Object.values(data.areas);
    new Chart(document.getElementById('areaChart'), {
      type: 'bar',
      data: {
        labels: areaLabels,
        datasets: [{
          label: 'Crimes per Area',
          data: areaValues,
          backgroundColor: PALETTE.slice(0, areaLabels.length).map(c => c + '99'),
          borderColor: PALETTE.slice(0, areaLabels.length),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { font: { size: 11 } } }
        }
      }
    });

    // Severity pie
    const sevLabels = Object.keys(data.severity);
    const sevValues = Object.values(data.severity);
    const sevColors = { Low: COLORS.green, Medium: COLORS.orange, High: COLORS.red };
    new Chart(document.getElementById('severityChart'), {
      type: 'polarArea',
      data: {
        labels: sevLabels,
        datasets: [{
          data: sevValues,
          backgroundColor: sevLabels.map(l => (sevColors[l] || COLORS.blue) + '99'),
          borderColor: sevLabels.map(l => sevColors[l] || COLORS.blue),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { r: { ticks: { display: false }, grid: { color: 'rgba(56,189,248,0.06)' } } }
      }
    });

  } catch (e) {
    console.error('Temporal charts error:', e);
  }
}

// ── Load Heatmap ──────────────────────────────────────────────
async function loadHeatmap() {
  try {
    const res = await fetch('/api/heatmap');
    const points = await res.json();

    const map = L.map('crime-map', {
      zoomControl: false
    }).setView([13.02, 80.22], 12);

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 18
    }).addTo(map);

    const heatData = points.map(p => [p.lat, p.lon, p.intensity]);
    L.heatLayer(heatData, {
      radius: 20,
      blur: 18,
      maxZoom: 15,
      gradient: { 0.2: '#22d3ee', 0.4: '#3b82f6', 0.6: '#a855f7', 0.8: '#ec4899', 1.0: '#ef4444' }
    }).addTo(map);

    // Add markers for top crime areas
    const areaGroups = {};
    points.forEach(p => {
      if (!areaGroups[p.area]) areaGroups[p.area] = { lat: 0, lon: 0, count: 0 };
      areaGroups[p.area].lat += p.lat;
      areaGroups[p.area].lon += p.lon;
      areaGroups[p.area].count++;
    });

    Object.entries(areaGroups).forEach(([area, d]) => {
      const avgLat = d.lat / d.count;
      const avgLon = d.lon / d.count;
      const marker = L.circleMarker([avgLat, avgLon], {
        radius: Math.min(d.count / 10, 15),
        fillColor: '#22d3ee',
        color: '#0a0e1a',
        weight: 2,
        fillOpacity: 0.7
      }).addTo(map);
      marker.bindPopup(`<b style="color:#0a0e1a">${area}</b><br>Incidents: ${d.count}`);
    });

  } catch (e) {
    console.error('Heatmap error:', e);
  }
}

// ── Load Model Performance ────────────────────────────────────
async function loadModelPerformance() {
  try {
    const res = await fetch('/api/model-performance');
    const data = await res.json();

    const models = ['Random Forest', 'XGBoost', 'Decision Tree'];
    const metricNames = ['accuracy', 'precision', 'recall', 'f1_score'];
    const metricLabels = ['Accuracy', 'Precision', 'Recall', 'F1-Score'];
    const metricColors = [COLORS.cyan, COLORS.blue, COLORS.purple, COLORS.pink];

    // Fill metric cards
    models.forEach((model, idx) => {
      const m = data[model];
      if (!m) return;
      const card = document.getElementById(`metric-card-${idx}`);
      if (!card) return;
      card.querySelector('.model-name').textContent = model;
      metricNames.forEach((metric, mi) => {
        const el = card.querySelector(`.metric-${metric}`);
        if (el) el.textContent = (m[metric] * 100).toFixed(1) + '%';
      });
    });

    // Comparison bar chart
    const datasets = metricNames.map((metric, i) => ({
      label: metricLabels[i],
      data: models.map(m => data[m] ? +(data[m][metric] * 100).toFixed(1) : 0),
      backgroundColor: metricColors[i] + '99',
      borderColor: metricColors[i],
      borderWidth: 1
    }));

    new Chart(document.getElementById('modelComparisonChart'), {
      type: 'bar',
      data: { labels: models, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }
        },
        plugins: { legend: { position: 'top' } }
      }
    });

    // Feature importance
    if (data.feature_importance) {
      const fi = data.feature_importance.slice(0, 10);
      new Chart(document.getElementById('featureChart'), {
        type: 'bar',
        data: {
          labels: fi.map(f => f.feature),
          datasets: [{
            label: 'Importance',
            data: fi.map(f => f.importance),
            backgroundColor: fi.map((_, i) => PALETTE[i % PALETTE.length] + '99'),
            borderColor: fi.map((_, i) => PALETTE[i % PALETTE.length]),
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } }
        }
      });
    }

    // Confusion matrix for best model (RF)
    renderConfusionMatrix(data['Random Forest']);

  } catch (e) {
    console.error('Model performance error:', e);
  }
}

// ── Confusion Matrix Renderer ─────────────────────────────────
function renderConfusionMatrix(modelData) {
  if (!modelData || !modelData.confusion_matrix) return;
  const cm = modelData.confusion_matrix;
  const labels = modelData.target_names || ['High Risk', 'Low Risk', 'Medium Risk'];
  const container = document.getElementById('confusionMatrix');
  if (!container) return;

  const maxVal = Math.max(...cm.flat());
  let html = '<div style="display:grid;gap:3px;">';

  // Header row
  html += '<div style="display:grid;grid-template-columns:90px repeat(' + labels.length + ',1fr);gap:3px;">';
  html += '<div></div>';
  labels.forEach(l => {
    html += `<div style="text-align:center;font-size:0.7rem;color:#94a3b8;padding:4px;">${l}</div>`;
  });
  html += '</div>';

  // Data rows
  cm.forEach((row, i) => {
    html += '<div style="display:grid;grid-template-columns:90px repeat(' + labels.length + ',1fr);gap:3px;align-items:center;">';
    html += `<div style="font-size:0.7rem;color:#94a3b8;text-align:right;padding-right:8px;">${labels[i]}</div>`;
    row.forEach((val, j) => {
      const intensity = maxVal > 0 ? val / maxVal : 0;
      const bg = i === j
        ? `rgba(34,211,238,${0.15 + intensity * 0.6})`
        : `rgba(239,68,68,${intensity * 0.4})`;
      html += `<div style="text-align:center;padding:12px 4px;border-radius:8px;background:${bg};font-weight:700;font-size:0.9rem;color:#f1f5f9">${val}</div>`;
    });
    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

// ── Crime Prediction Form ─────────────────────────────────────
async function predictCrime() {
  const btn = document.getElementById('btn-predict-crime');
  btn.textContent = 'ANALYZING...';
  btn.disabled = true;

  const payload = {
    crime_type: document.getElementById('pred-crime-type').value,
    area: document.getElementById('pred-area').value,
    hour: document.getElementById('pred-hour').value,
    month: document.getElementById('pred-month').value,
    day_of_week: document.getElementById('pred-day').value,
    suspect_age_group: document.getElementById('pred-age').value,
    suspect_gender: document.getElementById('pred-gender').value,
    suspect_prior_record: document.getElementById('pred-prior').value,
    weapon_used: document.getElementById('pred-weapon').value,
  };

  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      let html = '<div class="result-header">⚡ Prediction Results</div>';
      Object.entries(data.predictions).forEach(([model, result]) => {
        const riskClass = result.prediction.toLowerCase().includes('high') ? 'high'
          : result.prediction.toLowerCase().includes('medium') ? 'medium' : 'low';

        html += `<div class="result-item">
          <span class="model-name">${model}</span>
          <span class="risk-badge ${riskClass}">${result.prediction}</span>
        </div>`;

        // Probability bars
        html += '<div class="prob-bar-wrapper">';
        Object.entries(result.probabilities).forEach(([cls, pct]) => {
          const barClass = cls.toLowerCase().includes('high') ? 'high-risk'
            : cls.toLowerCase().includes('medium') ? 'medium-risk' : 'low-risk';
          html += `<div class="prob-bar-label"><span>${cls}</span><span>${pct}%</span></div>`;
          html += `<div class="prob-bar-track"><div class="prob-bar-fill ${barClass}" style="width:${pct}%"></div></div>`;
        });
        html += '</div>';
      });

      document.getElementById('crime-prediction-result').innerHTML = html;
    }
  } catch (e) {
    document.getElementById('crime-prediction-result').innerHTML =
      '<div class="empty-state">❌ Error occurred</div>';
  }

  btn.textContent = '🔍 PREDICT RISK LEVEL';
  btn.disabled = false;
}

// ── Suspect Prediction Form ───────────────────────────────────
async function predictSuspect() {
  const btn = document.getElementById('btn-predict-suspect');
  btn.textContent = 'ANALYZING...';
  btn.disabled = true;

  const payload = {
    crime_type: document.getElementById('sus-crime-type').value,
    area: document.getElementById('sus-area').value,
    hour: document.getElementById('sus-hour').value,
  };

  try {
    const res = await fetch('/api/suspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      const sp = data.suspect_profile;
      const scoreColor = sp.suspect_match_score >= 70 ? '#ef4444'
        : sp.suspect_match_score >= 40 ? '#f59e0b' : '#10b981';

      let html = `
        <div class="result-header">🕵️ Suspect Profile Analysis</div>
        <div class="score-bar-container">
          <div class="score-value" style="color:${scoreColor}">${sp.suspect_match_score}%</div>
          <div class="score-label">Suspect Match Score</div>
        </div>
        <div class="suspect-profile">
          <div class="profile-stat">
            <span class="label">Most Likely Age Group</span>
            <span class="value">${sp.most_likely_age_group}</span>
          </div>
          <div class="profile-stat">
            <span class="label">Most Likely Gender</span>
            <span class="value">${sp.most_likely_gender}</span>
          </div>
          <div class="profile-stat">
            <span class="label">Prior Record Likelihood</span>
            <span class="value">${sp.prior_record_likelihood}%</span>
          </div>
          <div class="profile-stat">
            <span class="label">Arrest Likelihood</span>
            <span class="value">${sp.arrest_likelihood}%</span>
          </div>
          <div class="profile-stat">
            <span class="label">Similar Cases Analyzed</span>
            <span class="value">${data.similar_cases_analyzed}</span>
          </div>
        </div>`;

      if (data.risk_factors.length > 0) {
        html += '<div style="margin-top:0.75rem;padding:0.75rem;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.2)">';
        html += '<div style="font-size:0.78rem;font-weight:600;color:#ef4444;margin-bottom:6px">⚠️ Risk Factors</div>';
        data.risk_factors.forEach(f => {
          html += `<div style="font-size:0.78rem;color:#fca5a5;padding:2px 0">• ${f}</div>`;
        });
        html += '</div>';
      }

      document.getElementById('suspect-prediction-result').innerHTML = html;
    }
  } catch (e) {
    document.getElementById('suspect-prediction-result').innerHTML =
      '<div class="empty-state">❌ Error occurred</div>';
  }

  btn.textContent = '🕵️ ANALYZE SUSPECT PROFILE';
  btn.disabled = false;
}
