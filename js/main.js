// Boot: register routes, re-render on every state change, then start the router.

import { addRoute, startRouter, refresh } from './router.js';
import { subscribe } from './state.js';
import { landing } from './views/landing.js';

addRoute('/', landing);

subscribe(() => refresh());
startRouter(document.getElementById('app'));
