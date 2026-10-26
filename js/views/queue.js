// Walk-in queue: join (#/queue) and the live status a guest watches (#/queue/me).

import { html, formatTime, pluralize, toast } from '../ui.js';
import { STATE, joinQueue, removeFromQueue, partiesAhead, estimatedWait, queueWait, servedEntry, maxParty } from '../state.js';
import { navigate, refresh } from '../router.js';
import { publicPage } from './layout.js';

const draft = { name: '', phone: '', party: 2, error: '' };
let aheadAtJoin = 0;

export const queuePage = {
  title: 'Join the queue',
  render() {
    const max = maxParty();
    if (draft.party > max) draft.party = max;
    const queued = STATE.queue.length;
    const mine = STATE.myQueueNo !== null && partiesAhead(STATE.myQueueNo) !== null;
    return publicPage(html`
      <section class="banner">
        <img src="assets/images/queue-door.webp" width="1200" height="800" alt="The cafe door with the QR code stand">
        <div class="container"><h1>Join the queue</h1></div>
      </section>
      <section class="container page">
        <div class="form-wrap">
          <form class="card card-raised form-card" data-submit="join" novalidate>
            ${mine ? html`<div class="deposit-line"><span aria-hidden="true">●</span><span>You are already in line as <b>#${STATE.myQueueNo}</b>. <a href="#/queue/me">See your place →</a></span></div>` : ''}
            <div>
              <p class="eyebrow">Right now</p>
              <h2 style="margin:0">${queued ? `${pluralize(queued, 'party', 'parties')} ahead · about ${queueWait()} min` : 'No queue — a table is waiting'}</h2>
            </div>
            <div class="field">
              <label for="q-name">Name</label>
              <input id="q-name" class="input ${draft.error ? 'invalid' : ''}" data-input="name" value="${draft.name}" autocomplete="given-name" placeholder="What should we call out?">
              ${draft.error ? html`<span class="field-error">${draft.error}</span>` : ''}
            </div>
            <div class="field">
              <span class="label">Party size</span>
              <div class="stepper">
                <button type="button" data-action="party" data-step="-1" aria-label="Fewer guests" ${draft.party <= 1 ? 'disabled' : ''}>−</button>
                <output aria-live="polite">${draft.party}</output>
                <button type="button" data-action="party" data-step="1" aria-label="More guests" ${draft.party >= max ? 'disabled' : ''}>+</button>
              </div>
            </div>
            <div class="field">
              <label for="q-phone">Phone <span class="muted">(optional, for the text)</span></label>
              <input id="q-phone" class="input" data-input="phone" value="${draft.phone}" inputmode="tel" autocomplete="tel" placeholder="012-345 6789">
            </div>
            <button class="btn btn-primary btn-block" type="submit">Get my number</button>
          </form>
          <aside class="card aside-card">
            <h3>How the queue works</h3>
            <ul>
              <li>You get a number and a live countdown on this phone.</li>
              <li>We text you the moment a table fits your party.</li>
              <li>Stay close — we hold the table for 5 minutes.</li>
              <li>Planning ahead next time? <a href="#/book">Book a table</a>.</li>
            </ul>
          </aside>
        </div>
      </section>`);
  },
  actions: {
    party(el) {
      draft.party = Math.min(maxParty(), Math.max(1, draft.party + Number(el.dataset.step)));
      refresh({ force: true });
    },
  },
  inputs: {
    name(el) { draft.name = el.value; },
    phone(el) { draft.phone = el.value; },
  },
  submits: {
    join() {
      if (draft.name.trim().length < 2) {
        draft.error = 'Tell us a name to call out.';
        refresh({ force: true });
        return;
      }
      aheadAtJoin = STATE.queue.length;
      joinQueue({ name: draft.name, party: draft.party, phone: draft.phone });
      Object.assign(draft, { name: '', phone: '', party: 2, error: '' });
      navigate('/queue/me');
    },
  },
};

function statusCard(no) {
  const ahead = partiesAhead(no);
  const entry = STATE.queue.find((q) => q.no === no);
  const progress = Math.round(((aheadAtJoin - ahead + 1) / (aheadAtJoin + 1)) * 100);
  return html`
    <p class="eyebrow">Your number</p>
    <div class="queue-number">#${no}</div>
    <h2>${ahead === 0 ? 'You are next' : `${pluralize(ahead, 'party', 'parties')} ahead of you`}</h2>
    <p class="muted">About ${estimatedWait(ahead)} min · party of ${entry.party} · joined ${formatTime(entry.joinedAt)}</p>
    <div class="queue-meter" aria-hidden="true"><span style="width:${Math.min(100, Math.max(6, progress))}%"></span></div>
    <p class="small muted">${entry.notifiedAt ? 'We just texted you — your table is almost ready.' : `We'll text you${entry.phone ? ` at ${entry.phone}` : ''} when your table is ready. This page updates on its own.`}</p>
    <button class="btn btn-ghost" data-action="leave">Leave the queue</button>`;
}

export const queueStatusPage = {
  title: 'Your place in line',
  render() {
    const no = STATE.myQueueNo;
    let body;
    if (no === null) {
      body = html`
        <h2>You are not in the queue yet</h2>
        <p class="muted">Get a number and watch your place count down here.</p>
        <a class="btn btn-primary" href="#/queue">Join the queue</a>`;
    } else if (partiesAhead(no) !== null) {
      body = statusCard(no);
    } else if (servedEntry(no)) {
      const served = servedEntry(no);
      body = html`
        <div class="ready-banner">
          <h2>Your table is ready</h2>
          <p style="margin:0">Please head to <b>${served.tableName}</b>, ${served.name}. Waited ${served.waited} min — thank you for your patience.</p>
        </div>
        <p class="muted" style="margin-top:16px">Enjoy your visit to Tujuh Meja.</p>
        <a class="btn btn-ghost" href="#/">Back to the cafe</a>`;
    } else {
      body = html`
        <h2>You left the queue</h2>
        <p class="muted">Changed your mind? You can join again any time.</p>
        <a class="btn btn-primary" href="#/queue">Join again</a>`;
    }
    return publicPage(html`<section class="container queue-status">${body}</section>`);
  },
  actions: {
    leave() {
      const no = STATE.myQueueNo;
      removeFromQueue(no);
      toast(`#${no} left the queue.`);
    },
  },
};
