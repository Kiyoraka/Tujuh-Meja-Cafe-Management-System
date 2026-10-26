// Admin dashboard (#/admin): today's KPIs, covers by hour, the last seven days,
// the live queue and the next arrivals.

import { html, formatTime, minutesBetween, pluralize, toast } from '../../ui.js';
import {
  STATE, covers, bookingsToday, noShows, noShowRate, avgWait, tablesInUse,
  coversByHour, lastSevenDays, upcomingBookings, seatNext, seatBooking,
} from '../../state.js';
import { adminPage, defineAdmin } from './layout.js';

function hourLabel(hour) {
  const h = hour % 12 || 12;
  return `${h}${hour < 12 ? 'am' : 'pm'}`;
}

function kpis() {
  const total = STATE.tables.length;
  return html`
    <section class="kpis" aria-label="Today in numbers">
      <div class="kpi"><span>Covers today</span><b>${covers()}</b><small>guests seated so far</small></div>
      <div class="kpi"><span>Bookings</span><b>${bookingsToday()}</b><small>${upcomingBookings().length} still to arrive</small></div>
      <div class="kpi"><span>No-shows</span><b>${noShows()}</b><small>${noShowRate()}% of settled bookings</small></div>
      <div class="kpi"><span>Average wait</span><b>${avgWait()}<span class="kpi-unit"> min</span></b><small>for walk-ins today</small></div>
      <div class="kpi accent"><span>Tables in use</span><b>${tablesInUse()} / ${total}</b><small>${STATE.queue.length ? `${pluralize(STATE.queue.length, 'party', 'parties')} waiting` : 'no one waiting'}</small></div>
    </section>`;
}

// Vertical bars with a few recessive gridlines; the peak is the only direct label.
function barChart({ rows, label, valueOf, tipOf, classOf, axisOf, caption, dense = false }) {
  const max = Math.max(...rows.map(valueOf), 1);
  const top = Math.ceil(max / 10) * 10;
  const peak = rows.reduce((best, r) => (valueOf(r) > valueOf(best) ? r : best), rows[0]);
  return html`
    <figure class="chart" aria-label="${label}">
      <div class="chart-plot">
        <div class="chart-grid" aria-hidden="true">
          ${[top, top / 2, 0].map((v) => html`<span><em>${Math.round(v)}</em></span>`)}
        </div>
        <div class="chart-bars">
          ${rows.map((r) => html`
            <div class="chart-col" tabindex="0" data-tip="${tipOf(r)}">
              <div class="chart-bar ${classOf(r)}" style="height:${(valueOf(r) / top) * 100}%">
                ${r === peak ? html`<span class="chart-value">${valueOf(r)}</span>` : ''}
              </div>
            </div>`)}
        </div>
      </div>
      <div class="chart-axis ${dense ? 'dense' : ''}" aria-hidden="true">${rows.map((r) => html`<span>${axisOf(r)}</span>`)}</div>
      ${caption}
      <div class="sr-only">
        <table>
          <caption>${label}</caption>
          <tbody>${rows.map((r) => html`<tr><th scope="row">${axisOf(r)}</th><td>${tipOf(r)}</td></tr>`)}</tbody>
        </table>
      </div>
    </figure>`;
}

function hourlyPanel() {
  const rows = coversByHour();
  return html`
    <section class="panel">
      <div class="panel-head">
        <h2>Covers by hour</h2>
        <div class="legend">
          <span><i class="swatch"></i>Today</span>
          <span><i class="swatch forecast"></i>Forecast</span>
        </div>
      </div>
      ${barChart({
        rows,
        label: 'Covers by hour, today and forecast',
        valueOf: (r) => r.covers,
        tipOf: (r) => `${hourLabel(r.hour)} · ${r.covers} covers${r.forecast ? ' (forecast)' : ''}`,
        classOf: (r) => (r.forecast ? 'forecast' : ''),
        axisOf: (r) => hourLabel(r.hour),
        caption: '',
        dense: true,
      })}
    </section>`;
}

function weekPanel() {
  const days = lastSevenDays();
  return html`
    <section class="panel">
      <div class="panel-head">
        <h2>Last 7 days</h2>
        <span class="small muted">covers per day</span>
      </div>
      ${barChart({
        rows: days,
        label: 'Covers per day, last seven days',
        valueOf: (d) => d.covers,
        tipOf: (d) => `${d.today ? 'Today' : d.date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.covers} covers · ${pluralize(d.noShows, 'no-show')}`,
        classOf: (d) => (d.today ? 'today' : ''),
        axisOf: (d) => (d.today ? 'Today' : d.date.toLocaleDateString('en-MY', { weekday: 'short' })),
        caption: html`<figcaption class="small muted">Today so far: <b>${covers()}</b> covers and ${pluralize(noShows(), 'no-show')}. Hover a day for its numbers.</figcaption>`,
      })}
    </section>`;
}

function queuePanel() {
  return html`
    <section class="panel">
      <div class="panel-head">
        <h2>Live queue <span class="muted">(${STATE.queue.length})</span></h2>
        <button class="btn btn-primary btn-sm" data-action="seat-next" ${STATE.queue.length ? '' : 'disabled'}>Seat next</button>
      </div>
      ${STATE.queue.length ? html`
        <div class="list">
          ${STATE.queue.slice(0, 5).map((q) => html`
            <div class="list-row">
              <span class="num">#${q.no}</span>
              <span class="grow"><b>${q.name}</b> <span class="muted">· party of ${q.party}</span></span>
              <span class="small muted">${minutesBetween(q.joinedAt)} min</span>
            </div>`)}
          ${STATE.queue.length > 5 ? html`<a class="small" href="#/admin/waitlist">and ${STATE.queue.length - 5} more →</a>` : ''}
        </div>` : html`<p class="empty">No one is waiting. A quiet moment.</p>`}
    </section>`;
}

function arrivalsPanel() {
  const next = upcomingBookings().slice(0, 5);
  return html`
    <section class="panel">
      <div class="panel-head">
        <h2>Next arrivals</h2>
        <a class="small" href="#/admin/bookings">All reservations →</a>
      </div>
      ${next.length ? html`
        <div class="list">
          ${next.map((b) => html`
            <div class="list-row">
              <span class="num">${formatTime(b.time)}</span>
              <span class="grow"><b>${b.name}</b> <span class="muted">· ${b.party} pax</span>${b.note ? html`<br><span class="small muted">${b.note}</span>` : ''}</span>
              <button class="btn btn-ghost btn-sm" data-action="seat-booking" data-id="${b.id}">Seat</button>
            </div>`)}
        </div>` : html`<p class="empty">No more bookings today.</p>`}
    </section>`;
}

export const dashboardPage = defineAdmin({
  title: 'Dashboard',
  render: () => adminPage({
    title: 'Today at Tujuh Meja',
    content: html`
      ${kpis()}
      <div class="grid-2">${hourlyPanel()}${queuePanel()}</div>
      <div class="grid-2">${weekPanel()}${arrivalsPanel()}</div>`,
  }),
  actions: {
    'seat-next'() {
      const result = seatNext();
      toast(result.ok ? `#${result.entry.no} ${result.entry.name} seated at ${result.tables}.` : result.reason);
    },
    'seat-booking'(el) {
      const result = seatBooking(el.dataset.id);
      toast(result.ok ? `Seated at ${result.tables}.` : result.reason);
    },
  },
});
