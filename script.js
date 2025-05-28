(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbwpxr9jTRb_KjlKJVb0VdcVjoV9o8xXX-BCOrI6f4EkJJBOdYXLIDvSSpph3TPyYqVdmQ/exec';
  const form = document.getElementById('searchForm');
  const inp = document.getElementById('dniInput');
  const msg = document.getElementById('message');
  const wrapper = document.querySelector('.table-wrapper');
  const overlay = document.getElementById('overlay');
  const resetBtn = document.getElementById('btn-reset');

  // Tilt 3D efecto
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const strength = 15;
    card.addEventListener('mousemove', e => {
      const { width, height, left, top } = card.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      const rotateY = ((x / width) - 0.5) * strength;
      const rotateX = ((y / height) - 0.5) * -strength;
      card.style.setProperty('--rotateX', rotateX + 'deg');
      card.style.setProperty('--rotateY', rotateY + 'deg');
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rotateX', '0deg');
      card.style.setProperty('--rotateY', '0deg');
    });
  });

  function showMessage(text, type = '') {
    msg.textContent = text;
    msg.className = `message ${type}`.trim();
  }

  function clearResult() {
    wrapper.innerHTML = '';
    showMessage('');
  }

  function showSkeleton(rows = 4) {
    clearResult();
    const table = document.createElement('table');
    table.className = 'result-table visible';
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    const cols = [
      'APELLIDOS Y NOMBRES', 'MOTIVO DE CESE', 'PROGRAMACION PARA EL CESE DEL SUCAMEC',
      'CORREO AL QUE ENVIARA DOCUMENTACION', 'ENVIO DE CERTIFICADO DE TRABAJO',
      'FECHA PROGRAMADA PARA PAGO DE LIQUIDACION', 'ESTADO'
    ];
    cols.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let i = 0; i < rows; i++) {
      const tr = document.createElement('tr');
      tr.className = 'skeleton-row';
      cols.forEach(() => tr.appendChild(document.createElement('td')));
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
  }

  function formatDate(val) {
    const d = new Date(val);
    if (isNaN(d)) return val;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  function renderTable(record) {
    clearResult();
    if (!record) {
      showMessage('No se encontró ningún registro.', 'error');
      return;
    }
    showMessage('¡Registro encontrado!', 'success');
    showResultCard();

    const mappings = [
      { header: 'APELLIDOS Y NOMBRES', key: 'APELLIDOS Y NOMBRES' },
      { header: 'FECHA DE CESE', key: 'FECHA DE CESE', date: true },
      { header: 'PROGRAMACION PARA EL CESE DEL SUCAMEC', key: 'FECHA DE REPORTE CESE SUCAMEC', date: true },
      { header: 'CORREO AL QUE ENVIARA DOCUMENTACION', key: 'CORREO' },
      { header: 'ENVIO DE CERTIFICADO DE TRABAJO', key: 'CERTIFICADO DE TRABAJO', date: true },
      { header: 'FECHA PROGRAMADA PARA PAGO DE LIQUIDACION', key: 'ENVIO A PLANILLAS PARA PAGO DE LBS', date: true },
      { header: 'ESTADO', key: 'ESTADO' }
    ];

    const table = document.createElement('table');
    table.className = 'result-table visible';
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    mappings.forEach(m => {
      const th = document.createElement('th');
      th.textContent = m.header;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    mappings.forEach(m => {
      const td = document.createElement('td');
      const raw = record[m.key];
      td.textContent = m.date && raw ? formatDate(raw) : (raw != null ? raw : '');
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
    table.appendChild(tbody);
    wrapper.appendChild(table);
  }

  async function fetchAndRender(dni) {
    clearResult();
    showSkeleton();
    overlay.classList.add('active');

    try {
      const res = await fetch(`${API_URL}?dni=${encodeURIComponent(dni)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rec = Array.isArray(data) && data.length ? data[data.length - 1] : null;
      renderTable(rec);
    } catch (err) {
      console.error(err);
      clearResult();
      showMessage(`Error al cargar datos: ${err.message}`, 'error');
    } finally {
      overlay.classList.remove('active');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.bg-carousel .slide');
    let idx = 0;
    slides[idx].classList.add('active');
    setInterval(() => {
      slides[idx].classList.remove('active');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('active');
    }, 5000);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const dni = inp.value.trim();
    if (!/^\d{8}$/.test(dni)) {
      showMessage('Por favor ingresa un DNI válido (8 dígitos).', 'error');
      return;
    }
    fetchAndRender(dni);
  });

  resetBtn.addEventListener('click', () => {
    inp.value = '';
    hideResultCard();
    clearResult();
    inp.focus();
  });
})();

