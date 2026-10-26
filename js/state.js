// One in-memory STATE for the whole demo, the actions that change it, and the
// selectors every page reads. Nothing is saved: a refresh starts a fresh day.

import { createSeed } from './data.js';

const MINUTE = 60000;
const STATUS_CYCLE = ['free', 'reserved', 'seated', 'cleaning'];

export const STATE = createSeed();

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

const ok = (extra = {}) => ({ ok: true, ...extra });
const fail = (reason) => ({ ok: false, reason });

// ---------- lookups ----------

export const tableById = (id) => STATE.tables.find((t) => t.id === id);
export const bookingById = (id) => STATE.bookings.find((b) => b.id === id);
const tableNames = (ids) => ids.map((id) => tableById(id)?.name).filter(Boolean).join(' + ');

function setTable(table, status, patch = {}) {
  Object.assign(table, { status, statusSince: new Date(), ...patch });
  if (status === 'free' || status === 'cleaning') {
    Object.assign(table, { guest: null, party: null, bookingId: null, linkedTo: null });
  }
}

// Both tables of a joined pair move together.
function withLinked(table) {
  const linked = table.linkedTo ? tableById(table.linkedTo) : null;
  return linked ? [table, linked] : [table];
}

// ---------- table fitting ----------

// Smallest free single table that seats the party, else the smallest free joined pair.
export function findTablesFor(party, allowIds = []) {
  const usable = (t) => t.status === 'free' || allowIds.includes(t.id);
  const single = STATE.tables
    .filter((t) => usable(t) && t.seats >= party)
    .sort((a, b) => a.seats - b.seats)[0];
  if (single) return [single];

  const pairs = STATE.tables
    .filter((t) => t.joinWith && usable(t))
    .map((t) => [t, tableById(t.joinWith)])
    .filter(([t, mate]) => mate && usable(mate) && t.id < mate.id)
    .filter(([a, b]) => a.seats + b.seats >= party)
    .sort((x, y) => (x[0].seats + x[1].seats) - (y[0].seats + y[1].seats));
  return pairs[0] || null;
}

function occupy(tables, { guest, party, bookingId = null }) {
  tables.forEach((table, i) => {
    const mate = tables[1 - i];
    setTable(table, 'seated', { guest, party, bookingId, linkedTo: tables.length === 2 ? mate.id : null });
  });
}

// ---------- bookings ----------

export function book({ name, phone, party, time, note }) {
  const no = STATE.nextBookingNo++;
  const booking = {
    id: `b${no}`,
    ref: `TM-${String(no).padStart(4, '0')}`,
    name: name.trim(),
    phone: phone.trim(),
    party,
    time,
    note: (note || '').trim(),
    status: 'upcoming',
    depositStatus: 'held',
    tableIds: [],
    createdAt: new Date(),
  };
  STATE.bookings.push(booking);
  STATE.lastBookingId = booking.id;
  notify();
  return ok({ booking });
}

function releaseReserved(booking) {
  booking.tableIds
    .map(tableById)
    .filter((t) => t && t.status === 'reserved' && t.bookingId === booking.id)
    .forEach((t) => setTable(t, 'free'));
  booking.tableIds = [];
}

export function seatBooking(id) {
  const booking = bookingById(id);
  if (!booking || booking.status !== 'upcoming') return fail('That booking is no longer waiting to be seated.');
  const reservedIds = booking.tableIds.filter((tid) => tableById(tid)?.bookingId === booking.id);
  const tables = findTablesFor(booking.party, reservedIds);
  if (!tables) return fail(`No free table fits a party of ${booking.party} right now.`);
  releaseReserved(booking);
  occupy(tables, { guest: booking.name, party: booking.party, bookingId: booking.id });
  Object.assign(booking, { status: 'seated', depositStatus: 'returned', tableIds: tables.map((t) => t.id) });
  notify();
  return ok({ tables: tableNames(booking.tableIds) });
}

export function markNoShow(id) {
  const booking = bookingById(id);
  if (!booking || booking.status !== 'upcoming') return fail('Only an upcoming booking can be marked as a no-show.');
  releaseReserved(booking);
  Object.assign(booking, { status: 'noshow', depositStatus: 'kept' });
  notify();
  return ok();
}

export function cancelBooking(id) {
  const booking = bookingById(id);
  if (!booking || booking.status !== 'upcoming') return fail('Only an upcoming booking can be cancelled.');
  releaseReserved(booking);
  Object.assign(booking, { status: 'cancelled', depositStatus: 'refunded' });
  notify();
  return ok();
}

// ---------- walk-in queue ----------

export function joinQueue({ name, party, phone }) {
  const entry = {
    no: STATE.nextQueueNo++,
    name: name.trim(),
    party,
    phone: (phone || '').trim(),
    joinedAt: new Date(),
    notifiedAt: null,
  };
  STATE.queue.push(entry);
  STATE.myQueueNo = entry.no;
  notify();
  return ok({ entry });
}

function seatQueueEntry(entry) {
  const tables = findTablesFor(entry.party);
  if (!tables) return fail(`No free table fits #${entry.no} (party of ${entry.party}) yet.`);
  occupy(tables, { guest: `${entry.name} (#${entry.no})`, party: entry.party });
  STATE.queue = STATE.queue.filter((q) => q !== entry);
  STATE.served.push({
    no: entry.no,
    name: entry.name,
    party: entry.party,
    waited: Math.max(1, Math.round((Date.now() - entry.joinedAt) / MINUTE)),
    seatedAt: new Date(),
    tableName: tableNames(tables.map((t) => t.id)),
  });
  return ok({ entry, tables: tableNames(tables.map((t) => t.id)) });
}

// Seat the first party in the queue that a free table can hold.
export function seatNext() {
  if (STATE.queue.length === 0) return fail('The queue is empty.');
  const entry = STATE.queue.find((q) => findTablesFor(q.party));
  if (!entry) return fail('No free table fits anyone in the queue yet.');
  const result = seatQueueEntry(entry);
  notify();
  return result;
}

export function removeFromQueue(no) {
  STATE.queue = STATE.queue.filter((q) => q.no !== no);
  notify();
  return ok();
}

export function notifyQueue(no) {
  const entry = STATE.queue.find((q) => q.no === no);
  if (!entry) return fail('That party already left the queue.');
  entry.notifiedAt = new Date();
  notify();
  return ok({ entry });
}

// ---------- tables ----------

// Close out a seated table: its booking is done and the table goes to cleaning.
function clearTable(table) {
  withLinked(table).forEach((t) => {
    const booking = t.bookingId ? bookingById(t.bookingId) : null;
    if (booking && booking.status === 'seated') booking.status = 'done';
    setTable(t, 'cleaning');
  });
}

export function setTableStatus(id, status) {
  const table = tableById(id);
  if (!table || !STATUS_CYCLE.includes(status)) return fail('Unknown table or status.');
  if (table.status === 'seated' && status !== 'seated') {
    clearTable(table);
    if (status !== 'cleaning') withLinked(table).forEach((t) => setTable(t, status));
  } else if (table.status === 'reserved' && table.bookingId) {
    const booking = bookingById(table.bookingId);
    if (booking && booking.status === 'upcoming' && status === 'seated') {
      // Guests of the reservation arrived: seat their booking here.
      setTable(table, 'seated', { guest: booking.name, party: booking.party, bookingId: booking.id });
      Object.assign(booking, { status: 'seated', depositStatus: 'returned', tableIds: [table.id] });
    } else {
      if (booking) booking.tableIds = booking.tableIds.filter((tid) => tid !== table.id);
      setTable(table, status, status === 'seated' ? { guest: 'Walk-in', party: table.seats } : {});
    }
  } else if (status === 'seated') {
    setTable(table, 'seated', { guest: 'Walk-in', party: table.seats });
  } else {
    setTable(table, status);
  }
  notify();
  return ok();
}

export function cycleTable(id) {
  const table = tableById(id);
  if (!table) return fail('Unknown table.');
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(table.status) + 1) % STATUS_CYCLE.length];
  return setTableStatus(id, next);
}

export function nextTableName() {
  const numbers = STATE.tables.map((t) => Number(t.name.replace(/\D/g, ''))).filter(Number.isFinite);
  return `T${(numbers.length ? Math.max(...numbers) : 0) + 1}`;
}

function validateTable({ name, seats, zone }, ignoreId = null) {
  const clean = (name || '').trim();
  if (!clean) return 'Give the table a name.';
  if (STATE.tables.some((t) => t.id !== ignoreId && t.name.toLowerCase() === clean.toLowerCase())) {
    return `${clean} already exists.`;
  }
  if (!(seats >= 1 && seats <= 12)) return 'Seats must be between 1 and 12.';
  if (!(zone || '').trim()) return 'Choose a zone.';
  return null;
}

function linkPair(table, joinWith) {
  // Drop any old pairing on both sides, then pair the two tables.
  STATE.tables.filter((t) => t.joinWith === table.id).forEach((t) => { t.joinWith = null; });
  if (table.joinWith) {
    const old = tableById(table.joinWith);
    if (old) old.joinWith = null;
  }
  table.joinWith = joinWith || null;
  const mate = joinWith ? tableById(joinWith) : null;
  if (mate) {
    if (mate.joinWith && mate.joinWith !== table.id) {
      const mateOld = tableById(mate.joinWith);
      if (mateOld) mateOld.joinWith = null;
    }
    mate.joinWith = table.id;
  }
}

export function addTable({ name, zone, seats, joinWith }) {
  const error = validateTable({ name, zone, seats });
  if (error) return fail(error);
  const table = {
    id: `t${Date.now().toString(36)}`,
    name: name.trim(),
    zone: zone.trim(),
    seats,
    joinWith: null,
    status: 'free',
    statusSince: new Date(),
    guest: null,
    party: null,
    bookingId: null,
    linkedTo: null,
  };
  STATE.tables.push(table);
  linkPair(table, joinWith);
  notify();
  return ok({ table });
}

export function updateTable(id, { name, zone, seats, joinWith }) {
  const table = tableById(id);
  if (!table) return fail('That table no longer exists.');
  const error = validateTable({ name, zone, seats }, id);
  if (error) return fail(error);
  if (table.status === 'seated' && table.party > seats) return fail(`${table.name} is seating ${table.party} now — seats cannot drop below that.`);
  Object.assign(table, { name: name.trim(), zone: zone.trim(), seats });
  linkPair(table, joinWith);
  notify();
  return ok({ table });
}

export function removeTable(id) {
  const table = tableById(id);
  if (!table) return fail('That table no longer exists.');
  const reason = removeBlockedReason(table);
  if (reason) return fail(reason);
  linkPair(table, null);
  STATE.tables = STATE.tables.filter((t) => t !== table);
  notify();
  return ok({ table });
}

export function removeBlockedReason(table) {
  if (table.status === 'seated') return `${table.name} has guests seated.`;
  if (table.status === 'reserved') return `${table.name} is reserved for a booking.`;
  if (STATE.tables.length <= 1) return 'The cafe needs at least one table.';
  return null;
}

export function zones() {
  const base = ['Window', 'Floor', 'Corner', 'Patio'];
  STATE.tables.forEach((t) => { if (!base.includes(t.zone)) base.push(t.zone); });
  return base;
}

// ---------- settings ----------

export function saveSettings(patch) {
  const next = { ...STATE.settings, ...patch };
  const [oh] = next.openTime.split(':').map(Number);
  const [ch] = next.closeTime.split(':').map(Number);
  if (!(ch > oh)) return fail('Closing time must be after opening time.');
  if (!(next.deposit >= 0 && next.deposit <= 500)) return fail('Deposit must be between RM0 and RM500.');
  STATE.settings = next;
  notify();
  return ok();
}

// ---------- background tick (sim.js) ----------

// Re-render without a state change (clocks and "minutes ago" labels move on).
export function tick() {
  notify();
}

// ---------- selectors ----------

export function maxParty() {
  const single = Math.max(0, ...STATE.tables.map((t) => t.seats));
  const paired = Math.max(0, ...STATE.tables
    .filter((t) => t.joinWith && tableById(t.joinWith))
    .map((t) => t.seats + tableById(t.joinWith).seats));
  return Math.max(single, paired);
}

export const tablesTaken = () => STATE.tables.filter((t) => t.status === 'seated' || t.status === 'reserved').length;
export const tablesInUse = () => STATE.tables.filter((t) => t.status === 'seated').length;
export const freeTables = () => STATE.tables.filter((t) => t.status === 'free').length;

export function covers() {
  const fromBookings = STATE.bookings
    .filter((b) => b.status === 'seated' || b.status === 'done')
    .reduce((sum, b) => sum + b.party, 0);
  const fromWalkIns = STATE.served.reduce((sum, s) => sum + s.party, 0);
  return fromBookings + fromWalkIns;
}

export const noShows = () => STATE.bookings.filter((b) => b.status === 'noshow').length;

export function noShowRate() {
  const settled = STATE.bookings.filter((b) => ['seated', 'done', 'noshow'].includes(b.status)).length;
  return settled ? Math.round((noShows() / settled) * 100) : 0;
}

export function avgWait() {
  if (!STATE.served.length) return 0;
  return Math.round(STATE.served.reduce((sum, s) => sum + s.waited, 0) / STATE.served.length);
}

export const bookingsToday = () => STATE.bookings.filter((b) => b.status !== 'cancelled').length;

// Parties ahead of a queue number (null when it is no longer queued).
export function partiesAhead(no) {
  const index = STATE.queue.findIndex((q) => q.no === no);
  return index === -1 ? null : index;
}

export function estimatedWait(ahead) {
  return Math.max(2, (ahead + 1) * STATE.settings.minutesPerParty);
}

export function queueWait() {
  return STATE.queue.length ? estimatedWait(STATE.queue.length) : 0;
}

export const servedEntry = (no) => STATE.served.find((s) => s.no === no) || null;

export function upcomingBookings() {
  return STATE.bookings
    .filter((b) => b.status === 'upcoming')
    .sort((a, b) => a.time - b.time);
}

function minutesOf(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Bookable slots for a day offset (0 today, 1 tomorrow). A slot is full when the
// bookings overlapping it already hold every table but one (kept for walk-ins).
export function openSlots(dayOffset = 0, now = new Date()) {
  const { openTime, closeTime, slotMinutes, turnMinutes } = STATE.settings;
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() + dayOffset);
  const lastStart = minutesOf(closeTime) - 60;
  const slots = [];
  for (let m = minutesOf(openTime); m <= lastStart; m += slotMinutes) {
    const time = new Date(day.getTime() + m * MINUTE);
    if (time - now < 15 * MINUTE) continue;
    const overlapping = STATE.bookings.filter((b) => b.status === 'upcoming'
      && Math.abs(b.time - time) < turnMinutes * MINUTE).length;
    slots.push({ time, full: overlapping >= Math.max(1, STATE.tables.length - 1) });
  }
  return slots;
}

// Covers per opening hour: past hours from today's real seatings over the typical
// day, later hours as forecast.
export function coversByHour(now = new Date()) {
  const open = Math.floor(minutesOf(STATE.settings.openTime) / 60);
  const close = Math.ceil(minutesOf(STATE.settings.closeTime) / 60);
  const live = {};
  STATE.bookings
    .filter((b) => b.status === 'seated' || b.status === 'done')
    .forEach((b) => { live[b.time.getHours()] = (live[b.time.getHours()] || 0) + b.party; });
  STATE.served.forEach((s) => { live[s.seatedAt.getHours()] = (live[s.seatedAt.getHours()] || 0) + s.party; });
  const rows = [];
  for (let hour = open; hour < close; hour++) {
    const past = hour <= now.getHours();
    const typical = STATE.typicalCoversByHour[hour] || 0;
    rows.push({ hour, covers: past ? Math.max(typical, live[hour] || 0) : typical, forecast: !past });
  }
  return rows;
}

export function lastSevenDays(now = new Date()) {
  const days = STATE.history.map((d) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d.daysAgo);
    return { date, covers: d.covers, noShows: d.noShows, today: false };
  });
  days.push({ date: new Date(now), covers: covers(), noShows: noShows(), today: true });
  return days;
}
