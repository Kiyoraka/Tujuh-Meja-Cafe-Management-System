// Demo sign-in for two roles. Any email and any password work, so a visitor can
// look around without an account. Each role keeps its email in sessionStorage
// (a refresh keeps you in; the cafe data itself still resets). Staff and customer
// are separate: signing out of one leaves the other.

const STAFF_KEY = 'tm_admin';
const GUEST_KEY = 'tm_guest';
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DEMO_LOGIN = { email: 'owner@tujuhmeja.cafe', password: 'demo1234' };
export const DEMO_GUEST = { email: 'guest@tujuhmeja.cafe', password: 'demo1234' };

// Storage can be blocked (private mode, strict settings); fall back to memory.
const memory = {};

function read(key) {
  try { return sessionStorage.getItem(key); } catch { return memory[key] ?? null; }
}

function write(key, email) {
  memory[key] = email;
  try {
    if (email) sessionStorage.setItem(key, email);
    else sessionStorage.removeItem(key);
  } catch { /* memory fallback already set */ }
}

function check(email, password) {
  const cleanEmail = (email || '').trim();
  if (!EMAIL_SHAPE.test(cleanEmail)) return { ok: false, field: 'email', reason: 'Enter an email address, any one works.' };
  if (!(password || '').length) return { ok: false, field: 'password', reason: 'Enter a password, any one works.' };
  return { ok: true, email: cleanEmail };
}

// ---------- staff ----------

export function login(email, password) {
  const result = check(email, password);
  if (result.ok) write(STAFF_KEY, result.email);
  return result;
}

export function logout() {
  write(STAFF_KEY, null);
}

export const currentUser = () => read(STAFF_KEY);
export const isSignedIn = () => Boolean(read(STAFF_KEY));

// Route guard for every #/admin page.
export function requireAdmin() {
  return isSignedIn() ? null : '/login';
}

// ---------- customer ----------

export function loginGuest(email, password) {
  const result = check(email, password);
  if (result.ok) write(GUEST_KEY, result.email);
  return result;
}

export function logoutGuest() {
  write(GUEST_KEY, null);
}

export const currentGuest = () => read(GUEST_KEY);
export const isGuestSignedIn = () => Boolean(read(GUEST_KEY));

// Route guard for #/account.
export function requireGuest() {
  return isGuestSignedIn() ? null : '/login?as=customer';
}
