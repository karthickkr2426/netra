(function () {
  'use strict';

  const roleLabels = {
    specialist: 'Specialist Workstation',
    phc: 'PHC Village Kiosk',
    district: 'District Operations',
    patient: 'Patient-Friendly View'
  };

  const patients = [
    { name: 'Ramesh Gowda', meta: 'ID #KA-CKB-2026-084 · Bagepalli PHC', severity: 'URGENT · 87', type: 'urgent' },
    { name: 'Lakshmi Devi', meta: 'ID #KA-CKB-2026-081 · Gudibande PHC', severity: 'URGENT · 82', type: 'urgent' },
    { name: 'Suresh Babu', meta: 'ID #KA-CKB-2026-077 · Chintamani PHC', severity: 'URGENT · 78', type: 'urgent' },
    { name: 'Meena Rani', meta: 'ID #KA-CKB-2026-072 · Sidlaghatta PHC', severity: 'ROUTINE · 41', type: 'routine' },
    { name: "Joseph D'Souza", meta: 'ID #KA-CKB-2026-069 · Bagepalli PHC', severity: 'ROUTINE · 26', type: 'routine' }
  ];

  const state = {
    role: localStorage.getItem('netra_active_role') || 'specialist',
    filter: 'all',
    layer: 1,
    elapsed: 19,
    queued: 0
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function setRole(role) {
    state.role = role;
    const allowedViews = role === 'patient' ? ['patient'] : ['specialist', 'phc', 'district'];
    $$('.role-nav button').forEach((button) => {
      const allowed = allowedViews.includes(button.dataset.view);
      button.hidden = !allowed;
      button.classList.toggle('active', button.dataset.view === role);
    });
    const activeView = allowedViews.includes(role) ? role : allowedViews[0];
    $$('.workstation-view').forEach((view) => view.classList.toggle('active', view.dataset.view === activeView));
    const roleLabel = $('#current-role-label');
    if (roleLabel) roleLabel.textContent = roleLabels[activeView];
  }

  function renderQueue() {
    const queue = $('#patient-queue');
    if (!queue) return;
    queue.innerHTML = patients
      .filter((patient) => state.filter === 'all' || patient.type === state.filter)
      .map((patient, index) => `<button class="queue-patient ${index === 0 ? 'selected' : ''}" data-name="${patient.name}"><span><strong>${patient.name}</strong><small>${patient.meta}</small></span><b class="severity ${patient.type}">${patient.severity}</b></button>`)
      .join('');
    $$('.queue-patient').forEach((button) => button.addEventListener('click', () => {
      $$('.queue-patient').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      const name = $('#patient-name');
      if (name) name.textContent = button.dataset.name;
    }));
  }

  function drawRetina() {
    const canvas = $('#retina-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const layer = state.layer;
    const gradient = ctx.createRadialGradient(400, 300, 40, 400, 300, 330);
    gradient.addColorStop(0, layer === 3 ? '#b91c1c' : '#d77a42');
    gradient.addColorStop(0.45, layer === 4 ? '#7f1d1d' : '#8d4a2d');
    gradient.addColorStop(1, '#120b0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    ctx.save();
    ctx.translate(400, 300);
    ctx.scale(1.05, 0.85);
    ctx.strokeStyle = layer === 2 ? '#86efac' : 'rgba(245,158,11,.55)';
    ctx.lineWidth = layer === 2 ? 3 : 2;
    for (let index = 0; index < 18; index += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(index) * 180, Math.sin(index) * 130, Math.cos(index) * 380, Math.sin(index) * 240);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(270, 285, 24, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(490, 300, 35, 0, Math.PI * 2);
    ctx.fill();
    if (layer >= 3) {
      for (let index = 0; index < 14; index += 1) {
        ctx.fillStyle = layer === 3 ? 'rgba(239,68,68,.8)' : '#ef4444';
        ctx.beginPath();
        ctx.arc(470 + Math.cos(index * 2.4) * 120, 300 + Math.sin(index * 2.4) * 90, layer === 4 ? 7 : 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function setupLoupe() {
    const viewport = $('.canvas-wrap');
    const loupe = $('#retina-loupe');
    const canvas = $('#retina-canvas');
    if (!viewport || !loupe || !canvas) return;
    viewport.addEventListener('mousemove', (event) => {
      const bounds = viewport.getBoundingClientRect();
      loupe.style.display = 'block';
      loupe.style.left = `${event.clientX - bounds.left - 58}px`;
      loupe.style.top = `${event.clientY - bounds.top - 58}px`;
      loupe.style.background = `url(${canvas.toDataURL()}) center / 220% no-repeat`;
    });
    viewport.addEventListener('mouseleave', () => { loupe.style.display = 'none'; });
  }

  function updateSimulation() {
    const arrival = Number($('#sim-arrival-rate')?.value || 274);
    const specialists = Number($('#sim-specialists')?.value || 2);
    const bandwidth = Number($('#sim-bandwidth')?.value || 10);
    const wait = Math.max(2.4, (arrival / (specialists * 11)) + (10 / bandwidth) - 1.3);
    $('#sim-arrival-value').textContent = `${arrival} patients/day`;
    $('#sim-specialists-value').textContent = `${specialists} Specialist${specialists === 1 ? '' : 's'}`;
    $('#sim-bandwidth-value').textContent = `${bandwidth} Mbps`;
    $('#sim-wait').textContent = `${wait.toFixed(1)} Hours`;
    $('#sim-recommendation').innerHTML = `At <strong>${arrival} patients/day</strong>, <strong>${specialists} specialist${specialists === 1 ? '' : 's'}</strong> project an average wait of <strong>${wait.toFixed(1)}h</strong>.`;
    $('#sim-sla').textContent = wait < 24 ? '✓ Complies with <24h SLA' : '⚠ Exceeds 24h SLA';
    $('#sim-sla').className = `status-badge ${wait < 24 ? 'normal' : 'critical'}`;
  }

  function speakPatientReport() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = $('#patient-report')?.textContent || 'Please visit the district eye hospital for your specialist checkup.';
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  function init() {
    document.documentElement.dataset.theme = localStorage.getItem('netra_theme') || 'light';
    const storedRole = ['specialist', 'phc', 'district', 'patient'].includes(state.role) ? state.role : 'specialist';
    setRole(storedRole);
    renderQueue();
    drawRetina();
    setupLoupe();

    $$('.role-nav button').forEach((button) => button.addEventListener('click', () => setRole(button.dataset.view)));
    $$('.queue-filter button').forEach((button) => button.addEventListener('click', () => {
      $$('.queue-filter button').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      state.filter = button.dataset.filter;
      renderQueue();
    }));
    $$('.layer-button').forEach((button) => button.addEventListener('click', () => {
      $$('.layer-button').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      state.layer = Number(button.dataset.layer);
      drawRetina();
    }));
    $('#zoom-reset')?.addEventListener('click', () => {
      const canvas = $('#retina-canvas');
      if (canvas) canvas.style.transform = 'scale(1)';
    });
    $('#compare-button')?.addEventListener('click', () => $('#compare-panel').classList.toggle('open'));
    $('#close-compare')?.addEventListener('click', () => $('#compare-panel').classList.remove('open'));
    $('#theme-button')?.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('netra_theme', next);
    });
    $('.work-tools a[href="login.html"]')?.addEventListener('click', () => {
      localStorage.removeItem('netra_active_role');
      localStorage.removeItem('netra_active_doctor');
    });
    $('#agree-button')?.addEventListener('click', (event) => { event.currentTarget.textContent = '✓ Verdict Recorded'; });
    $('#override-button')?.addEventListener('click', () => {
      const grade = window.prompt('Override DR grade (0-4):', '2');
      if (grade !== null) window.alert(`Case updated to Grade ${grade}. Audit entry created.`);
    });
    $('#report-button')?.addEventListener('click', () => window.print());
    $('#notes-button')?.addEventListener('click', () => window.prompt('Add clinical note:'));
    $$('.assistant-prompt').forEach((button) => button.addEventListener('click', () => window.alert(`${button.textContent}\n\nGrounded in current patient telemetry.`)));
    $$('.eye-tab').forEach((button) => button.addEventListener('click', () => {
      $$('.eye-tab').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      $('#eye-hud').textContent = `${button.dataset.eye} · Macula Centred`;
    }));
    $$('.capture-test').forEach((button) => button.addEventListener('click', () => {
      const quality = $('#capture-quality');
      const message = $('#capture-message');
      const good = button.dataset.quality === 'good';
      quality.textContent = good ? '✓ Quality: Gradable' : '⚠ Quality: Recapture';
      quality.className = `status-badge ${good ? 'normal' : 'warning'}`;
      message.textContent = good ? 'Sharp focus, adequate illumination, 45° FOV achieved.' : `${button.dataset.quality === 'dark' ? 'Image too dark' : 'Motion blur detected'}. Capture again.`;
      $('#tri-refer').style.display = good ? 'flex' : 'none';
      $('#tri-recapture').style.display = good ? 'none' : 'flex';
    }));
    $('#manual-sync')?.addEventListener('click', () => { state.queued = 0; $('#outbox-count').textContent = '0 queued'; $('#outbox-status').textContent = 'Connected · Auto-synced'; });
    $('#queue-record')?.addEventListener('click', () => { state.queued += 1; $('#outbox-count').textContent = `${state.queued} queued`; $('#outbox-status').textContent = 'Offline · Stored locally'; });
    $('#speak-report')?.addEventListener('click', speakPatientReport);
    $('#patient-speak-report')?.addEventListener('click', speakPatientReport);
    $$('.font-scale').forEach((button) => button.addEventListener('click', () => {
      $$('.font-scale').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      document.querySelector('.patient-content').dataset.scale = button.dataset.scale;
    }));
    ['sim-arrival-rate', 'sim-specialists', 'sim-bandwidth'].forEach((id) => $(`#${id}`)?.addEventListener('input', updateSimulation));
    updateSimulation();
    window.setInterval(() => {
      state.elapsed += 1;
      const seconds = String(state.elapsed % 60).padStart(2, '0');
      const timer = $('#review-timer');
      if (timer) timer.textContent = `00:${seconds}`;
    }, 1000);
  }

  document.addEventListener('DOMContentLoaded', init);
}());
