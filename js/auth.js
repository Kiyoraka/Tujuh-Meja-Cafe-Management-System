// Demo sign-in: any email and any password open the dashboard, so a visitor can
// look around without an account. The signed-in email lives in sessionStorage so
// a refresh keeps you in (the cafe data itself still resets).

const KEY = 'tm_admin';
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DEMO_LOGIN = { email: 'owner@tujuhmeja.cafe', password: 'demo1234' };

// Storage can be blocked (private mode, strict settings); fall back to memory.
let memoryEmail = null;

function read() {
  try { return sessionStorage.getItem(KEY); } catch { return memoryEmail; }
}

function write(email) {
  memoryEmail = email;
  try {
    if (email) sessionStorage.setItem(KEY, email);
    else sessionStorage.removeItem(KEY);
  } catch { /* memory fallback already set */ }
}

export function login(email, password) {
  const cleanEmail = (email || '').trim();
  if (!EMAIL_SHAPE.test(cleanEmail)) return { ok: false, field: 'email', reason: 'Enter an email address, any one works.' };
  if (!(password || '').length) return { ok: false, field: 'password', reason: 'Enter a password, any one works.' };
  write(cleanEmail);
  return { ok: true, email: cleanEmail };
}

export function logout() {
  write(null);
}

export const currentUser = () => read();
export const isSignedIn = () => Boolean(read());

// Route guard for every #/admin page.
export function requireAdmin() {
  return isSignedIn() ? null : '/login';
}
