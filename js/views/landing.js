// Landing: hero, live floor numbers, open slots, how it works, and the QR door.

import { html, formatTime, pluralize } from '../ui.js';
import { STATE, tablesTaken, queueWait, openSlots, freeTables } from '../state.js';
import { publicPage } from './layout.js';

function liveStrip() {
  const total = STATE.tables.length;
  const queued = STATE.queue.length;
  const next = openSlots(0).find((s) => !s.full) || openSlots(1).find((s) => !s.full);
  return html`
    <div class="live-strip" aria-label="Right now at the cafe">
      <div class="live-pill"><b>${tablesTaken()} of ${total}</b><span>tables taken right now</span></div>
      <div class="live-pill"><b>${queued ? `~${queueWait()} min` : 'No wait'}</b><span>${queued ? `${pluralize(queued, 'party', 'parties')} in the queue` : 'walk straight in'}</span></div>
      <div class="live-pill"><b>${next ? formatTime(next.time) : '—'}</b><span>next table you can book</span></div>
    </div>`;
}

function slotChips() {
  let day = 0;
  let slots = openSlots(0).filter((s) => !s.full);
  if (!slots.length) { day = 1; slots = openSlots(1).filter((s) => !s.full); }
  return html`
    <div class="section-head spread">
      <div>
        <h2>Open ${day === 0 ? 'today' : 'tomorrow'}</h2>
        <p>Tap a time to book it. Tables are held for 15 minutes.</p>
      </div>
      <a class="btn btn-ghost btn-sm" href="#/book">See every time</a>
    </div>
    <div class="chips">
      ${slots.slice(0, 8).map((s) => html`<a class="chip" href="#/book?day=${day}&slot=${s.time.getTime()}">${formatTime(s.time)}</a>`)}
    </div>`;
}

function floorStrip() {
  return html`
    <div class="section-head">
      <h2>The floor, live</h2>
      <p>${freeTables()} free · every table is one of these four colours.</p>
    </div>
    <div class="floor-strip">
      ${STATE.tables.map((t) => html`
        <div class="mini-table ${t.status}">
          <b>${t.name}</b>
          <span class="status status-${t.status}"><span class="dot"></span>${t.status}</span>
          <span class="small muted">${t.seats} seats</span>
        </div>`)}
    </div>`;
}

export const landing = {
  render: () => publicPage(html`
    <section class="hero">
      <div class="container">
        <div class="hero-copy">
          <p class="eyebrow">Kopitiam corner · Kota Contoh</p>
          <h1>Seven tables.<br>One good seat waiting.</h1>
          <p class="lead">Book a table ahead, or scan at the door and we will text you when your seat is ready. No standing around.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#/book">Book a table</a>
            <a class="btn btn-accent" href="#/queue">Join the queue</a>
          </div>
          ${liveStrip()}
        </div>
        <div class="hero-figure">
          <img src="assets/images/hero-cafe.webp" width="1536" height="1024" alt="Inside Tujuh Meja Cafe: marble tables, rattan chairs, teal walls and marigold lamps in afternoon light">
          <div class="hero-badge"><div><b>7</b><span>tables</span></div></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">${slotChips()}</div>
    </section>

    <section class="section band">
      <div class="container">${floorStrip()}</div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head"><h2>How a seat finds you</h2></div>
        <div class="steps">
          <div class="step"><span class="step-no">1</span><h3>Book or queue</h3><p>Pick a time online, or scan the QR code at the door if you are already here.</p></div>
          <div class="step"><span class="step-no">2</span><h3>Wait anywhere</h3><p>Your place in line counts down on your phone. Grab a kuih at the counter or take a walk.</p></div>
          <div class="step"><span class="step-no">3</span><h3>We call you in</h3><p>The moment a table fits your party, it is yours. Your RM${STATE.settings.deposit} deposit comes back at seating.</p></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="card qr-card">
          <img class="photo" src="assets/images/queue-door.webp" width="1200" height="800" loading="lazy" alt="The cafe door with a QR code stand and a waiting rope">
          <div class="qr-side">
            <p class="eyebrow">At the door</p>
            <h2>Scan to join the queue</h2>
            <p class="muted">Point your phone camera at the code. You get a number and a live countdown.</p>
            <img class="qr-code" src="assets/qr-queue.svg" width="148" height="148" alt="QR code that opens the walk-in queue">
            <a href="#/queue">Or join the queue here →</a>
          </div>
        </div>
      </div>
    </section>`),
};
