// Customer "My visits" (#/account): the signed-in guest's place in the queue,
// their bookings (with Cancel) and their earlier visits.

import { html, formatTime, formatDate, pluralize, toast } from '../ui.js';
import { STATE, bookingsFor, pastVisitsFor, seedGuestVisit, guestProfile, cancelBooking, partiesAhead, estimatedWait, servedEntry, tableById } from '../state.js';
import { currentGuest, logoutGuest, requireGuest } from '../auth.js';
import { navigate } from '../router.js';
import { publicPage } from './layout.js';
import { onCustomerSignIn } from './signin.js';

onCustomerSignIn(seedGuestVisit);

const STATUS_LABEL = { upcoming: 'Upcoming', seated: 'Seated now', done: 'Done', noshow: 'Missed', cancelled: 'Cancelled' };
const DEPOSIT_LABEL = { held: 'deposit held', returned: 'deposit returned', kept: 'deposit kept', refunded: 'deposit refunded' };

function queueCard() {
  const no = STATE.myQueueNo;
  if (no === null) return '';
  const ahead = partiesAhead(no);
  if (ahead !== null) {
    return html`
      <section class="card account-queue">
        <p class="eyebrow">In the queue</p>
        <div class="spread">
          <div>
            <h2 style="margin:0">#${no} · ${ahead === 0 ? 'you are next' : `${pluralize(ahead, 'party', 'parties')} ahead`}</h2>
            <p class="muted" style="margin:0">About ${estimatedWait(ahead)} min</p>
          </div>
          <a class="btn btn-primary btn-sm" href="#/queue/me">See your place →</a>
        </div>
      </section>`;
  }
  const served = servedEntry(no);
  return served ? html`
    <section class="ready-banner">
      <h2>Your table is ready</h2>
      <p style="margin:0">Head to <b>${served.tableName}</b>. Enjoy your visit.</p>
    </section>` : '';
}

function bookingCard(b) {
  const tables = b.tableIds.map((id) => tableById(id)?.name).filter(Boolean).join(' + ');
  return html`
    <li class="visit">
      <div class="visit-when"><b>${formatDate(b.time)}</b><span>${formatTime(b.time)}</span></div>
      <div class="visit-what">
        <span>Party of ${b.party} · ${b.ref}${tables ? ` · ${tables}` : ''}</span>
        <span class="small muted"><span class="badge badge-${b.status}">${STATUS_LABEL[b.status]}</span> RM${STATE.settings.deposit} ${DEPOSIT_LABEL[b.depositStatus]}</span>
      </div>
      ${b.status === 'upcoming' ? html`<button class="btn btn-danger btn-sm" data-action="cancel" data-id="${b.id}">Cancel</button>` : ''}
    </li>`;
}

function pastCard(v) {
  return html`
    <li class="visit past">
      <div class="visit-when"><b>${formatDate(v.time)}</b><span>${formatTime(v.time)}</span></div>
      <div class="visit-what">
        <span>Party of ${v.party} · ${v.ref} · ${v.table}</span>
        <span class="small muted"><span class="badge badge-done">Done</span> ${DEPOSIT_LABEL[v.depositStatus]}</span>
      </div>
    </li>`;
}

export const accountPage = {
  title: 'My visits',
  guard: requireGuest,
  render() {
    const email = currentGuest();
    seedGuestVisit(email);
    const bookings = bookingsFor(email);
    const past = pastVisitsFor(email);
    const { name } = guestProfile(email);
    return publicPage(html`
      <section class="container page account">
        <div class="account-head">
          <div>
            <p class="eyebrow">My visits</p>
            <h1>Hi, ${name.split(' ')[0]}</h1>
            <p class="muted" style="margin:0">${email} · <button type="button" class="link-btn" data-action="guest-signout">Sign out</button></p>
          </div>
          <div class="row">
            <a class="btn btn-primary" href="#/book">Book a table</a>
            <a class="btn btn-accent" href="#/queue">Join the queue</a>
          </div>
        </div>

        ${queueCard()}

        <section class="card">
          <h2 class="card-title">Your bookings</h2>
          ${bookings.length
            ? html`<ul class="visits">${bookings.map(bookingCard)}</ul>`
            : html`<p class="empty" style="padding:16px 0">No bookings yet — your first table is one tap away.</p>`}
        </section>

        ${past.length ? html`
          <section class="card">
            <h2 class="card-title">Earlier visits</h2>
            <ul class="visits">${past.map(pastCard)}</ul>
          </section>` : ''}
      </section>`);
  },
  actions: {
    cancel(el) {
      const booking = bookingsFor(currentGuest()).find((b) => b.id === el.dataset.id);
      if (!booking) return;
      const result = cancelBooking(booking.id);
      toast(result.ok ? `${booking.ref} cancelled. Your RM${STATE.settings.deposit} deposit is refunded.` : result.reason);
    },
    'guest-signout'() {
      logoutGuest();
      toast('Signed out.');
      navigate('/');
    },
  },
};
