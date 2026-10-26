// Admin shell: sidebar on desktop, bottom tab bar on phones, top bar with greeting
// and the live clock. defineAdmin() adds the sign-in guard and sign-out to a page.

import { html, raw, formatDate, formatTime, toast } from '../../ui.js';
import { currentUser, logout, requireAdmin } from '../../auth.js';
import { STATE } from '../../state.js';
import { currentPath, navigate } from '../../router.js';

const ICON_PATHS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  floor: '<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><rect x="4" y="14" width="16" height="6" rx="2"/>',
  bookings: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  waitlist: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  tables: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M6 12v8M18 12v8M12 3v5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  signout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  cafe: '<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3"/>',
};

export function icon(name) {
  return raw(`<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`);
}

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
        navigate('/login');
      },
    },
  };
}
