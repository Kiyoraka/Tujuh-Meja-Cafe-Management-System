// Admin floor (#/admin/floor): every table by zone in its status colour. Tap a
// table to select it; the side panel moves it along free -> reserved -> seated ->
// cleaning, or straight to any status.

import { html, minutesBetween, toast } from '../../ui.js';
import { STATE, tableById, setTableStatus, zones, freeTables, tablesInUse } from '../../state.js';
import { refresh } from '../../router.js';
import { adminPage, defineAdmin } from './layout.js';

const STATUSES = ['free', 'reserved', 'seated', 'cleaning'];
const NEXT = { free: 'reserved', reserved: 'seated', seated: 'cleaning', cleaning: 'free' };
const NEXT_LABEL = { reserved: 'Mark reserved', seated: 'Seat guests', cleaning: 'Clear table', free: 'Ready — mark free' };

let selectedId = null;

function tableCard(t) {
  const mate = t.linkedTo ? tableById(t.linkedTo) : null;
  return html`
    <button type="button" class="floor-table ${t.status} ${t.seats > 2 ? 'wide' : ''} ${t.id === selectedId ? 'selected' : ''}"
      data-action="select" data-id="${t.id}" aria-pressed="${t.id === selectedId}"
      aria-label="${t.name}, ${t.seats} seats, ${t.status}">
      <span class="floor-table-name">${t.name}</span>
      <span class="status status-${t.status}"><span class="dot"></span>${t.status}</span>
      <span class="floor-table-meta">${t.guest ? `${t.guest} · ${t.party}` : `${t.seats} seats`}</span>
      ${t.status !== 'free' ? html`<span class="floor-table-time">${minutesBetween(t.statusSince)} min</span>` : ''}
      ${mate ? html`<span class="floor-join">+ ${mate.name}</span>` : ''}
    </button>`;
}

function sidePanel() {
  const t = selectedId ? tableById(selectedId) : null;
  if (!t) {
    return html`<aside class="panel floor-side"><p class="muted" style="margin:0">Tap a table to see who is there and move it along.</p>${legend()}</aside>`;
  }
  const next = NEXT[t.status];
  const mate = t.linkedTo ? tableById(t.linkedTo) : null;
  return html`
    <aside class="panel floor-side">
      <p class="eyebrow">Selected</p>
      <h2 style="margin:0">${t.name} <span class="muted small">· ${t.zone} · ${t.seats} seats</span></h2>
      <span><span class="status status-${t.status}"><span class="dot"></span>${t.status}</span> <span class="small muted">for ${minutesBetween(t.statusSince)} min</span></span>
      ${t.guest ? html`<p style="margin:0"><b>${t.guest}</b> · party of ${t.party}${mate ? html` · joined with ${mate.name}` : ''}</p>` : ''}
      <button class="btn btn-primary btn-block" data-action="advance">${NEXT_LABEL[next]}</button>
      <div class="status-grid" role="group" aria-label="Set status">
        ${STATUSES.map((s) => html`
          <button type="button" class="chip ${s === t.status ? 'active' : ''}" data-action="set" data-status="${s}" ${s === t.status ? 'disabled' : ''}>
            <span class="dot ${s}"></span>${s}
          </button>`)}
      </div>
      ${legend()}
    </aside>`;
}

function legend() {
  return html`
    <div class="floor-legend">
      ${STATUSES.map((s) => html`<span class="status status-${s}"><span class="dot"></span>${s}</span>`)}
    </div>`;
}

function change(status) {
  const t = tableById(selectedId);
  if (!t) return;
  const result = setTableStatus(t.id, status);
  toast(result.ok ? `${t.name} is now ${status}.` : result.reason);
}

export const floorPage = defineAdmin({
  title: 'Floor',
  render() {
    if (selectedId && !tableById(selectedId)) selectedId = null;
    const byZone = zones()
      .map((zone) => ({ zone, tables: STATE.tables.filter((t) => t.zone === zone) }))
      .filter((z) => z.tables.length);
    return adminPage({
      title: 'Floor',
      subtitle: `${tablesInUse()} seated · ${freeTables()} free · ${STATE.tables.length} tables`,
      actions: html`<a class="btn btn-ghost btn-sm" href="#/admin/tables">Edit tables</a>`,
      content: html`
        <div class="floor-wrap">
          <section class="panel floor-plan" aria-label="Floor plan">
            ${byZone.map((z) => html`
              <div class="floor-zone">
                <h3 class="floor-zone-name">${z.zone}</h3>
                <div class="floor-row">${z.tables.map(tableCard)}</div>
              </div>`)}
          </section>
          ${sidePanel()}
        </div>`,
    });
  },
  actions: {
    select(el) {
      selectedId = el.dataset.id;
      refresh({ force: true });
      // On phones the panel sits under the plan; bring it into view.
      if (window.matchMedia('(max-width: 900px)').matches) {
        document.querySelector('.floor-side')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    advance() {
      const t = tableById(selectedId);
      if (t) change(NEXT[t.status]);
    },
    set(el) { change(el.dataset.status); },
  },
});
