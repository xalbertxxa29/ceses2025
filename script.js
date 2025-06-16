(() => {
  'use strict';

  // --- Constantes y Referencias al DOM ---
  const API_URL = 'https://script.google.com/macros/s/AKfycbwpxr9jTRb_KjlKJVb0VdcVjoV9o8xXX-BCOrI6f4EkJJBOdYXLIDvSSpph3TPyYqVdmQ/exec';
  const form = document.getElementById('searchForm');
  const inp = document.getElementById('dniInput');
  const msg = document.getElementById('message');
  const overlay = document.getElementById('overlay');
  
  const formView = document.getElementById('form-view');
  const resultView = document.getElementById('result-view');
  const tableWrapper = resultView.querySelector('.table-wrapper');
  const resetBtn = document.getElementById('btn-reset');

  // --- Lógica para alternar vistas ---
  function showView(viewName) {
    if (viewName === 'results') {
      formView.style.display = 'none';
      resultView.style.display = 'block';
    } else {
      resultView.style.display = 'none';
      formView.style.display = 'block';
    }
  }
  
  // --- Efecto 3D Tilt ---
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const strength = 8; // Efecto más sutil
    card.addEventListener('mousemove', e => {
      const { width, height, left, top } = card.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      const rotateY = ((x / width) - 0.5) * strength;
      const rotateX = ((y / height) - 0.5) * -strength;
      card.style.setProperty('--rotateX', `${rotateX}deg`);
      card.style.setProperty('--rotateY', `${rotateY}deg`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rotateX', '0deg');
      card.style.setProperty('--rotateY', '0deg');
    });
  });

  // --- Funciones de UI ---
  function showMessage(text, type = '') {
    msg.textContent = text;
    msg.className = `message ${type}`.trim();
  }

  function clearResult() {
    tableWrapper.innerHTML = '';
    showMessage('');
  }

  function renderTable(record) {
    clearResult();
    if (!record) {
      showMessage('No se encontró ningún registro para el DNI proporcionado.', 'error');
      showView('form'); // Si no hay resultados, vuelve al formulario
      return;
    }
    
    // ================================================================= //
    // === INICIO DE LA CORRECCIÓN: Añadido "date: true" a las líneas === //
    // ================================================================= //
    const mappings = [
      { header: 'Apellidos y Nombres', key: 'APELLIDOS Y NOMBRES' },
      { header: 'Fecha de Cese', key: 'FECHA DE CESE', date: true },
      { header: 'Cese SUCAMEC', key: 'FECHA DE REPORTE CESE SUCAMEC', date: true },
      { header: 'Correo', key: 'CORREO' },
      { header: 'Cert. Trabajo', key: 'CERTIFICADO DE TRABAJO', date: true }, // <-- CORREGIDO
      { header: 'Pago Liquidación', key: 'ENVIO A PLANILLAS PARA PAGO DE LBS', date: true }, // <-- CORREGIDO
      { header: 'Estado', key: 'ESTADO' }
    ];
    // ================================================================= //
    // ====================== FIN DE LA CORRECCIÓN ===================== //
    // ================================================================= //

    const table = document.createElement('table');
    table.className = 'result-table';
    
    // Crear encabezados
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    mappings.forEach(m => {
      const th = document.createElement('th');
      th.textContent = m.header;
      headerRow.appendChild(th);
    });

    // Crear cuerpo de la tabla
    const tbody = table.createTBody();
    const row = tbody.insertRow();
    mappings.forEach(m => {
      const cell = row.insertCell();
      const rawValue = record[m.key];
      // Formatear fecha si es necesario, de lo contrario mostrar valor o guion
      if (m.date && rawValue) {
        const d = new Date(rawValue);
        cell.textContent = !isNaN(d) ? d.toLocaleDateString('es-PE', { timeZone: 'UTC' }) : 'Fecha inválida';
      } else {
        cell.textContent = rawValue != null && rawValue !== '' ? rawValue : '–';
      }
    });

    tableWrapper.appendChild(table);
    showView('results'); // Muestra la vista de resultados
  }

  // --- Lógica Principal ---
  async function fetchAndRender(dni) {
    clearResult();
    overlay.classList.add('active');
    showMessage('Buscando, por favor espere...');

    try {
      const res = await fetch(`${API_URL}?dni=${encodeURIComponent(dni)}`);
      if (!res.ok) throw new Error(`Error de red: ${res.status}`);
      const data = await res.json();
      // Asumimos que la API devuelve un array y tomamos el último registro si hay varios
      const record = Array.isArray(data) && data.length ? data[data.length - 1] : null;
      renderTable(record);
    } catch (err) {
      console.error(err);
      clearResult();
      showMessage(`Error al cargar los datos. Intente de nuevo.`, 'error');
      showView('form'); // Vuelve al form en caso de error
    } finally {
      overlay.classList.remove('active');
    }
  }
  
  // --- Carrusel de Fondo ---
  const slides = document.querySelectorAll('.bg-carousel .slide');
  if (slides.length > 0) {
      let idx = 0;
      slides[idx].classList.add('active');
      setInterval(() => {
          slides[idx].classList.remove('active');
          idx = (idx + 1) % slides.length;
          slides[idx].classList.add('active');
      }, 5000);
  }

  // --- Event Listeners ---
  form.addEventListener('submit', e => {
    e.preventDefault();
    const dni = inp.value.trim();
    if (!/^\d{8}$/.test(dni)) {
      showMessage('Por favor, ingrese un DNI válido de 8 dígitos.', 'error');
      return;
    }
    fetchAndRender(dni);
  });

  resetBtn.addEventListener('click', () => {
    inp.value = '';
    clearResult();
    showView('form'); // Muestra la vista del formulario
    inp.focus();
  });
})();