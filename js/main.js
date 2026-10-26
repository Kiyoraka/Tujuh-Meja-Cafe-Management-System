// Boot: register routes, re-render on every state change, then start the router.

import { addRoute, startRouter, refresh } from './router.js';
import { subscribe } from './state.js';
import { landing } from './views/landing.js';
import { bookPage, bookDone } from './views/book.js';
import { queuePage, queueStatusPage } from './views/queue.js';
import { loginPage } from './views/login.js';
import { dashboardPage } from './views/admin/dashboard.js';

addRoute('/', landing);
addRoute('/book', bookPage);
addRoute('/book/done', bookDone);
addRoute('/queue', queuePage);
addRoute('/queue/me', queueStatusPage);
addRoute('/login', loginPage);
addRoute('/admin', dashboardPage);

subscribe(() => refresh());
startRouter(document.getElementById('app'));
