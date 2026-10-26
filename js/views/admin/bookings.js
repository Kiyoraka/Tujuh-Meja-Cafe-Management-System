// Admin reservations (#/admin/bookings): today's bookings with filters and
// Seat / No-show / Cancel. On phones each row becomes a card.

import { html, formatTime, formatDate, toast } from '../../ui.js';
import { STATE, seatBooking, markNoShow, cancelBooking, tableById } from '../../state.js';
import { refresh } from '../../router.js';
import { adminPage, defineAdmin } from './layout.js';

const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'upcoming', label: 'Upcoming', match: (b) => b.status === 'upcoming' },
  { key: 'seated', label: 'Seated', match: (b) => b.status === 'seated' },
  { key: 'done', label: 'Done', match: (b) => b.status === 'done' },
  { key: 'noshow', label: 'No-show', match: (b) => b.status === 'noshow' },
  { key: 'cancelled', label: 'Cancelled', match: (b) => b.status === 'cancelled' },
];

const STATUS_LABEL = { upcoming: 'Upcoming', seated: 'Seated', done: 'Done', noshow: 'No-show', cancelled: 'Cancelled' };
const DEPOSIT_LABEL = { held: 'held', returned: 'returned', kept: 'kept', refunded: 'refunded' };

let filter = 'all';

function tableNames(b) {
  return b.tableIds.map((id) => tableById(id)?.name).filter(Boolean).join(' + ');
}

function row(b) {
  const tables = tableNames(b);
  return html`
    <tr class="${b.status === 'cancelled' ? 'dim' : ''}">
      <td data-label="Time" class="nowrap">
        <b>${formatTime(b.time)}</b>
        ${b.time.toDateString() !== new Date().toDateString() ? html`<br><span class="small muted">${formatDate(b.time)}</span>` : ''}
      </td>
      <td data-label="Guest">
        <b>${b.name}</b> <span class="muted small">${b.ref}</span><br>
        <span class="small muted">${b.phone}${b.note ? ` · ${b.note}` : ''}</span>
      </td>
      <td data-label="Pax">${b.party}</td>
      <td data-label="Table">${tables || html`<span class="muted">—</span>`}</td>
      <td data-label="Deposit">RM${STATE.settings.deposit} <span class="small muted">${DEPOSIT_LABEL[b.depositStatus]}</span></td>
      <td data-label="Status"><span class="badge badge-${b.status}">${STATUS_LABEL[b.status]}</span></td>
      <td class="actions">
        ${b.status === 'upcoming' ? html`
          <button class="btn btn-primary btn-sm" data-action="seat" data-id="${b.id}">Seat</button>
          <button class="btn btn-ghost btn-sm" data-action="noshow" data-id="${b.id}">No-show</button>
          <button class="btn btn-danger btn-sm" data-action="cancel" data-id="${b.id}">Cancel</button>` : ''}
      </td>
    </tr>`;
}

export const bookingsPage = defineAdmin({
  title: 'Reservations',
  render() {
    const active = FILTERS.find((f) => f.key === filter);
    const rows = STATE.bookings.filter(active.match).sort((a, b) => a.time - b.time);
    return adminPage({
      title: 'Reservations',
      subtitle: `${STATE.bookings.filter((b) => b.status === 'upcoming').length} still to arrive`,
      actions: html`<a class="btn btn-ghost btn-sm" href="#/book">+ New booking</a>`,
      content: html`
        <div class="chips" role="group" aria-label="Filter reservations">
          ${FILTERS.map((f) => html`
            <button type="button" class="chip" data-action="filter" data-key="${f.key}" aria-pressed="${f.key === filter}">
              ${f.label} <span class="chip-count">${STATE.bookings.filter(f.match).length}</span>
            </button>`)}
        </div>
        <section class="panel">
          ${rows.length ? html`
            <div class="table-scroll">
              <table class="data-table cards-on-phone">
                <thead><tr><th>Time</th><th>Guest</th><th>Pax</th><th>Table</th><th>Deposit</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead>
                <tbody>${rows.map(row)}</tbody>
              </table>
            </div>` : html`<p class="empty">No ${active.label.toLowerCase()} bookings.</p>`}
        </section>`,
    });
  },
  actions: {
    filter(el) {
      filter = el.dataset.key;
      refresh({ force: true });
    },
    seat(el) {
      const result = seatBooking(el.dataset.id);
      toast(result.ok ? `Seated at ${result.tables}. Deposit returned.` : result.reason);
    },
    noshow(el) {
      const result = markNoShow(el.dataset.id);
      toast(result.ok ? 'Marked as a no-show. Deposit kept.' : result.reason);
    },
    cancel(el) {
      const result = cancelBooking(el.dataset.id);
      toast(result.ok ? 'Booking cancelled. Deposit refunded.' : result.reason);
    },
  },
});
