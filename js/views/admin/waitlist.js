// Admin waitlist (#/admin/waitlist): the walk-in queue with Seat next, Notify
// (a mock text) and Remove, plus the parties already seated today.

import { html, formatTime, minutesBetween, pluralize, toast } from '../../ui.js';
import { STATE, seatNext, notifyQueue, removeFromQueue, findTablesFor, avgWait, queueWait } from '../../state.js';
import { adminPage, defineAdmin } from './layout.js';

function queueRow(q, index) {
  const fits = Boolean(findTablesFor(q.party));
  return html`
    <div class="list-row queue-row">
      <span class="num">#${q.no}</span>
      <span class="grow">
        <b>${q.name}</b> <span class="muted">· party of ${q.party}</span><br>
        <span class="small muted">
          joined ${formatTime(q.joinedAt)} · waiting ${minutesBetween(q.joinedAt)} min${q.phone ? ` · ${q.phone}` : ''}
          ${q.notifiedAt ? html` · <b class="notified">texted ${formatTime(q.notifiedAt)}</b>` : ''}
        </span>
      </span>
      <span class="badge ${fits ? 'badge-done' : ''}">${fits ? 'table free' : index === 0 ? 'next up' : 'waiting'}</span>
      <span class="row-actions">
        <button class="btn btn-ghost btn-sm" data-action="notify" data-no="${q.no}" ${q.phone ? '' : html`disabled title="No phone number"`}>Notify</button>
        <button class="btn btn-danger btn-sm" data-action="remove" data-no="${q.no}">Remove</button>
      </span>
    </div>`;
}

export const waitlistPage = defineAdmin({
  title: 'Waitlist',
  render() {
    const served = [...STATE.served].reverse().slice(0, 6);
    return adminPage({
      title: 'Waitlist',
      subtitle: STATE.queue.length ? `${pluralize(STATE.queue.length, 'party', 'parties')} waiting · about ${queueWait()} min for the last` : 'No one waiting',
      actions: html`<button class="btn btn-primary btn-sm" data-action="seat-next" ${STATE.queue.length ? '' : 'disabled'}>Seat next</button>`,
      content: html`
        <div class="grid-2">
          <section class="panel">
            <div class="panel-head">
              <h2>In the queue</h2>
              <span class="small muted">Seat next skips any party no free table can hold yet.</span>
            </div>
            ${STATE.queue.length
              ? html`<div class="list">${STATE.queue.map(queueRow)}</div>`
              : html`<div class="empty"><p><b>The queue is empty.</b></p><p class="small">Walk-ins who scan the QR code at the door appear here.</p></div>`}
          </section>
          <section class="panel">
            <div class="panel-head">
              <h2>Seated from the queue</h2>
              <span class="small muted">average wait ${avgWait()} min</span>
            </div>
            <div class="list">
              ${served.map((s) => html`
                <div class="list-row">
                  <span class="num">#${s.no}</span>
                  <span class="grow"><b>${s.name}</b> <span class="muted">· ${s.party} at ${s.tableName}</span></span>
                  <span class="small muted">waited ${s.waited} min</span>
                </div>`)}
            </div>
          </section>
        </div>`,
    });
  },
  actions: {
    'seat-next'() {
      const result = seatNext();
      toast(result.ok ? `#${result.entry.no} ${result.entry.name} seated at ${result.tables}.` : result.reason);
    },
    notify(el) {
      const result = notifyQueue(Number(el.dataset.no));
      toast(result.ok ? `Text sent to ${result.entry.name}: "Your table at Tujuh Meja is ready." (demo)` : result.reason);
    },
    remove(el) {
      const no = Number(el.dataset.no);
      removeFromQueue(no);
      toast(`#${no} removed from the queue.`);
    },
  },
});
