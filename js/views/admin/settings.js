// Admin settings (#/admin/settings): opening hours, slot length, deposit and the
// queue estimate. Saved values drive booking slots, the deposit line and the footer.

import { html, toast } from '../../ui.js';
import { STATE, saveSettings, openSlots } from '../../state.js';
import { refresh } from '../../router.js';
import { adminPage, defineAdmin } from './layout.js';

const SLOT_CHOICES = [15, 30, 60];
let draft = null;
let error = '';

function fresh() {
  draft = { ...STATE.settings };
  error = '';
}

export const settingsPage = defineAdmin({
  title: 'Settings',
  render() {
    if (!draft) fresh();
    const today = openSlots(0).length;
    return adminPage({
      title: 'Settings',
      subtitle: 'Changes apply straight away across the booking page, the queue and this dashboard.',
      content: html`
        <form class="panel settings-form" data-submit="save" novalidate>
          <div class="settings-group">
            <h2>Opening hours</h2>
            <div class="field-row">
              <div class="field"><label for="s-open">Opens</label><input id="s-open" class="input" type="time" step="1800" data-input="openTime" value="${draft.openTime}"></div>
              <div class="field"><label for="s-close">Closes</label><input id="s-close" class="input" type="time" step="1800" data-input="closeTime" value="${draft.closeTime}"></div>
            </div>
            <p class="hint">The last booking starts an hour before closing. ${today} bookable times are left today.</p>
          </div>
          <div class="settings-group">
            <h2>Bookings</h2>
            <div class="field-row">
              <div class="field">
                <label for="s-slot">Time slots every</label>
                <select id="s-slot" class="select" data-input="slotMinutes">
                  ${SLOT_CHOICES.map((m) => html`<option value="${m}" ${m === Number(draft.slotMinutes) ? 'selected' : ''}>${m} minutes</option>`)}
                </select>
              </div>
              <div class="field">
                <label for="s-deposit">Deposit per booking (RM)</label>
                <input id="s-deposit" class="input" type="number" min="0" max="500" step="1" data-input="deposit" value="${draft.deposit}">
              </div>
            </div>
            <p class="hint">The deposit is returned when guests are seated and kept on a no-show.</p>
          </div>
          <div class="settings-group">
            <h2>Walk-in queue</h2>
            <div class="field-row">
              <div class="field">
                <label for="s-mpp">Minutes per party ahead</label>
                <input id="s-mpp" class="input" type="number" min="1" max="30" data-input="minutesPerParty" value="${draft.minutesPerParty}">
              </div>
              <div class="field">
                <label for="s-turn">Average table time (minutes)</label>
                <input id="s-turn" class="input" type="number" min="30" max="240" step="15" data-input="turnMinutes" value="${draft.turnMinutes}">
              </div>
            </div>
            <p class="hint">Guests see their wait as parties ahead × minutes per party.</p>
          </div>
          ${error ? html`<p class="field-error" role="alert" style="margin:0">${error}</p>` : ''}
          <div class="row">
            <button class="btn btn-primary" type="submit">Save settings</button>
            <button class="btn btn-ghost" type="button" data-action="undo">Undo changes</button>
          </div>
        </form>
        <section class="panel settings-narrow">
          <div class="panel-head">
            <h2>Demo day</h2>
          </div>
          <p class="muted">This is a demo: bookings, the queue and your tables live only in this browser tab. Start over to bring back the original seven tables and today's guests.</p>
          <button class="btn btn-danger" type="button" data-action="reset">Start a fresh demo day</button>
        </section>`,
    });
  },
  actions: {
    undo() {
      fresh();
      refresh({ force: true });
      toast('Changes undone.');
    },
    reset() {
      window.location.reload();
    },
  },
  inputs: {
    openTime(el) { draft.openTime = el.value; },
    closeTime(el) { draft.closeTime = el.value; },
    slotMinutes(el) { draft.slotMinutes = Number(el.value); },
    deposit(el) { draft.deposit = Number(el.value); },
    minutesPerParty(el) { draft.minutesPerParty = Number(el.value); },
    turnMinutes(el) { draft.turnMinutes = Number(el.value); },
  },
  submits: {
    save() {
      if (!(draft.minutesPerParty >= 1 && draft.minutesPerParty <= 30)) error = 'Minutes per party must be between 1 and 30.';
      else if (!(draft.turnMinutes >= 30 && draft.turnMinutes <= 240)) error = 'Average table time must be between 30 and 240 minutes.';
      else {
        const result = saveSettings(draft);
        error = result.ok ? '' : result.reason;
        if (result.ok) {
          fresh();
          refresh({ force: true });
          toast('Settings saved.');
          return;
        }
      }
      refresh({ force: true });
    },
  },
});
