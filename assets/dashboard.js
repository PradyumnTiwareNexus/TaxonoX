/* ============================================
   TaxonoX — Dashboard Logic
   dashboard.js
   ============================================ */

'use strict';

/* ---- Load Stats ---- */
function loadDashboardStats() {
  const stats = TaxonoX.getVulnStats();
  const fields = {
    'stat-total': stats.total,
    'stat-critical': stats.critical,
    'stat-high': stats.high,
    'stat-medium': stats.medium,
    'stat-low': stats.low,
    'stat-info': stats.info,
    'stat-writeups': stats.writeups
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) { el.dataset.count = val; el.textContent = '0'; }
  });
  TaxonoX.animateCounter && setTimeout(() => {
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) TaxonoX.animateCounter(el, val, 900);
    });
  }, 200);

  // Weekly progress ring
  updateWeeklyProgress();
}

function updateWeeklyProgress() {
  const vulns = TaxonoX.Storage.get('vulns', []);
  const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = vulns.filter(v => new Date(v.date).getTime() > oneWeekAgo).length;
  const found = document.getElementById('progress-found');
  const total = document.getElementById('progress-total');
  if (found) found.textContent = thisWeek;
  if (total) total.textContent = vulns.length;

  // Update ring
  const ring = document.getElementById('progress-ring');
  if (ring) {
    const pct = Math.min((thisWeek / Math.max(10, thisWeek)) * 100, 100);
    const r = 38;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    ring.style.strokeDasharray = circ;
    ring.style.strokeDashoffset = offset;
  }

  const pctEl = document.getElementById('progress-pct');
  if (pctEl) {
    const pct = vulns.length ? Math.round((vulns.filter(v => v.status === 'Reported').length / vulns.length) * 100) : 0;
    pctEl.textContent = pct + '%';
  }
}

/* ---- Donut Chart ---- */
function drawDonutChart() {
  const canvas = document.getElementById('donut-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stats = TaxonoX.getVulnStats();
  const total = stats.total || 1;

  const segments = [
    { label: 'Critical', value: stats.critical, color: '#ff2d55' },
    { label: 'High', value: stats.high, color: '#ff6b35' },
    { label: 'Medium', value: stats.medium, color: '#fbbf24' },
    { label: 'Low', value: stats.low, color: '#06b6d4' },
    { label: 'Info', value: stats.info, color: '#8b5cf6' }
  ].filter(s => s.value > 0);

  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const outerR = Math.min(W, H) / 2 - 8;
  const innerR = outerR * 0.6;

  ctx.clearRect(0, 0, W, H);

  let startAngle = -Math.PI / 2;
  segments.forEach(seg => {
    const angle = (seg.value / total) * 2 * Math.PI;

    // Glow
    ctx.save();
    ctx.shadowColor = seg.color;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(startAngle) * innerR, cy + Math.sin(startAngle) * innerR);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + angle);
    ctx.arc(cx, cy, innerR, startAngle + angle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.restore();

    // Gap
    startAngle += angle + 0.02;
  });

  // Center text
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${Math.floor(outerR * 0.36)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stats.total, cx, cy - 8);
  ctx.fillStyle = 'rgba(148,163,184,0.8)';
  ctx.font = `${Math.floor(outerR * 0.18)}px Inter, sans-serif`;
  ctx.fillText('Total', cx, cy + 14);
}

/* ---- Line Chart (Vulnerability Over Time) ---- */
function drawLineChart() {
  const canvas = document.getElementById('line-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const vulns = TaxonoX.Storage.get('vulns', []);

  // Build last 12 data points
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      count: vulns.filter(v => {
        const vd = new Date(v.date);
        return vd.getMonth() === d.getMonth() && vd.getFullYear() === d.getFullYear();
      }).length
    });
  }

  ctx.clearRect(0, 0, W, H);

  const padL = 32, padR = 12, padT = 12, padB = 32;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const maxVal = Math.max(...months.map(m => m.count), 5);

  const pts = months.map((m, i) => ({
    x: padL + (i / (months.length - 1)) * cW,
    y: padT + cH - (m.count / maxVal) * cH,
    count: m.count,
    label: m.label
  }));

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (i / 4) * cH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
  }

  // Area fill
  const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
  grad.addColorStop(0, 'rgba(136,85,255,0.25)');
  grad.addColorStop(1, 'rgba(136,85,255,0.0)');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cpx, pts[i - 1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.lineTo(pts[pts.length - 1].x, padT + cH);
  ctx.lineTo(pts[0].x, padT + cH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cpx, pts[i - 1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = '#8855ff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#8855ff';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Dots
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#a07aff';
    ctx.fill();
    ctx.strokeStyle = '#050714';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // X labels
  ctx.fillStyle = 'rgba(148,163,184,0.6)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  const skip = Math.ceil(months.length / 6);
  pts.forEach((p, i) => {
    if (i % skip === 0) ctx.fillText(p.label, p.x, H - 4);
  });
}

/* ---- Top Weakness Types ---- */
function loadTopWeaknesses() {
  const container = document.getElementById('top-weaknesses');
  if (!container) return;
  const vulns = TaxonoX.Storage.get('vulns', []);
  const total = vulns.length || 1;

  const cats = {};
  vulns.forEach(v => {
    const cat = v.owasp || 'Unknown';
    cats[cat] = (cats[cat] || 0) + 1;
  });

  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const colors = ['#8855ff', '#ff6b35', '#06b6d4', '#10b981', '#fbbf24'];

  container.innerHTML = sorted.map(([cat, count], i) => `
    <div class="category-item">
      <div class="category-header">
        <span class="category-name">${cat}</span>
        <span class="category-count" style="color:${colors[i]}">${count} <span style="color:var(--text-muted);font-weight:400">(${Math.round(count/total*100)}%)</span></span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" data-width="${Math.round(count/total*100)}" style="background:${colors[i]};width:0%"></div>
      </div>
    </div>
  `).join('');

  TaxonoX && setTimeout(() => {
    container.querySelectorAll('.progress-fill[data-width]').forEach(el => {
      el.style.width = el.dataset.width + '%';
    });
  }, 300);
}

/* ---- Recent Activity ---- */
function loadRecentActivity() {
  const container = document.getElementById('recent-activity');
  if (!container) return;
  const vulns = TaxonoX.Storage.get('vulns', []);
  const recent = [...vulns].sort((a, b) => (b.viewed || 0) - (a.viewed || 0)).slice(0, 5);

  const icons = { Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🔵', Info: '🟣' };
  const statusMsg = { New: 'New vulnerability added', 'In Progress': 'Status: In Progress', Confirmed: 'Confirmed', Reported: 'Reported', Duplicate: 'Marked as Duplicate' };

  if (!recent.length) {
    container.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-state-icon">📋</div><div class="empty-state-text">No recent activity</div></div>';
    return;
  }

  container.innerHTML = recent.map(v => `
    <div class="activity-item">
      <div class="activity-icon">${icons[v.severity] || '⚪'}</div>
      <div style="flex:1;min-width:0">
        <div class="activity-title">${v.name} <span class="vuln-id">${v.id}</span></div>
        <div class="activity-meta">${statusMsg[v.status] || v.status}</div>
      </div>
      <div class="activity-meta">${TaxonoX.timeAgo(v.viewed || Date.now())}</div>
    </div>
  `).join('');
}

/* ---- Popular Categories ---- */
function loadPopularCategories() {
  const container = document.getElementById('popular-categories');
  if (!container) return;
  const vulns = TaxonoX.Storage.get('vulns', []);

  const tagCounts = {};
  vulns.forEach(v => (v.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));

  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] || 1;
  const barColors = ['progress-purple', 'progress-blue', 'progress-cyan', 'progress-orange', 'progress-yellow'];

  if (!sorted.length) {
    container.innerHTML = '<div class="text-muted text-sm" style="padding:12px">No tags found</div>';
    return;
  }

  container.innerHTML = sorted.map(([tag, count], i) => `
    <div class="category-item">
      <div class="category-header">
        <span class="category-name">${tag}</span>
        <span class="category-count">${count}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${barColors[i]}" data-width="${Math.round(count/max*100)}" style="width:0%"></div>
      </div>
    </div>
  `).join('');

  setTimeout(() => {
    container.querySelectorAll('.progress-fill[data-width]').forEach(el => {
      el.style.width = el.dataset.width + '%';
    });
  }, 400);
}

/* ---- Mini Vulnerability Table on Dashboard ---- */
function loadDashboardTable() {
  const tbody = document.getElementById('dashboard-vuln-body');
  if (!tbody) return;
  const vulns = TaxonoX.Storage.get('vulns', []).slice(0, 6);

  if (!vulns.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:24px">No vulnerabilities yet. Add your first one!</td></tr>';
    return;
  }

  tbody.innerHTML = vulns.map((v, i) => `
    <tr class="table-row-animate" style="animation-delay:${i * 50}ms">
      <td><span class="vuln-id">${v.id}</span></td>
      <td>
        <a href="vulnerability.html?id=${v.id}" style="color:var(--text-primary);text-decoration:none;font-weight:500;font-size:13px" class="hover-text">
          ${v.starred ? '<span title="Starred" style="color:#fbbf24;margin-right:4px">★</span>' : ''}
          ${v.name}
        </a>
      </td>
      <td><span class="badge badge-${v.severity.toLowerCase()}">${v.severity}</span></td>
      <td><span class="text-muted text-xs">${v.owasp || '—'}</span></td>
      <td><span class="font-mono text-xs text-secondary">${v.cwe || '—'}</span></td>
      <td><span class="badge badge-${v.status.toLowerCase().replace(' ','-').replace('/','-')}">
        <span class="status-dot ${v.status.toLowerCase().replace(' ','-')}"></span>
        ${v.status}
      </span></td>
      <td class="text-muted text-xs">${TaxonoX.formatDate(v.date)}</td>
      <td>
        <div style="display:flex;gap:4px">
          ${(v.tags || []).slice(0,2).map(t => `<span class="tag">${t}</span>`).join('')}
          ${(v.tags || []).length > 2 ? `<span class="tag">+${(v.tags || []).length - 2}</span>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

/* ---- Add Vulnerability Form ---- */
function initAddVulnForm() {
  const form = document.getElementById('add-vuln-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    const vulns = TaxonoX.Storage.get('vulns', []);
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const newVuln = {
      id: TaxonoX.genId('VULN'),
      name: data.name || 'Unnamed Vulnerability',
      severity: data.severity || 'Medium',
      owasp: data.owasp || '',
      cwe: data.cwe || '',
      status: data.status || 'New',
      date: data.discoveredOn || new Date().toISOString().slice(0, 10),
      tags,
      target: data.target || '',
      platform: data.platform || '',
      shortDesc: data.shortDesc || '',
      description: data.description || '',
      howToFind: data.howToFind || '',
      exploit: data.exploit || '',
      remediation: data.remediation || '',
      starred: false,
      viewed: Date.now()
    };

    vulns.unshift(newVuln);
    TaxonoX.Storage.set('vulns', vulns);
    TaxonoX.closeModal('add-vuln-modal');
    form.reset();

    TaxonoX.showToast('success', 'Vulnerability Added', `${newVuln.name} (${newVuln.id}) saved`);
    loadDashboard();
  });
}

/* ---- Quick actions ---- */
function initQuickActions() {
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) exportBtn.addEventListener('click', TaxonoX.exportData);

  const importInput = document.getElementById('import-file');
  if (importInput) {
    importInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) TaxonoX.importData(file);
    });
  }
}

/* ---- Load All Dashboard Sections ---- */
function loadDashboard() {
  loadDashboardStats();
  drawDonutChart();
  drawLineChart();
  loadTopWeaknesses();
  loadRecentActivity();
  loadPopularCategories();
  loadDashboardTable();
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  initAddVulnForm();
  initQuickActions();

  // Redraw charts on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawDonutChart();
      drawLineChart();
    }, 200);
  });
});
