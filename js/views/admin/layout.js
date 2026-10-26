// Admin shell: sidebar on desktop, bottom tab bar on phones, top bar with greeting
// and the live clock. defineAdmin() adds the sign-in guard and sign-out to a page.

import { html, raw, formatDate, formatTime, toast } from '../../ui.js';
import { currentUser, logout, requireAdmin } from '../../auth.js';
import { STATE } from '../../state.js';
import { currentPath, navigate } from '../../router.js';
import { icon } from '../icons.js';

const NAV = [
  { path: '/admin', label: 'Dashboard', short: 'Home', icon: 'dashboard' },
  { path: '/admin/floor', label: 'Floor', short: 'Floor', icon: 'floor' },
  { path: '/admin/bookings', label: 'Reservations', short: 'Bookings', icon: 'bookings' },
  { path: '/admin/waitlist', label: 'Waitlist', short: 'Queue', icon: 'waitlist' },
  { path: '/admin/tables', label: 'Tables', short: 'Tables', icon: 'tables' },
  { path: '/admin/settings', label: 'Settings', short: 'Settings', icon: 'settings' },
];

function greeting(now) {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function badge(path) {
  if (path === '/admin/waitlist' && STATE.queue.length) return html`<span class="nav-count">${STATE.queue.length}</span>`;
  if (path === '/admin/bookings') {
    const upcoming = STATE.bookings.filter((b) => b.status === 'upcoming').length;
    if (upcoming) return html`<span class="nav-count">${upcoming}</span>`;
  }
  return '';
}

export function adminPage({ title, subtitle = '', actions = '', content }) {
  const path = currentPath();
  const now = new Date();
  return html`
    <div class="admin">
      <aside class="admin-sidebar">
        <a class="wordmark" href="#/admin">Tujuh Meja<span class="seven">· 7</span></a>
        <nav class="admin-nav" aria-label="Admin">
          ${NAV.map((item) => html`
            <a href="#${item.path}" class="${path === item.path ? 'active' : ''}" ${path === item.path ? raw('aria-current="page"') : ''}>
              ${icon(item.icon)}<span>${item.label}</span>${badge(item.path)}
            </a>`)}
        </nav>
        <div class="admin-sidebar-foot">
          <a href="#/">${icon('cafe')}<span>View the cafe</span></a>
          <button type="button" data-action="signout">${icon('signout')}<span>Sign out</span></button>
        </div>
      </aside>

      <div class="admin-main">
        <header class="admin-topbar">
          <div>
            <p class="admin-greeting">${greeting(now)}, ${currentUser()}</p>
            <h1>${title}</h1>
            ${subtitle ? html`<p class="muted small" style="margin:0">${subtitle}</p>` : ''}
          </div>
          <div class="admin-topbar-side">
            ${actions}
            <span class="admin-clock">${formatDate(now)} · ${formatTime(now)}</span>
            <a class="topbar-icon" href="#/admin/settings" aria-label="Settings">${icon('settings')}</a>
            <button type="button" class="topbar-icon" data-action="signout" aria-label="Sign out">${icon('signout')}</button>
          </div>
        </header>
        <main class="admin-content">${content}</main>
      </div>

      <nav class="admin-tabbar" aria-label="Admin">
        ${NAV.slice(0, 5).map((item) => html`
          <a href="#${item.path}" class="${path === item.path ? 'active' : ''}">${icon(item.icon)}<span>${item.short}</span>${badge(item.path)}</a>`)}
      </nav>
    </div>`;
}

// Wrap an admin page definition: sign-in guard plus the shared sign-out action.
export function defineAdmin(view) {
  return {
    ...view,
    guard: requireAdmin,
    actions: {
      ...view.actions,
      signout() {
        logout();
        toast('Signed out.');
        navigate('/');
      },
    },
  };
}
