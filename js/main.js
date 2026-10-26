// Boot: register routes, re-render on every state change, then start the router.

import { addRoute, startRouter, refresh } from './router.js';
import { subscribe } from './state.js';
import { startSim } from './sim.js';
import { landing } from './views/landing.js';
import { bookPage, bookDone } from './views/book.js';
import { queuePage, queueStatusPage } from './views/queue.js';
import { loginRoute } from './views/signin.js';
import { dashboardPage } from './views/admin/dashboard.js';
import { floorPage } from './views/admin/floor.js';
import { bookingsPage } from './views/admin/bookings.js';
import { waitlistPage } from './views/admin/waitlist.js';
import { tablesPage } from './views/admin/tables.js';
import { settingsPage } from './views/admin/settings.js';

addRoute('/', landing);
addRoute('/book', bookPage);
addRoute('/book/done', bookDone);
addRoute('/queue', queuePage);
addRoute('/queue/me', queueStatusPage);
addRoute('/login', loginRoute);
addRoute('/admin', dashboardPage);
addRoute('/admin/floor', floorPage);
addRoute('/admin/bookings', bookingsPage);
addRoute('/admin/waitlist', waitlistPage);
addRoute('/admin/tables', tablesPage);
addRoute('/admin/settings', settingsPage);

subscribe(() => refresh());
startRouter(document.getElementById('app'));
startSim();
