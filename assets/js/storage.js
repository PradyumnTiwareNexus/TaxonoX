/* ============================================
   TaxonoX — Dual Mode Storage
   Guest: localStorage | User: Firestore + localStorage cache
   ============================================ */
'use strict';

const TXStorage = {
  prefix: 'txnx_',
  _realtimeUnsubs: [],

  isLoggedIn() {
    return localStorage.getItem('txnx_mode') === 'user';
  },

  getUID() {
    return localStorage.getItem('txnx_uid') || null;
  },

  getUsername() {
    const s = this.get('settings', {});
    return s.username || localStorage.getItem('txnx_username') || 'Hunter';
  },

  /* ---- Local Storage ---- */
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(this.prefix + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },

  set(key, value) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch {}
    // Fire-and-forget Firestore write if logged in
    if (this.isLoggedIn()) this._fsSet(key, value);
  },

  remove(key) { localStorage.removeItem(this.prefix + key); },

  /* ---- Firestore (write-through) ---- */
  _fsSet(key, value) {
    if (!window.db) return;
    const uid = this.getUID();
    if (!uid) return;
    window.db.collection(key).doc(uid)
      .set({ value, updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
      .catch(e => console.warn('[TXStorage] Firestore write failed:', key, e));
  },

  async _fsGet(key, fallback = null) {
    if (!window.db) return fallback;
    const uid = this.getUID();
    if (!uid) return fallback;
    try {
      const doc = await window.db.collection(key).doc(uid).get();
      return doc.exists ? (doc.data().value ?? fallback) : fallback;
    } catch(e) {
      console.warn('[TXStorage] Firestore read failed:', key, e);
      return fallback;
    }
  },

  /* ---- Sync from Firestore to localStorage on page load ---- */
  async syncFromFirestore(onDone) {
    if (!this.isLoggedIn() || !window.db) { if (onDone) onDone(); return; }
    const keys = ['vulns', 'payloads', 'notes', 'writeups', 'tools', 'settings', 'taxonomy'];
    try {
      await Promise.all(keys.map(async key => {
        const val = await this._fsGet(key);
        if (val !== null) {
          try { localStorage.setItem(this.prefix + key, JSON.stringify(val)); } catch {}
        }
      }));
    } catch(e) { console.warn('[TXStorage] Sync error:', e); }
    if (onDone) onDone();
  },

  /* ---- Real-time listener (Firestore onSnapshot) ---- */
  subscribe(key, callback) {
    if (!this.isLoggedIn() || !window.db) return;
    const uid = this.getUID();
    if (!uid) return;
    const unsub = window.db.collection(key).doc(uid).onSnapshot(doc => {
      if (doc.exists && doc.data().value !== undefined) {
        try { localStorage.setItem(this.prefix + key, JSON.stringify(doc.data().value)); } catch {}
        if (callback) callback(doc.data().value);
      }
    }, e => console.warn('[TXStorage] Snapshot error:', key, e));
    this._realtimeUnsubs.push(unsub);
    return unsub;
  },

  unsubscribeAll() {
    this._realtimeUnsubs.forEach(u => u && u());
    this._realtimeUnsubs = [];
  }
};

// Make available globally under both names
window.TXStorage = TXStorage;
