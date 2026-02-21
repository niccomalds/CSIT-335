// ── Data Generation ────────────────────────────────────────────────────────
/**
 * Generates a deterministic list of parking spots.
 * @param {number} count     - Total number of spots
 * @param {number} rate      - Occupancy rate (0.0 to 1.0)
 * @param {number} seed      - Seed for deterministic randomness
 * @returns {Array} Array of spot objects
 */
function makeSpots(count, rate, seed) {
  const rows = ['1', '2', '3', '4', '5'];
  let r = seed >>> 0;
  const rand = () => {
    r = (Math.imul(r, 1664525) + 1013904223) >>> 0;
    return r / 0xffffffff;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    row: rows[Math.floor(i / 5)],
    col: (i % 5) + 1,
    status: rand() < rate ? 'occupied' : 'available',
  }));
}


// ── Parking Data ───────────────────────────────────────────────────────────
const DATA = {
  Student: {
    sticker: '001',
    color: '#FFD700',
    zones: [
      {
        id: 'SZ-A', name: 'Student Zone A', building: 'Near NGE',
        '2 Wheel': { available: 15, occupied: 105, slots: 120, spots: makeSpots(20, 0.87, 1) },
        '4 Wheel': { available: 8,  occupied: 42,  slots: 50,  spots: makeSpots(12, 0.84, 2) },
      },
      {
        id: 'SZ-B', name: 'Student Zone B', building: 'Tres De Abril',
        '2 Wheel': { available: 30, occupied: 70,  slots: 100, spots: makeSpots(18, 0.70, 3) },
        '4 Wheel': { available: 12, occupied: 38,  slots: 50,  spots: makeSpots(12, 0.76, 4) },
      },
      {
        id: 'SZ-C', name: 'Student Zone C', building: 'Allied Building',
        '2 Wheel': { available: 5,  occupied: 45,  slots: 50,  spots: makeSpots(15, 0.90, 5) },
        '4 Wheel': { available: 20, occupied: 10,  slots: 30,  spots: makeSpots(10, 0.33, 6) },
      },
    ],
  },

  Faculty: {
    sticker: '002',
    color: '#4A90D9',
    zones: [
      {
        id: 'FZ-A', name: 'Faculty Zone A', building: 'RTL Building',
        '2 Wheel': { available: 22, occupied: 28, slots: 50, spots: makeSpots(12, 0.56, 7) },
        '4 Wheel': { available: 30, occupied: 20, slots: 50, spots: makeSpots(10, 0.40, 8) },
      },
      {
        id: 'FZ-B', name: 'Faculty Zone B', building: 'GLE Building',
        '2 Wheel': { available: 18, occupied: 12, slots: 30, spots: makeSpots(10, 0.40, 9) },
        '4 Wheel': { available: 14, occupied: 16, slots: 30, spots: makeSpots(10, 0.53, 10) },
      },
    ],
  },

  'Staff/Employee': {
    sticker: '003',
    color: '#50C878',
    zones: [
      {
        id: 'SEZ-A', name: 'Staff Zone A', building: 'NGE Building',
        '2 Wheel': { available: 10, occupied: 40, slots: 50, spots: makeSpots(14, 0.80, 11) },
        '4 Wheel': { available: 18, occupied: 32, slots: 50, spots: makeSpots(12, 0.64, 12) },
      },
      {
        id: 'SEZ-B', name: 'Employee Zone B', building: 'Tres de Abril',
        '2 Wheel': { available: 6,  occupied: 24, slots: 30, spots: makeSpots(10, 0.80, 13) },
        '4 Wheel': { available: 10, occupied: 20, slots: 30, spots: makeSpots(10, 0.67, 14) },
      },
      {
        id: 'SEZ-C', name: 'Employee Zone C', building: 'Allied Building',
        '2 Wheel': { available: 14, occupied: 6,  slots: 20, spots: makeSpots(8, 0.30, 15) },
        '4 Wheel': { available: 8,  occupied: 12, slots: 20, spots: makeSpots(8, 0.60, 16) },
      },
    ],
  },
};

// User type label map
const USER_LABELS = {
  Student:          'Student Parking Area',
  Faculty:          'Faculty Parking Area',
  'Staff/Employee': 'Staff/Employee Area',
};


// ── App State ──────────────────────────────────────────────────────────────
let userType  = 'Student';
let wheelType = '2 Wheel';
let zoneIndex = 0;


// ── Render ─────────────────────────────────────────────────────────────────
/**
 * Main render function. Updates all dynamic UI elements based on current state.
 */
function render() {
  const td   = DATA[userType];
  const zone = td.zones[zoneIndex];
  const wd   = zone[wheelType];
  const pct  = Math.round((wd.occupied / wd.slots) * 100);

  // Update sticker number in header
  document.getElementById('stickerLabel').textContent = 'STICKER# ' + td.sticker;

  // Update stats panel
  document.getElementById('statAvail').textContent = wd.available;
  document.getElementById('statOcc').textContent   = wd.occupied;
  document.getElementById('statSlots').textContent = wd.slots;
  document.getElementById('occPct').textContent    = pct + '%';

  // Update occupancy bar color and width
  const fill = document.getElementById('occFill');
  fill.style.width      = pct + '%';
  fill.style.background = pct > 80 ? '#ef4444' : pct > 50 ? '#f97316' : '#22c55e';

  // Update bottom zone label
  document.getElementById('zoneName').textContent = zone.name;
  document.getElementById('zoneSub').textContent  =
    zone.building + ' \u00b7 ' + (zoneIndex + 1) + ' / ' + td.zones.length;

  // Rebuild zone indicator dots (only for current user type's zones)
  const dotsCon = document.getElementById('zoneDots');
  dotsCon.innerHTML = '';
  td.zones.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className  = 'zone-dot-btn' + (i === zoneIndex ? ' active' : '');
    btn.style.width = i === zoneIndex ? '24px' : '8px';
    btn.onclick    = () => { zoneIndex = i; render(); };
    dotsCon.appendChild(btn);
  });

  // Re-render the map
  renderMap(zone, wd, td.color);
}

/**
 * Builds and injects the parking map HTML into #mapInner.
 * @param {object} zone   - Current zone object
 * @param {object} wd     - Wheel-type data (available, occupied, slots, spots)
 * @param {string} accent - Accent color hex for the zone badge
 */
function renderMap(zone, wd, accent) {
  const rows = [...new Set(wd.spots.map(s => s.row))];

  let html = `
    <div class="zone-badge">
      <span class="zone-id"
        style="background:${accent}22; border:1px solid ${accent}55; color:${accent};">
        ${zone.id}
      </span>
      <span class="zone-building">${zone.building}</span>
    </div>
    <div class="spot-rows">`;

  rows.forEach(row => {
    const rowSpots = wd.spots.filter(s => s.row === row);
    html += `
      <div class="spot-row">
        <span class="row-label">${row}</span>
        <div class="road-line road-left"></div>
        <div class="spots-group">`;

    rowSpots.forEach(spot => {
      html += `<div
        class="spot-dot ${spot.status}"
        title="Spot ${spot.row}${spot.col} — ${spot.status}">
      </div>`;
    });

    html += `
        </div>
        <div class="road-line road-right"></div>
      </div>`;
  });

  html += `
    </div>
    <div class="entrance-line"
      style="border-top-color:${accent}22; color:${accent}44;">
      ENTRANCE / EXIT
    </div>`;

  document.getElementById('mapInner').innerHTML = html;
}


// ── Dropdown Logic ─────────────────────────────────────────────────────────
/**
 * Toggles the open/close state of a dropdown.
 * @param {string} id - ID of the dropdown wrapper element
 */
function toggleDropdown(id) {
  const wrap   = document.getElementById(id);
  const btn    = wrap.querySelector('.dropdown-btn');
  const menu   = wrap.querySelector('.dropdown-menu');
  const isOpen = menu.classList.contains('open');

  // Close all dropdowns first
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
  document.querySelectorAll('.dropdown-btn').forEach(b => b.classList.remove('open'));

  // Open this one if it was previously closed
  if (!isOpen) {
    menu.classList.add('open');
    btn.classList.add('open');
  }
}

// Close dropdowns when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.dropdown-btn').forEach(b => b.classList.remove('open'));
  }
});

/**
 * Selects a user type and resets the zone to the first zone of that type.
 * @param {string} type - One of 'Student', 'Faculty', 'Staff/Employee'
 */
function selectUser(type) {
  userType  = type;
  zoneIndex = 0;

  document.getElementById('userBtnText').textContent = USER_LABELS[type];

  document.querySelectorAll('#userMenu .dropdown-item').forEach(el => {
    el.classList.toggle('active', el.textContent === USER_LABELS[type]);
  });

  document.getElementById('userMenu').classList.remove('open');
  document.getElementById('userBtn').classList.remove('open');

  render();
}

/**
 * Selects a wheel type (2 Wheel or 4 Wheel).
 * @param {string} type - '2 Wheel' or '4 Wheel'
 */
function selectWheel(type) {
  wheelType = type;

  document.getElementById('wheelBtnText').textContent = type;

  document.querySelectorAll('#wheelMenu .dropdown-item').forEach(el => {
    el.classList.toggle('active', el.textContent === type);
  });

  document.getElementById('wheelMenu').classList.remove('open');
  document.getElementById('wheelBtn').classList.remove('open');

  render();
}


// ── Zone Switcher ──────────────────────────────────────────────────────────
/**
 * Shifts the active zone index forward or backward.
 * Wraps around within the current user type's zones only.
 * @param {number} dir - Direction: -1 (previous) or 1 (next)
 */
function shiftZone(dir) {
  const len = DATA[userType].zones.length;
  zoneIndex = (zoneIndex + dir + len) % len;
  render();
}


// ── Navigate ───────────────────────────────────────────────────────────────
/**
 * Simulates a navigation action with a temporary visual state change.
 */
function navigate() {
  const btn = document.getElementById('navBtn');
  btn.classList.add('navigating');
  btn.textContent = 'NAVIGATING...';

  setTimeout(() => {
    btn.classList.remove('navigating');
    btn.textContent = 'NAVIGATE';
  }, 2000);
}


// ── Init ───────────────────────────────────────────────────────────────────
render();