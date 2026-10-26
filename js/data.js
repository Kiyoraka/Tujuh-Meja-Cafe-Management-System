// Seed for one demo day. Every time is built relative to "now", so the cafe always
// looks like it is open today. All people, phones and numbers are fictional.

const MINUTE = 60000;

function at(base, minutes) {
  return new Date(base.getTime() + minutes * MINUTE);
}

// Round down to the half hour so bookings sit on real slot times.
function slotFloor(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() < 30 ? 0 : 30);
  return d;
}

export function createSeed(now = new Date()) {
  const slot = slotFloor(now);

  const tables = [
    { id: 't1', name: 'T1', zone: 'Window', seats: 2, joinWith: null },
    { id: 't2', name: 'T2', zone: 'Window', seats: 2, joinWith: null },
    { id: 't6', name: 'T6', zone: 'Window', seats: 2, joinWith: null },
    { id: 't3', name: 'T3', zone: 'Floor', seats: 4, joinWith: 't4' },
    { id: 't4', name: 'T4', zone: 'Floor', seats: 4, joinWith: 't3' },
    { id: 't5', name: 'T5', zone: 'Floor', seats: 4, joinWith: null },
    { id: 't7', name: 'T7', zone: 'Corner', seats: 4, joinWith: null },
  ].map((table) => ({
    ...table,
    status: 'free',
    statusSince: at(now, -20),
    guest: null,
    party: null,
    bookingId: null,
    linkedTo: null,
  }));

  const booking = (id, minutes, name, phone, party, status, extra = {}) => ({
    id,
    ref: `TM-${id.slice(1).padStart(4, '0')}`,
    name,
    phone,
    party,
    time: at(slot, minutes),
    note: '',
    status,
    depositStatus: 'held',
    tableIds: [],
    createdAt: at(now, -60 * 24),
    ...extra,
  });

  const bookings = [
    booking('b401', -180, 'Nurul Huda', '012-345 0001', 2, 'done', { depositStatus: 'returned' }),
    booking('b402', -150, 'Jason Tan', '016-345 0002', 4, 'done', { depositStatus: 'returned' }),
    booking('b403', -120, 'Priya Nair', '017-345 0003', 2, 'done', { depositStatus: 'returned', note: 'Window seat if possible' }),
    booking('b404', -90, 'Daniel Wong', '019-345 0004', 3, 'noshow', { depositStatus: 'kept' }),
    booking('b405', -60, 'Hafiz Rahman', '013-345 0005', 2, 'seated', { depositStatus: 'returned', tableIds: ['t2'] }),
    booking('b406', -30, 'Lim Wei Jie', '012-345 0006', 4, 'seated', { depositStatus: 'returned', tableIds: ['t3'] }),
    booking('b407', -30, 'Siti Aminah', '011-345 0007', 3, 'seated', { depositStatus: 'returned', tableIds: ['t7'], note: 'Birthday — small cake at 3' }),
    booking('b408', 30, 'Farah Izzati', '014-345 0008', 4, 'upcoming', { tableIds: ['t4'] }),
    booking('b409', 60, 'Kumar Selvam', '012-345 0009', 2, 'cancelled', { depositStatus: 'refunded' }),
    booking('b410', 60, 'Chloe Lee', '016-345 0010', 2, 'upcoming'),
    booking('b411', 90, 'Arjun Menon', '017-345 0011', 6, 'upcoming', { note: 'Team lunch' }),
    booking('b412', 120, 'Mei Ling', '019-345 0012', 2, 'upcoming'),
    booking('b413', 150, 'Raj Kumar', '013-345 0013', 4, 'upcoming'),
    booking('b414', 180, 'Aina Sofea', '011-345 0014', 3, 'upcoming', { note: 'One high chair' }),
  ];

  // Tables that match the bookings above.
  const seat = (id, guest, party, minutesAgo, bookingId = null) => {
    Object.assign(tables.find((t) => t.id === id), {
      status: 'seated', guest, party, bookingId, statusSince: at(now, -minutesAgo),
    });
  };
  seat('t2', 'Hafiz Rahman', 2, 52, 'b405');
  seat('t3', 'Lim Wei Jie', 4, 27, 'b406');
  seat('t7', 'Siti Aminah', 3, 24, 'b407');
  seat('t5', 'Walk-in #11', 3, 18);
  Object.assign(tables.find((t) => t.id === 't4'), { status: 'reserved', guest: 'Farah Izzati', party: 4, bookingId: 'b408', statusSince: at(now, -10) });
  Object.assign(tables.find((t) => t.id === 't6'), { status: 'cleaning', statusSince: at(now, -3) });

  // Walk-in queue, oldest first.
  const queue = [
    { no: 12, name: 'Aisyah', party: 2, phone: '012-555 0112', joinedAt: at(now, -14), notifiedAt: null },
    { no: 13, name: 'Ravi', party: 4, phone: '016-555 0113', joinedAt: at(now, -9), notifiedAt: null },
    { no: 14, name: 'Grace', party: 2, phone: '017-555 0114', joinedAt: at(now, -5), notifiedAt: null },
    { no: 15, name: 'Haziq', party: 3, phone: '019-555 0115', joinedAt: at(now, -2), notifiedAt: null },
  ];

  // Walk-ins already seated today (how long each waited feeds "average wait").
  const served = [
    { no: 7, name: 'Zul', party: 2, waited: 9, seatedAt: at(now, -200), tableName: 'T1' },
    { no: 8, name: 'Tan', party: 3, waited: 14, seatedAt: at(now, -170), tableName: 'T5' },
    { no: 9, name: 'Nadia', party: 2, waited: 11, seatedAt: at(now, -140), tableName: 'T6' },
    { no: 10, name: 'Wong', party: 4, waited: 18, seatedAt: at(now, -95), tableName: 'T7' },
    { no: 11, name: 'Walk-in #11', party: 3, waited: 16, seatedAt: at(now, -18), tableName: 'T5' },
  ];

  const settings = {
    openTime: '10:00',
    closeTime: '22:00',
    slotMinutes: 30,
    deposit: 10,
    turnMinutes: 75,
    minutesPerParty: 4,
  };

  // A typical day's covers by opening hour; past hours read as today, later hours as forecast.
  const typicalCoversByHour = {
    10: 6, 11: 10, 12: 22, 13: 26, 14: 14, 15: 12, 16: 10, 17: 14, 18: 24, 19: 28, 20: 20, 21: 8,
  };

  // Previous six days, oldest first; today is added live.
  const history = [
    { daysAgo: 6, covers: 142, noShows: 3 },
    { daysAgo: 5, covers: 118, noShows: 1 },
    { daysAgo: 4, covers: 131, noShows: 2 },
    { daysAgo: 3, covers: 156, noShows: 4 },
    { daysAgo: 2, covers: 189, noShows: 2 },
    { daysAgo: 1, covers: 174, noShows: 3 },
  ];

  return {
    tables,
    bookings,
    queue,
    served,
    settings,
    typicalCoversByHour,
    history,
    nextQueueNo: 16,
    nextBookingNo: 415,
    myQueueNo: null,
    lastBookingId: null,
  };
}
