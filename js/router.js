// Hash router. Each view module exports:
//   render(params)  -> html`` markup for the page
//   actions         -> { name(el, event) } run for clicks on [data-action="name"]
//   submits         -> { name(form, event) } run for <form data-submit="name">
//   inputs          -> { name(el, event) } run for input/change on [data-input="name"]
//   guard           -> optional () => redirect hash (or null) checked before render
//   title           -> optional page title suffix
// State changes call refresh(); it skips while the user is typing or a modal is open,
// so a background tick never wipes a half-filled form.

import { html } from './ui.js';

const routes = [];
let current = null;
let root = null;

export function addRoute(pattern, view) {
  const keys = [];
  const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  }) + '/?$');
  routes.push({ regex, keys, view });
}

function match(path) {
  for (const route of routes) {
    const found = path.match(route.regex);
    if (found) {
      const params = {};
      route.keys.forEach((key, i) => { params[key] = decodeURIComponent(found[i + 1]); });
      return { view: route.view, params };
    }
  }
  return null;
}

export function currentPath() {
  return (location.hash.replace(/^#/, '') || '/').split('?')[0];
}

export function navigate(path) {
  if (currentPath() === path) render();
  else location.hash = path;
}

const notFound = {
  render: () => html`
    <main class="container not-found">
      <div class="big7">7</div>
      <h2>That table does not exist.</h2>
      <p class="muted">The page you asked for is not on our floor.</p>
      <a class="btn btn-primary" href="#/">Back to the cafe</a>
    </main>`,
};

function render() {
  const found = match(currentPath()) || { view: notFound, params: {} };
  const redirect = found.view.guard?.(found.params);
  if (redirect) { navigate(redirect); return; }

  const changedPage = !current || current.view !== found.view || currentPath() !== current.path;
  current = { ...found, path: currentPath() };
  root.innerHTML = found.view.render(found.params).toString();
  document.title = found.view.title ? `${found.view.title} · Tujuh Meja Cafe` : 'Tujuh Meja Cafe — Reservations & Waitlist';
  if (changedPage) window.scrollTo(0, 0);
  found.view.mounted?.(root, found.params);
}

function isBusy() {
  const active = document.activeElement;
  const typing = active && root.contains(active) && active.matches('input, textarea, select');
  return typing || root.querySelector('.modal-backdrop') !== null;
}

// Re-render the current page after a state change.
export function refresh({ force = false } = {}) {
  if (!current) return;
  if (!force && isBusy()) return;
  render();
}

export function startRouter(mountEl) {
  root = mountEl;

  root.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el || !root.contains(el)) return;
    const handler = current?.view.actions?.[el.dataset.action];
    if (handler) { event.preventDefault(); handler(el, event); }
  });

  root.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-submit]');
    if (!form) return;
    event.preventDefault();
    current?.view.submits?.[form.dataset.submit]?.(form, event);
  });

  const onInput = (event) => {
    const el = event.target.closest('[data-input]');
    if (!el) return;
    current?.view.inputs?.[el.dataset.input]?.(el, event);
  };
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);

  window.addEventListener('hashchange', render);
  render();
}
