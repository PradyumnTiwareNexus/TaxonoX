/* ============================================
   TaxonoX — Auth Guard
   Included on every page except index.html
   ============================================ */
'use strict';

(function() {
  const mode = localStorage.getItem('txnx_mode');
  const page = window.location.pathname.split('/').pop() || 'index.html';

  // Not authenticated at all → redirect to login
  if (!mode) {
    window.location.replace('index.html');
    return;
  }

  // If user mode: Firebase auth state will self-restore (persistent session).
  // We trust localStorage mode flag for initial render speed.
  // Firebase auth observer below handles token expiry edge cases.
  if (mode === 'user' && window.auth) {
    window.auth.onAuthStateChanged(user => {
      if (!user) {
        // Token expired or revoked — clear and redirect
        localStorage.setItem('txnx_mode', '');
        window.location.replace('index.html');
      }
    });
  }
})();
