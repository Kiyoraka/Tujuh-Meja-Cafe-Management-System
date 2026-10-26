// Shared public header and footer for the customer pages, plus the sign-in dialog.

import { html, formatTime } from '../ui.js';
import { currentPath } from '../router.js';
import { STATE } from '../state.js';
import { isSignedIn, isGuestSignedIn } from '../auth.js';
import { icon } from './icons.js';
import { signInDialog } from './signin.js';

function clock(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return formatTime(d);
}

const NAV = [
  { href: '#/', label: 'Home' },
  { href: '#/book', label: 'Book a table' },
  { href: '#/queue', label: 'Join the queue' },
];

// Who is signed in decides the header pill (and the last phone tab).
export function accountLink() {
  if (isSignedIn()) return { label: 'Dashboard', href: '#/admin', icon: 'dashboard' };
  if (isGuestSignedIn()) return { label: 'Me', href: '#/account', icon: 'user' };
  return null;
}

function headerCta() {
  const link = accountLink();
  return link
    ? html`<a class="header-cta" href="${link.href}">${icon(link.icon)}<span>${link.label}</span></a>`
    : html`<button type="button" class="header-cta" data-action="signin-open" data-tab="customer">${icon('signin')}<span>Sign in</span></button>`;
}

export function publicHeader() {
  const path = currentPath();
  return html`
    <header class="site-header">
      <div class="container">
        <a class="wordmark" href="#/" aria-label="Tujuh Meja Cafe home">Tujuh Meja<span class="seven">· 7</span></a>
        <nav class="site-nav" aria-label="Main">
          ${NAV.map((item) => html`<a href="${item.href}" class="${path === item.href.slice(1) ? 'active' : ''}">${item.label}</a>`)}
        </nav>
        ${headerCta()}
      </div>
    </header>`;
}

export function publicFooter() {
  return html`
    <footer class="site-footer">
      <div class="container">
        <div>
          <h4>Tujuh Meja Cafe</h4>
          <p>Seven tables, one good cup of coffee at a time.</p>
        </div>
        <div>
          <h4>Hours</h4>
          <p>Every day, ${clock(STATE.settings.openTime)} – ${clock(STATE.settings.closeTime)}</p>
        </div>
        <div>
          <h4>Find us</h4>
          <p>12 Jalan Tujuh, Kota Contoh (demo address)</p>
          <p><button type="button" class="link-btn" data-action="signin-open" data-tab="staff">Staff sign in →</button></p>
        </div>
      </div>
    </footer>`;
}

// Phone bottom nav: Home, Book, Queue, My place, and Sign in / Me / Dashboard.
const TABS = [
  { href: '#/', label: 'Home', icon: 'home', paths: ['/'] },
  { href: '#/book', label: 'Book', icon: 'book', paths: ['/book', '/book/done'] },
  { href: '#/queue', label: 'Queue', icon: 'waitlist', paths: ['/queue'] },
  { href: '#/queue/me', label: 'My place', icon: 'clock', paths: ['/queue/me'] },
];

export function publicTabbar() {
  const path = currentPath();
  const queued = STATE.myQueueNo !== null && STATE.queue.some((q) => q.no === STATE.myQueueNo);
  const link = accountLink();
  const tab = (t) => html`
    <a href="${t.href}" class="${t.paths.includes(path) ? 'active' : ''}" ${t.paths.includes(path) ? html`aria-current="page"` : ''}>
      ${icon(t.icon)}<span>${t.label}</span>
      ${t.href === '#/queue/me' && queued ? html`<span class="nav-count">#${STATE.myQueueNo}</span>` : ''}
    </a>`;
  return html`
    <nav class="site-tabbar" aria-label="Main">
      ${TABS.map(tab)}
      ${link
        ? html`<a href="${link.href}" class="${path === link.href.slice(1) ? 'active' : ''}">${icon(link.icon)}<span>${link.label}</span></a>`
        : html`<button type="button" data-action="signin-open" data-tab="customer">${icon('signin')}<span>Sign in</span></button>`}
    </nav>`;
}

export function publicPage(content) {
  return html`
    <div class="public">
      ${publicHeader()}<main>${content}</main>${publicFooter()}${publicTabbar()}${signInDialog()}
    </div>`;
}
