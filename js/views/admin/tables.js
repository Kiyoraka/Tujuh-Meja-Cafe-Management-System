// Admin tables (#/admin/tables): the owner adds, edits and removes tables. Every
// other page reads the same table list, so a new table shows up everywhere.

import { html, toast } from '../../ui.js';
import {
  STATE, tableById, addTable, updateTable, removeTable, removeBlockedReason,
  nextTableName, zones, maxParty,
} from '../../state.js';
import { refresh } from '../../router.js';
import { adminPage, defineAdmin } from './layout.js';

const NEW_ZONE = '__new';
let modal = null; // { mode, id, name, zone, newZone, seats, joinWith, error }

function openModal(mode, table = null) {
  modal = table
    ? { mode, id: table.id, name: table.name, zone: table.zone, newZone: '', seats: table.seats, joinWith: table.joinWith || '', error: '' }
    : { mode, id: null, name: nextTableName(), zone: zones()[0], newZone: '', seats: 4, joinWith: '', error: '' };
  refresh({ force: true });
}

function closeModal() {
  modal = null;
  refresh({ force: true });
}

// Tables this one may pair with: any other table not already paired elsewhere.
function pairOptions() {
  return STATE.tables.filter((t) => t.id !== modal.id && (!t.joinWith || t.joinWith === modal.id));
}

function tableRow(t) {
  const blocked = removeBlockedReason(t);
  const mate = t.joinWith ? tableById(t.joinWith) : null;
  return html`
    <tr>
      <td data-label="Table"><b class="table-name">${t.name}</b></td>
      <td data-label="Zone">${t.zone}</td>
      <td data-label="Seats">${t.seats}</td>
      <td data-label="Joins">${mate ? html`with ${mate.name} <span class="muted small">(${t.seats + mate.seats} seats)</span>` : html`<span class="muted">—</span>`}</td>
      <td data-label="Status"><span class="status status-${t.status}"><span class="dot"></span>${t.status}</span></td>
      <td class="actions">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${t.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="remove" data-id="${t.id}" ${blocked ? html`disabled title="${blocked}"` : ''}>Remove</button>
        ${blocked ? html`<br><span class="small muted">${blocked}</span>` : ''}
      </td>
    </tr>`;
}

function modalView() {
  if (!modal) return '';
  const zoneList = zones();
  return html`
    <div class="modal-backdrop">
      <button type="button" class="modal-scrim" data-action="close" aria-label="Close"></button>
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="table-modal-title" data-submit="save" novalidate>
        <h2 id="table-modal-title">${modal.mode === 'add' ? 'Add table' : `Edit ${tableById(modal.id)?.name || 'table'}`}</h2>
        <div class="field">
          <label for="t-name">Name</label>
          <input id="t-name" class="input" data-input="name" value="${modal.name}" maxlength="12" autocomplete="off">
        </div>
        <div class="field">
          <label for="t-zone">Zone</label>
          <select id="t-zone" class="select" data-input="zone">
            ${zoneList.map((z) => html`<option value="${z}" ${z === modal.zone ? 'selected' : ''}>${z}</option>`)}
            <option value="${NEW_ZONE}" ${modal.zone === NEW_ZONE ? 'selected' : ''}>+ New zone…</option>
          </select>
          ${modal.zone === NEW_ZONE ? html`<input class="input" data-input="newZone" value="${modal.newZone}" placeholder="e.g. Rooftop" maxlength="20" aria-label="New zone name">` : ''}
        </div>
        <div class="field">
          <span class="label">Seats</span>
          <div class="stepper">
            <button type="button" data-action="seats" data-step="-1" aria-label="Fewer seats" ${modal.seats <= 1 ? 'disabled' : ''}>−</button>
            <output aria-live="polite">${modal.seats}</output>
            <button type="button" data-action="seats" data-step="1" aria-label="More seats" ${modal.seats >= 12 ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="field">
          <label for="t-join">Joins with <span class="muted">(optional, for big parties)</span></label>
          <select id="t-join" class="select" data-input="joinWith">
            <option value="">None</option>
            ${pairOptions().map((t) => html`<option value="${t.id}" ${t.id === modal.joinWith ? 'selected' : ''}>${t.name} · ${t.seats} seats</option>`)}
          </select>
        </div>
        ${modal.error ? html`<p class="field-error" role="alert" style="margin:0">${modal.error}</p>` : ''}
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-action="close">Cancel</button>
          <button type="submit" class="btn btn-primary">${modal.mode === 'add' ? 'Add table' : 'Save changes'}</button>
        </div>
      </form>
    </div>`;
}

let escBound = false;

export const tablesPage = defineAdmin({
  title: 'Tables',
  render() {
    const seats = STATE.tables.reduce((sum, t) => sum + t.seats, 0);
    return adminPage({
      title: 'Tables',
      subtitle: `${STATE.tables.length} tables · ${seats} seats · parties up to ${maxParty()}`,
      actions: html`<button class="btn btn-primary btn-sm" data-action="add">+ Add table</button>`,
      content: html`
        <section class="panel">
          <div class="table-scroll">
            <table class="data-table cards-on-phone">
              <thead><tr><th>Table</th><th>Zone</th><th>Seats</th><th>Joins</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead>
              <tbody>${STATE.tables.map(tableRow)}</tbody>
            </table>
          </div>
        </section>
        <p class="small muted">A table that is seated or reserved cannot be removed. New tables appear on the floor, in seating and in booking capacity straight away.</p>
        ${modalView()}`,
    });
  },
  mounted(root) {
    if (modal) root.querySelector('#t-name')?.focus();
    if (!escBound) {
      escBound = true;
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal) closeModal();
      });
    }
  },
  actions: {
    add() { openModal('add'); },
    edit(el) { openModal('edit', tableById(el.dataset.id)); },
    close() { closeModal(); },
    seats(el) {
      modal.seats = Math.min(12, Math.max(1, modal.seats + Number(el.dataset.step)));
      refresh({ force: true });
    },
    remove(el) {
      const result = removeTable(el.dataset.id);
      toast(result.ok ? `${result.table.name} removed.` : result.reason);
    },
  },
  inputs: {
    name(el) { modal.name = el.value; },
    newZone(el) { modal.newZone = el.value; },
    joinWith(el) { modal.joinWith = el.value; },
    zone(el, event) {
      modal.zone = el.value;
      if (event.type === 'change') refresh({ force: true });
    },
  },
  submits: {
    save() {
      const zone = modal.zone === NEW_ZONE ? modal.newZone.trim() : modal.zone;
      const input = { name: modal.name, zone, seats: modal.seats, joinWith: modal.joinWith || null };
      const result = modal.mode === 'add' ? addTable(input) : updateTable(modal.id, input);
      if (!result.ok) {
        modal.error = result.reason;
        refresh({ force: true });
        return;
      }
      const verb = modal.mode === 'add' ? 'added to' : 'saved in';
      modal = null;
      refresh({ force: true });
      toast(`${result.table.name} ${verb} ${result.table.zone}.`);
    },
  },
});
