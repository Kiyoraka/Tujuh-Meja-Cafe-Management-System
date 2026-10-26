// Small view helpers: an escaping html`` template, a toast, and time formatting.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

class SafeHtml {
  constructor(text) { this.text = text; }
  toString() { return this.text; }
}

// Mark a string as already-safe markup (only for strings built by html``).
export function raw(text) {
  return new SafeHtml(text);
}

function renderValue(value) {
  if (value instanceof SafeHtml) return value.text;
  if (Array.isArray(value)) return value.map(renderValue).join('');
  if (value === false || value === null || value === undefined) return '';
  return escape(value);
}

// Interpolated values are escaped; nested html`` results and arrays of them pass through.
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => { out += renderValue(value) + strings[i + 1]; });
  return new SafeHtml(out);
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.style.animation = 'none';
  void el.offsetWidth; // restart the entry animation
  el.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
}

export function formatTime(date) {
  return date.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDate(date) {
  return date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function minutesBetween(from, to = new Date()) {
  return Math.max(0, Math.round((to - from) / 60000));
}

export function pluralize(count, word, plural = `${word}s`) {
  return `${count} ${count === 1 ? word : plural}`;
}
