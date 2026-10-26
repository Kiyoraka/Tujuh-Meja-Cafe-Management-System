// Staff sign-in. Any email and any password work; the page says so plainly.

import { html } from '../ui.js';
import { login, isSignedIn, DEMO_LOGIN } from '../auth.js';
import { navigate, refresh } from '../router.js';

const draft = { email: '', password: '', field: null, error: '' };

export const loginPage = {
  title: 'Staff sign in',
  guard: () => (isSignedIn() ? '/admin' : null),
  render: () => html`
    <main class="login-screen">
      <div class="login-card">
        <div class="login-photo">
          <img src="assets/images/login-bg.webp" width="720" height="1080" alt="The cafe counter after closing, lamp light on teal cups">
          <div class="login-photo-caption">
            <a class="wordmark" href="#/">Tujuh Meja<span class="seven">· 7</span></a>
            <p>Your floor, your bookings and your queue, in one place.</p>
          </div>
        </div>
        <form class="login-form" data-submit="login" novalidate>
          <p class="eyebrow">Staff</p>
          <h1>Sign in</h1>
          <div class="field">
            <label for="l-email">Email</label>
            <input id="l-email" class="input ${draft.field === 'email' ? 'invalid' : ''}" type="email" data-input="email" value="${draft.email}" autocomplete="username" placeholder="you@cafe.com">
            ${draft.field === 'email' ? html`<span class="field-error">${draft.error}</span>` : ''}
          </div>
          <div class="field">
            <label for="l-password">Password</label>
            <input id="l-password" class="input ${draft.field === 'password' ? 'invalid' : ''}" type="password" data-input="password" value="${draft.password}" autocomplete="current-password" placeholder="••••••••">
            ${draft.field === 'password' ? html`<span class="field-error">${draft.error}</span>` : ''}
          </div>
          <button class="btn btn-primary btn-block" type="submit">Sign in</button>
          <div class="demo-hint">
            <span><b>Demo:</b> any email and password works.</span>
            <button type="button" class="btn btn-ghost btn-sm" data-action="fill">Fill demo login</button>
          </div>
          <a class="small" href="#/">← Back to the cafe</a>
        </form>
      </div>
    </main>`,
  actions: {
    fill() {
      Object.assign(draft, { ...DEMO_LOGIN, field: null, error: '' });
      refresh({ force: true });
    },
  },
  inputs: {
    email(el) { draft.email = el.value; },
    password(el) { draft.password = el.value; },
  },
  submits: {
    login() {
      const result = login(draft.email, draft.password);
      if (!result.ok) {
        Object.assign(draft, { field: result.field, error: result.reason });
        refresh({ force: true });
        return;
      }
      Object.assign(draft, { email: '', password: '', field: null, error: '' });
      navigate('/admin');
    },
  },
};
