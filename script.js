// =========================================================================
// 1. NAVEGACIÓN POR PESTAÑAS, MENÚ MÓVIL Y FILTROS DE CARTA
// =========================================================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const disparadoresTab = document.querySelectorAll('[data-tab]');
const vistas = document.querySelectorAll('.vista-pestana');
const enlacesNav = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

function cambiarPestana(nombreTab) {
  vistas.forEach(vista => vista.classList.remove('activa'));

  const vistaObjetivo = document.getElementById('vista-' + nombreTab);
  if (vistaObjetivo) {
    vistaObjetivo.classList.add('activa');
  }

  enlacesNav.forEach(link => {
    if (link.getAttribute('data-tab') === nombreTab) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  navMenu.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

disparadoresTab.forEach(elemento => {
  elemento.addEventListener('click', (e) => {
    e.preventDefault();
    const destino = elemento.getAttribute('data-tab');
    cambiarPestana(destino);
  });
});

// Filtros dentro de la pestaña Menú
const botonesFiltro = document.querySelectorAll('.navegacion-menu a');
const tarjetas = document.querySelectorAll('.tarjeta-comida');

botonesFiltro.forEach(boton => {
  boton.addEventListener('click', (e) => {
    e.preventDefault();
    botonesFiltro.forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');

    const filtro = boton.getAttribute('data-filtro');
    tarjetas.forEach(tarjeta => {
      if (filtro === 'todos' || tarjeta.getAttribute('data-categoria') === filtro) {
        tarjeta.style.display = 'flex';
      } else {
        tarjeta.style.display = 'none';
      }
    });
  });
});

// Formulario de Contacto
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('¡Mensaje enviado! Nuestro equipo de Concierge de Pasta allaHuaki le responderá a la brevedad.');
    contactForm.reset();
  });
}

// =========================================================================
// 2. SISTEMA DE RESERVAS (PLANO DEL SALÓN, TICKETS Y LOCALSTORAGE)
// =========================================================================
const tablesData = [
  { id: 'M-01', zone: 'terraza', zoneLabel: 'Terraza VIP', capacity: 2, shape: 'round' },
  { id: 'M-02', zone: 'terraza', zoneLabel: 'Terraza VIP', capacity: 4, shape: 'square' },
  { id: 'M-03', zone: 'terraza', zoneLabel: 'Terraza VIP', capacity: 6, shape: 'rect' },
  { id: 'M-04', zone: 'salon', zoneLabel: 'Salón Principal', capacity: 2, shape: 'round' },
  { id: 'M-05', zone: 'salon', zoneLabel: 'Salón Principal', capacity: 4, shape: 'square' },
  { id: 'M-06', zone: 'salon', zoneLabel: 'Salón Principal', capacity: 6, shape: 'rect' },
  { id: 'M-07', zone: 'salon', zoneLabel: 'Salón Principal', capacity: 8, shape: 'rect' },
  { id: 'M-08', zone: 'privado', zoneLabel: 'Cava Privada', capacity: 6, shape: 'rect' },
  { id: 'M-09', zone: 'privado', zoneLabel: 'Cava Privada', capacity: 10, shape: 'rect' }
];

const STORAGE_KEY = 'pasta_allahuaki_reservations_v1';

function loadReservations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('No se pudo leer localStorage:', e);
  }
  return [
    {
      code: 'HUA-4821',
      tableId: 'M-01',
      zoneLabel: 'Terraza VIP',
      guests: 2,
      date: new Date().toISOString().split('T')[0],
      time: '21:00',
      name: 'Carlos Mendoza',
      phone: '+54 9 388 412-9988',
      notes: 'Mesa junto a la baranda'
    }
  ];
}

function saveReservations() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reservations));
  } catch (e) {
    console.warn('No se pudo guardar en localStorage:', e);
  }
}

let state = {
  selectedTableId: null,
  selectedZone: 'all',
  guests: 2,
  date: '',
  time: '21:00',
  reservations: loadReservations()
};

const tablesGrid = document.getElementById('tables-grid');
const guestsSelect = document.getElementById('guests');
const dateInput = document.getElementById('date');
const timeSlots = document.querySelectorAll('.time-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const selectedDisplay = document.getElementById('selected-table-display');
const submitBtn = document.getElementById('submit-btn');
const bookingForm = document.getElementById('booking-form');
const reservationsListEl = document.getElementById('reservations-list');

const ticketModal = document.getElementById('ticket-modal');
const listModal = document.getElementById('list-modal');
const resCountBadge = document.getElementById('reservation-count');

function initReservations() {
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  dateInput.min = today;
  state.date = today;

  renderTables();
  updateSelectedSummary();
  updateReservationBadge();
  setupReservationListeners();
}

function isTableOccupied(tableId) {
  return state.reservations.some(
    res => res.tableId === tableId && res.date === state.date && res.time === state.time
  );
}

function renderTables() {
  tablesGrid.innerHTML = '';

  const filteredTables = state.selectedZone === 'all'
    ? tablesData
    : tablesData.filter(t => t.zone === state.selectedZone);

  filteredTables.forEach(table => {
    const occupied = isTableOccupied(table.id);
    const needsExtraChairs = table.capacity < state.guests;
    const isSelected = state.selectedTableId === table.id;

    if (isSelected && occupied) {
      state.selectedTableId = null;
      updateSelectedSummary();
    }

    const card = document.createElement('div');
    card.className = 'table-card';
    if (occupied) card.classList.add('occupied');
    else if (isSelected) card.classList.add('selected');

    let statusHtml = '';
    if (occupied) {
      statusHtml = `<span class="table-status-tag tag-occupied">Reservada</span>`;
    } else if (needsExtraChairs) {
      statusHtml = `<span class="table-status-tag tag-extra">+ Sillas adicionales</span>`;
    }

    card.innerHTML = `
      <span class="table-zone">${table.zoneLabel}</span>
      <div class="table-shape ${table.shape}">${table.id}</div>
      <span class="table-cap">${table.capacity} Personas</span>
      ${statusHtml}
    `;

    if (!occupied) {
      card.addEventListener('click', () => selectTable(table.id));
    }

    tablesGrid.appendChild(card);
  });
}

function selectTable(tableId) {
  state.selectedTableId = state.selectedTableId === tableId ? null : tableId;
  renderTables();
  updateSelectedSummary();
}

function updateSelectedSummary() {
  if (!state.selectedTableId) {
    selectedDisplay.classList.remove('has-selection');
    selectedDisplay.innerHTML = `<span class="placeholder-text">Selecciona una mesa en el plano</span>`;
    submitBtn.disabled = true;
    return;
  }

  const table = tablesData.find(t => t.id === state.selectedTableId);
  const extraInfo = table.capacity < state.guests
    ? `<p class="capacity-note">✦ Se añadirán sillas extra para ${state.guests} comensales.</p>`
    : '';

  selectedDisplay.classList.add('has-selection');
  selectedDisplay.innerHTML = `
    <div class="selected-summary">
      <div>
        <strong>Mesa ${table.id}</strong>
        <p style="font-size: 0.75rem; color: #9a9a9a;">${table.zoneLabel}</p>
      </div>
      <span>Capacidad base: ${table.capacity} pers.</span>
    </div>
    ${extraInfo}
  `;
  submitBtn.disabled = false;
}

function setupReservationListeners() {
  guestsSelect.addEventListener('change', (e) => {
    state.guests = parseInt(e.target.value, 10);
    renderTables();
    updateSelectedSummary();
  });

  dateInput.addEventListener('change', (e) => {
    state.date = e.target.value;
    renderTables();
  });

  timeSlots.forEach(btn => {
    btn.addEventListener('click', () => {
      timeSlots.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.time = btn.dataset.time;
      renderTables();
    });
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedZone = btn.dataset.zone;
      renderTables();
    });
  });

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.selectedTableId) return;

    const table = tablesData.find(t => t.id === state.selectedTableId);
    const randomCode = 'HUA-' + Math.floor(1000 + Math.random() * 9000);

    const newReservation = {
      code: randomCode,
      tableId: table.id,
      zoneLabel: table.zoneLabel,
      guests: state.guests,
      date: state.date,
      time: state.time,
      name: document.getElementById('customer-name').value.trim(),
      phone: document.getElementById('customer-phone').value.trim(),
      notes: document.getElementById('notes').value.trim()
    };

    state.reservations.push(newReservation);
    saveReservations();
    showTicket(newReservation);

    state.selectedTableId = null;
    bookingForm.reset();
    guestsSelect.value = state.guests;
    dateInput.value = state.date;

    updateSelectedSummary();
    updateReservationBadge();
    renderTables();
  });

  reservationsListEl.addEventListener('click', (e) => {
    const cancelBtn = e.target.closest('.btn-cancel');
    if (!cancelBtn) return;

    const code = cancelBtn.dataset.code;
    state.reservations = state.reservations.filter(res => res.code !== code);
    saveReservations();
    updateReservationBadge();
    renderReservationsList();
    renderTables();
  });

  document.getElementById('close-ticket').addEventListener('click', () => ticketModal.classList.remove('open'));
  document.getElementById('btn-new-booking').addEventListener('click', () => ticketModal.classList.remove('open'));

  document.getElementById('btn-view-reservations').addEventListener('click', () => {
    renderReservationsList();
    listModal.classList.add('open');
  });
  document.getElementById('close-list').addEventListener('click', () => listModal.classList.remove('open'));

  [ticketModal, listModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });
}

function showTicket(res) {
  document.getElementById('ticket-code').textContent = `#${res.code}`;
  document.getElementById('ticket-details').innerHTML = `
    <div class="ticket-row"><span>Titular:</span><span>${res.name}</span></div>
    <div class="ticket-row"><span>Mesa Asignada:</span><span style="color: #d4af37;">${res.tableId} (${res.zoneLabel})</span></div>
    <div class="ticket-row"><span>Comensales:</span><span>${res.guests} ${res.guests === 1 ? 'Persona' : 'Personas'}</span></div>
    <div class="ticket-row"><span>Fecha y Hora:</span><span>${res.date} • ${res.time} hs</span></div>
    <div class="ticket-row"><span>Teléfono:</span><span>${res.phone}</span></div>
    ${res.notes ? `<div class="ticket-row"><span>Notas:</span><span>${res.notes}</span></div>` : ''}
  `;
  ticketModal.classList.add('open');
}

function updateReservationBadge() {
  resCountBadge.textContent = state.reservations.length;
}

function renderReservationsList() {
  if (state.reservations.length === 0) {
    reservationsListEl.innerHTML = `<p style="color: #9a9a9a; text-align: center; padding: 2rem;">No hay reservas registradas aún.</p>`;
    return;
  }

  reservationsListEl.innerHTML = state.reservations.map(res => `
    <div class="res-item">
      <div class="res-info">
        <h4>${res.name} — Mesa ${res.tableId} (${res.zoneLabel})</h4>
        <p>${res.date} a las ${res.time} hs • ${res.guests} personas • Cód: #${res.code}</p>
      </div>
      <button type="button" class="btn-cancel" data-code="${res.code}">Cancelar</button>
    </div>
  `).join('');
}

initReservations();