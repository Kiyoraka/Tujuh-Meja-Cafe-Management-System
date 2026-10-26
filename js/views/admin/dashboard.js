// Admin dashboard (#/admin). Filled with KPIs and charts in Task 4.3.

import { html } from '../../ui.js';
import { adminPage, defineAdmin } from './layout.js';

export const dashboardPage = defineAdmin({
  title: 'Dashboard',
  render: () => adminPage({
    title: 'Today at Tujuh Meja',
    content: html`<div class="panel"><p class="muted" style="margin:0">Today's numbers land here.</p></div>`,
  }),
});
