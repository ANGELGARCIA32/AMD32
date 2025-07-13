// js/modules/suscripciones.js

import { state, saveState } from '../store.js';
import { openModal, closeModals, showToast } from '../ui.js';
import { formatCurrency, getMetodoPagoNombre, populateMetodoPagoSelects, getServicioIcon } from '../utils.js';

// --- Elementos del DOM ---
const suscripcionesContainer = document.getElementById('suscripciones-container');
const btnNuevaSuscripcion = document.getElementById('btn-nueva-suscripcion');
const formSuscripcion = document.getElementById('form-suscripcion');
const suscripcionModalTitulo = document.getElementById('suscripcion-modal-titulo');
const suscripcionIdInput = document.getElementById('suscripcion-id');

function prepararModalParaCrear() {
    formSuscripcion.reset();
    suscripcionModalTitulo.textContent = 'Nueva Suscripción';
    suscripcionIdInput.value = '';
    populateMetodoPagoSelects('metodo-pago-suscripcion');
}

function saveSuscripcion(event) {
    event.preventDefault();
    const id = suscripcionIdInput.value;
    const data = {
        nombre: document.getElementById('suscripcion-nombre').value.trim(),
        monto: parseFloat(document.getElementById('suscripcion-monto').value),
        fechaCorte: parseInt(document.getElementById('suscripcion-fecha-corte').value),
        metodoPago: document.getElementById('metodo-pago-suscripcion').value
    };

    if (!data.nombre || isNaN(data.monto) || data.monto <= 0 || isNaN(data.fechaCorte) || data.fechaCorte < 1 || data.fechaCorte > 31) {
        showToast('Por favor, completa todos los campos correctamente.', 'error');
        return;
    }

    if (id) { // Editando
        const index = state.suscripciones.findIndex(s => s.id === id);
        if (index > -1) {
            state.suscripciones[index] = { ...state.suscripciones[index], ...data };
            showToast('Suscripción actualizada.', 'success');
        }
    } else { // Creando
        data.id = `sub-${Date.now()}`;
        state.suscripciones.push(data);
        showToast('Suscripción añadida.', 'success');
    }

    saveState();
    renderSuscripciones();
    closeModals();
}

function deleteSuscripcion(id) {
    const sub = state.suscripciones.find(s => s.id === id);
    if (confirm(`¿Seguro que quieres eliminar la suscripción "${sub.nombre}"?`)) {
        state.suscripciones = state.suscripciones.filter(s => s.id !== id);
        saveState();
        renderSuscripciones();
        showToast('Suscripción eliminada.', 'info');
    }
}

// ---> NUEVA FUNCIÓN DE LÓGICA
/**
 * Calcula la próxima fecha de pago y los días restantes.
 * @param {number} diaDeCorte - El día del mes (1-31) que se realiza el cobro.
 * @returns {object} - Un objeto con la fecha del próximo pago y los días restantes.
 */
function getInfoProximoPago(diaDeCorte) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar a la medianoche para comparaciones precisas
    let proximoPago = new Date(hoy.getFullYear(), hoy.getMonth(), diaDeCorte);

    if (hoy.getDate() > diaDeCorte) {
        proximoPago.setMonth(proximoPago.getMonth() + 1);
    }
    
    // Calcula la diferencia en milisegundos y la convierte a días
    const diffTime = proximoPago - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        fecha: proximoPago.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
        diasRestantes: diffDays
    };
}

// ---> FUNCIÓN DE RENDERIZADO COMPLETAMENTE REDISEÑADA
export function renderSuscripciones() {
    if (!suscripcionesContainer) return;

    if (!state.suscripciones || state.suscripciones.length === 0) {
        suscripcionesContainer.innerHTML = '<p class="empty-state">No tienes suscripciones registradas.</p>'; // Se puede mejorar con un SVG como en Cuentas
        return;
    }

    suscripcionesContainer.innerHTML = state.suscripciones.map(sub => {
        const { fecha, diasRestantes } = getInfoProximoPago(sub.fechaCorte);
        
        let statusClass = 'status-ok';
        if (diasRestantes <= 3) statusClass = 'status-danger';
        else if (diasRestantes <= 7) statusClass = 'status-warning';

        return `
            <div class="suscripcion-card">
                <div class="suscripcion-icon">
                    <i class="fas ${getServicioIcon(sub.nombre)}"></i>
                </div>
                <div class="suscripcion-info">
                    <h4>${sub.nombre}</h4>
                    <p class="suscripcion-monto">${formatCurrency(sub.monto)} / mensual</p>
                    <span class="suscripcion-metodo">Pagado con: ${getMetodoPagoNombre(sub.metodoPago)}</span>
                </div>
                <div class="suscripcion-status">
                    <div class="status-dot ${statusClass}"></div>
                    <p>Próximo pago en <strong>${diasRestantes} días</strong></p>
                    <span>${fecha}</span>
                </div>
                <div class="card-actions">
                    <button class="edit-suscripcion" data-id="${sub.id}" aria-label="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button class="delete-suscripcion" data-id="${sub.id}" aria-label="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

export function initSuscripciones() {
    if (!btnNuevaSuscripcion) return;

    btnNuevaSuscripcion.addEventListener('click', () => {
        prepararModalParaCrear();
        openModal('modal-suscripcion');
    });

    formSuscripcion.addEventListener('submit', saveSuscripcion);

    suscripcionesContainer.addEventListener('click', e => {
        const editBtn = e.target.closest('.edit-suscripcion');
        const deleteBtn = e.target.closest('.delete-suscripcion');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const sub = state.suscripciones.find(s => s.id === id);
            
            suscripcionModalTitulo.textContent = 'Editar Suscripción';
            suscripcionIdInput.value = sub.id;
            document.getElementById('suscripcion-nombre').value = sub.nombre;
            document.getElementById('suscripcion-monto').value = sub.monto;
            document.getElementById('suscripcion-fecha-corte').value = sub.fechaCorte;
            populateMetodoPagoSelects('metodo-pago-suscripcion', sub.metodoPago);
            
            openModal('modal-suscripcion');
        }

        if (deleteBtn) {
            deleteSuscripcion(deleteBtn.dataset.id);
        }
    });
}
