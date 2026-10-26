// Keeps the demo cafe alive: every ~25 s a cleaned table frees up, the queue moves,
// and now and then a table finishes or a new walk-in arrives. Paused while the tab
// is hidden or a form dialog is open.

import { STATE, setTableStatus, seatNext, joinQueue, findTablesFor, tick } from './state.js';

const TICK_MS = 25000;
const WALK_IN_NAMES = ['Amir', 'Mei', 'Kavitha', 'Danish', 'Hui Min', 'Syafiq', 'Elena', 'Faizal', 'Wen Jie', 'Aishah', 'Ganesh', 'Sofia'];

let timer = null;
let walkInIndex = 0;

function longestSeated() {
  return STATE.tables
    .filter((t) => t.status === 'seated')
    .sort((a, b) => a.statusSince - b.statusSince)[0] || null;
}

function step() {
  if (document.hidden || document.querySelector('.modal-backdrop')) return;
  let changed = false;

  // 1. A table that was being cleaned is ready again.
  const cleaning = STATE.tables
    .filter((t) => t.status === 'cleaning')
    .sort((a, b) => a.statusSince - b.statusSince)[0];
  if (cleaning && Date.now() - cleaning.statusSince > TICK_MS * 0.8) {
    setTableStatus(cleaning.id, 'free');
    changed = true;
  }

  // 2. Seat the next party that fits.
  if (STATE.queue.some((q) => findTablesFor(q.party))) {
    seatNext();
    changed = true;
  } else if (STATE.queue.length) {
    // 3. Nobody fits: the table seated longest finishes up so the line keeps moving.
    const done = longestSeated();
    if (done && Date.now() - done.statusSince > 10 * 60000) {
      setTableStatus(done.id, 'cleaning');
      changed = true;
    }
  }

  // 4. Keep a little line at the door.
  if (STATE.queue.length < 2 && Math.random() < 0.6) {
    const name = WALK_IN_NAMES[walkInIndex++ % WALK_IN_NAMES.length];
    const party = [2, 2, 3, 4][Math.floor(Math.random() * 4)];
    joinQueue({ name, party, phone: '' }, { asVisitor: false });
    changed = true;
  }

  if (!changed) tick(); // clocks and "minutes ago" labels still move
}

export function startSim() {
  if (timer) return;
  timer = setInterval(step, TICK_MS);
}

export function stopSim() {
  clearInterval(timer);
  timer = null;
}

// Exposed for tests: run one step now.
export const runSimStep = step;
