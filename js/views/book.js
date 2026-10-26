// Booking form (#/book) and its confirmation card (#/book/done).

import { html, formatTime, formatDate, toast } from '../ui.js';
import { STATE, openSlots, maxParty, book, bookingById, guestProfile } from '../state.js';
import { currentGuest } from '../auth.js';
import { navigate, queryParam, refresh } from '../router.js';
import { publicPage } from './layout.js';

// The half-filled form lives here so a background re-render never loses it.
const draft = { day: 0, slot: null, party: 2, name: '', phone: '', note: '', errors: {} };
let appliedHash = null;

function applyQuery() {
  if (appliedHash === location.hash) return;
  appliedHash = location.hash;
  const day = queryParam('day');
  const slot = queryParam('slot');
  if (day !== null) draft.day = day === '1' ? 1 : 0;
  if (slot) draft.slot = Number(slot);
  if (!openSlots(0).some((s) => !s.full)) draft.day = 1;
}

// A signed-in customer gets their name and phone filled in once per sign-in.
let prefilledFor = null;
function prefillForGuest() {
  const email = currentGuest();
  if (!email || prefilledFor === email) return;
  prefilledFor = email;
  const profile = guestProfile(email);
  if (!draft.name) draft.name = profile.name;
  if (!draft.phone) draft.phone = profile.phone;
}

function slotsFor(day) {
  return openSlots(day);
}

function slotChips() {
  const slots = slotsFor(draft.day);
  if (!slots.length) return html`<p class="muted">No times left today. Try tomorrow.</p>`;
  return html`
    <div class="chips" role="group" aria-label="Time">
      ${slots.map((s) => html`
        <button type="button" class="chip" data-action="slot" data-slot="${s.time.getTime()}"
          aria-pressed="${draft.slot === s.time.getTime()}" ${s.full ? html`disabled title="Fully booked"` : ''}>${formatTime(s.time)}</button>`)}
    </div>`;
}

const error = (field) => (draft.errors[field] ? html`<span class="field-error">${draft.errors[field]}</span>` : '');

function validate() {
  const errors = {};
  if (!draft.slot) errors.slot = 'Pick a time.';
  if (draft.name.trim().length < 2) errors.name = 'Tell us the name for the booking.';
  if (draft.phone.replace(/\D/g, '').length < 9) errors.phone = 'A phone number we can text, e.g. 012-345 6789.';
  draft.errors = errors;
  return Object.keys(errors).length === 0;
}

const today = new Date();
const tomorrow = new Date(Date.now() + 86400000);

export const bookPage = {
  title: 'Book a table',
  render() {
    applyQuery();
    prefillForGuest();
    const max = maxParty();
    if (draft.party > max) draft.party = max;
    return publicPage(html`
      <section class="banner">
        <img src="assets/images/table-window.webp" width="1200" height="800" alt="A window table set with kopi and kuih">
        <div class="container"><h1>Book a table</h1></div>
      </section>
      <section class="container page">
        <div class="form-wrap">
          <form class="card card-raised form-card" data-submit="book" novalidate>
            <div class="field">
              <span class="label">Day</span>
              <div class="chips" role="group" aria-label="Day">
                <button type="button" class="chip" data-action="day" data-day="0" aria-pressed="${draft.day === 0}">Today · ${formatDate(today)}</button>
                <button type="button" class="chip" data-action="day" data-day="1" aria-pressed="${draft.day === 1}">Tomorrow · ${formatDate(tomorrow)}</button>
              </div>
            </div>
            <div class="field">
              <span class="label">Time</span>
              ${slotChips()}
              ${error('slot')}
            </div>
            <div class="field">
              <span class="label">Party size</span>
              <div class="row">
                <div class="stepper">
                  <button type="button" data-action="party" data-step="-1" aria-label="Fewer guests" ${draft.party <= 1 ? 'disabled' : ''}>−</button>
                  <output aria-live="polite">${draft.party}</output>
                  <button type="button" data-action="party" data-step="1" aria-label="More guests" ${draft.party >= max ? 'disabled' : ''}>+</button>
                </div>
                <span class="hint">Up to ${max}. Parties of 5 or more sit at joined tables.</span>
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="b-name">Name</label>
                <input id="b-name" class="input ${draft.errors.name ? 'invalid' : ''}" data-input="name" value="${draft.name}" autocomplete="name" placeholder="Your name">
                ${error('name')}
              </div>
              <div class="field">
                <label for="b-phone">Phone</label>
                <input id="b-phone" class="input ${draft.errors.phone ? 'invalid' : ''}" data-input="phone" value="${draft.phone}" inputmode="tel" autocomplete="tel" placeholder="012-345 6789">
                ${error('phone')}
              </div>
            </div>
            <div class="field">
              <label for="b-note">Note <span class="muted">(optional)</span></label>
              <textarea id="b-note" class="textarea" data-input="note" placeholder="Birthday, high chair, window seat…">${draft.note}</textarea>
            </div>
            <div class="deposit-line">
              <span aria-hidden="true">●</span>
              <span><b>RM${STATE.settings.deposit} deposit</b>, returned when you are seated. It only keeps a table from going empty. (Demo: nothing is charged.)</span>
            </div>
            <button class="btn btn-primary btn-block" type="submit">Confirm booking</button>
          </form>
          <aside class="card aside-card">
            <h3>Good to know</h3>
            <ul>
              <li>We hold your table for 15 minutes after your time.</li>
              <li>Running late? Your booking text has a link to tell us.</li>
              <li>Cancel any time before your slot and the deposit comes back.</li>
              <li>Walking in instead? <a href="#/queue">Join the queue</a>.</li>
            </ul>
          </aside>
        </div>
      </section>`);
  },
  actions: {
    day(el) {
      draft.day = Number(el.dataset.day);
      draft.slot = null;
      refresh({ force: true });
    },
    slot(el) {
      draft.slot = Number(el.dataset.slot);
      delete draft.errors.slot;
      refresh({ force: true });
    },
    party(el) {
      draft.party = Math.min(maxParty(), Math.max(1, draft.party + Number(el.dataset.step)));
      refresh({ force: true });
    },
  },
  inputs: {
    name(el) { draft.name = el.value; },
    phone(el) { draft.phone = el.value; },
    note(el) { draft.note = el.value; },
  },
  submits: {
    book() {
      if (!validate()) { refresh({ force: true }); toast('Almost there — check the highlighted fields.'); return; }
      book({ name: draft.name, phone: draft.phone, party: draft.party, time: new Date(draft.slot), note: draft.note, guestEmail: currentGuest() });
      Object.assign(draft, { slot: null, name: '', phone: '', note: '', party: 2, errors: {} });
      prefilledFor = null;
      navigate('/book/done');
    },
  },
};

export const bookDone = {
  title: 'Booked',
  render() {
    const booking = STATE.lastBookingId ? bookingById(STATE.lastBookingId) : null;
    if (!booking) {
      return publicPage(html`
        <section class="container confirm">
          <h2>No booking yet</h2>
          <p class="muted">Pick a time and we will hold a table for you.</p>
          <a class="btn btn-primary" href="#/book">Book a table</a>
        </section>`);
    }
    return publicPage(html`
      <section class="container confirm">
        <div class="tick" aria-hidden="true">✓</div>
        <h1>You're booked</h1>
        <p class="muted">We sent the details to ${booking.phone} (demo — no text is really sent).</p>
        <div class="ticket">
          <span class="ref">${booking.ref}</span>
          <span><b>${formatDate(booking.time)} · ${formatTime(booking.time)}</b></span>
          <span>Party of ${booking.party} · ${booking.name}</span>
          ${booking.note ? html`<span class="muted">“${booking.note}”</span>` : ''}
          <span class="small">RM${STATE.settings.deposit} deposit held — returned when you are seated.</span>
        </div>
        <div class="row" style="justify-content:center">
          <button class="btn btn-ghost" data-action="calendar">Add to calendar</button>
          <a class="btn btn-primary" href="#/">Back to the cafe</a>
        </div>
      </section>`);
  },
  actions: {
    calendar() { toast('Added to your calendar (demo).'); },
  },
};
