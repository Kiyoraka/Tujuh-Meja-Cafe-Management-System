// Boot: register routes, then start the router.

import { addRoute, startRouter } from './router.js';
import { html } from './ui.js';
import { publicPage } from './views/layout.js';

// Temporary landing until the customer pages land (Phase 3).
const comingSoon = {
  render: () => publicPage(html`
    <section class="container page">
      <p class="eyebrow">Opening soon</p>
      <h1>Seven tables.<br>One good seat waiting.</h1>
    </section>`),
};

addRoute('/', comingSoon);

startRouter(document.getElementById('app'));
