// One sign-in dialog with two tabs, Customer and Staff. It opens over whatever
// public page is showing; #/login (and #/login?as=customer) open it over the
// landing page so guard redirects and shared links still work.

import { html, toast } from '../ui.js';
import { login, loginGuest, isSignedIn, isGuestSignedIn, DEMO_LOGIN, DEMO_GUEST } from '../auth.js';
import { addGlobalHandlers, currentPath, navigate, queryParam, refresh } from '../router.js';
import { icon } from './icons.js';
import { landing } from './landing.js';

const TABS = {
  customer: { label: 'Customer', blurb: 'See your bookings and your place in the queue.', demo: DEMO_GUEST, button: 'Sign in' },
  staff: { label: 'Staff', blurb: 'Run the floor, the bookings and the queue.', demo: DEMO_LOGIN, button: 'Sign in to the dashboard' },
};

const dialog = { open: false, tab: 'customer', email: '', password: '', field: null, error: '' };
let openedForHash = null;
let customerSignedIn = () => {};

// Let the account page react to a customer's first sign-in (sample visit).
export function onCustomerSignIn(callback) {
  customerSignedIn = callback;
}

export function openSignIn(tab = 'customer') {
  Object.assign(dialog, { open: true, tab, email: '', password: '', field: null, error: '' });
  refresh({ force: true });
  setTimeout(() => document.getElementById('si-email')?.focus(), 0);
}

export function closeSignIn() {
  dialog.open = false;
  if (currentPath() === '/login') navigate('/');
  else refresh({ force: true });
}

export function signInDialog() {
  if (!dialog.open) return '';
  const tab = TABS[dialog.tab];
  const fieldError = (name) => (dialog.field === name ? html`<span class="field-error">${dialog.error}</span>` : '');
  return html`
    <div class="modal-backdrop">
      <button type="button" class="modal-scrim" data-action="signin-close" aria-label="Close"></button>
      <form class="modal signin-dialog" role="dialog" aria-modal="true" aria-labelledby="si-title" data-submit="signin" novalidate>
        <div class="signin-photo">
          <img src="assets/images/login-bg.webp" width="720" height="1080" alt="">
          <h2 id="si-title">Sign in to Tujuh Meja</h2>
          <button type="button" class="signin-close" data-action="signin-close" aria-label="Close">${icon('close')}</button>
        </div>
        <div class="signin-body">
          <div class="signin-tabs" role="tablist" aria-label="Sign in as">
            ${Object.entries(TABS).map(([key, t]) => html`
              <button type="button" role="tab" class="signin-tab" data-action="signin-tab" data-tab="${key}"
                aria-selected="${dialog.tab === key}">${icon(key === 'staff' ? 'dashboard' : 'user')}${t.label}</button>`)}
          </div>
          <p class="muted small" style="margin:0">${tab.blurb}</p>
          <div class="field">
            <label for="si-email">Email</label>
            <input id="si-email" class="input ${dialog.field === 'email' ? 'invalid' : ''}" type="email" data-input="signin-email"
              value="${dialog.email}" autocomplete="username" placeholder="${dialog.tab === 'staff' ? 'you@cafe.com' : 'you@mail.com'}">
            ${fieldError('email')}
          </div>
          <div class="field">
            <label for="si-password">Password</label>
            <input id="si-password" class="input ${dialog.field === 'password' ? 'invalid' : ''}" type="password" data-input="signin-password"
              value="${dialog.password}" autocomplete="current-password" placeholder="••••••••">
            ${fieldError('password')}
          </div>
          <button class="btn btn-primary btn-block" type="submit">${tab.button}</button>
          <div class="demo-hint">
            <span><b>Demo:</b> any email and password works.</span>
            <button type="button" class="btn btn-ghost btn-sm" data-action="signin-fill">Fill demo login</button>
          </div>
        </div>
      </form>
    </div>`;
}

addGlobalHandlers({
  actions: {
    'signin-open'(el) { openSignIn(el.dataset.tab || 'customer'); },
    'signin-close'() { closeSignIn(); },
    'signin-tab'(el) {
      Object.assign(dialog, { tab: el.dataset.tab, field: null, error: '' });
      refresh({ force: true });
    },
    'signin-fill'() {
      Object.assign(dialog, { ...TABS[dialog.tab].demo, field: null, error: '' });
      refresh({ force: true });
    },
  },
  inputs: {
    'signin-email'(el) { dialog.email = el.value; },
    'signin-password'(el) { dialog.password = el.value; },
  },
  submits: {
    signin() {
      const asStaff = dialog.tab === 'staff';
      const result = asStaff ? login(dialog.email, dialog.password) : loginGuest(dialog.email, dialog.password);
      if (!result.ok) {
        Object.assign(dialog, { field: result.field, error: result.reason });
        refresh({ force: true });
        return;
      }
      dialog.open = false;
      if (!asStaff) customerSignedIn(result.email);
      toast(asStaff ? 'Welcome to the dashboard.' : `Signed in as ${result.email}.`);
      navigate(asStaff ? '/admin' : '/account');
    },
  },
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && dialog.open) closeSignIn();
});

// #/login: the landing page with the dialog open on the asked-for tab.
export const loginRoute = {
  title: 'Sign in',
  guard() {
    const asCustomer = queryParam('as') === 'customer';
    if (!asCustomer && isSignedIn()) return '/admin';
    if (asCustomer && isGuestSignedIn()) return '/account';
    return null;
  },
  render() {
    if (openedForHash !== location.hash) {
      openedForHash = location.hash;
      Object.assign(dialog, { open: true, tab: queryParam('as') === 'customer' ? 'customer' : 'staff', email: '', password: '', field: null, error: '' });
    }
    return landing.render();
  },
};

// Leaving #/login by any route closes the dialog; coming back opens it again.
window.addEventListener('hashchange', () => {
  if (currentPath() !== '/login') openedForHash = null;
});
