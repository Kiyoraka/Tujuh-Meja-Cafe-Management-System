// Shared public header and footer for the customer pages.

import { html } from '../ui.js';
import { currentPath } from '../router.js';

const NAV = [
  { href: '#/', label: 'Home' },
  { href: '#/book', label: 'Book a table' },
  { href: '#/queue', label: 'Join the queue' },
];

export function publicHeader() {
  const path = currentPath();
  return html`
    <header class="site-header">
      <div class="container">
        <a class="wordmark" href="#/" aria-label="Tujuh Meja Cafe home">Tujuh Meja<span class="seven">· 7</span></a>
        <nav class="site-nav" aria-label="Main">
          ${NAV.map((item) => html`<a href="${item.href}" class="${path === item.href.slice(1) ? 'active' : ''}">${item.label}</a>`)}
        </nav>
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
          <p>Every day, 10:00 AM – 10:00 PM</p>
        </div>
        <div>
          <h4>Find us</h4>
          <p>12 Jalan Tujuh, Kota Contoh (demo address)</p>
          <p><a href="#/login">Staff sign in →</a></p>
        </div>
      </div>
    </footer>`;
}

export function publicPage(content) {
  return html`${publicHeader()}<main>${content}</main>${publicFooter()}`;
}
