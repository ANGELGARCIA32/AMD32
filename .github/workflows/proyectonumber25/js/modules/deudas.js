// js/modules/deudas.js

import { state, saveState } from '../store.js';
import { openModal, closeModals, showToast } from '../ui.js';
import { formatCurrency, populateMetodoPagoSelects } from '../utils.js';

// --- Elementos del DOM ---
const deudasContainer = document.getElementById('deudas-container');
const deudasSummaryContainer = document.getElementById('deudas-summary-container'); // Se añade el contenedor del resumen
const btnNuevaDeuda = document.getElementById('btn-nueva-deuda');
const formDeuda = document.getElementById('form-deuda');
const deudaModalTitulo = document.getElementById('deuda-modal-titulo');
const deudaIdInput = document.getElementById('deuda-id');
const formPagoDeuda = document.getElementById('form-pago-deuda');
const pagoDeudaIdInput = document.getElementById('pago-deuda-id');
const pagoDeudaTitulo = document.getElementById('pago-deuda-titulo');

/**
 * Prepara el modal para crear una nueva deuda.
 */
function prepararModalParaCrear() {
    if (formDeuda) formDeuda.reset();
    if (deudaModalTitulo) deudaModalTitulo.textContent = 'Nueva Deuda';
    if (deudaIdInput) deudaIdInput.value = '';
}

/**
 * Guarda o actualiza una deuda.
 */
function saveDeuda(event) {
    event.preventDefault();
    const id = deudaIdInput.value;
    // Se corrige para leer solo los campos que existen en el HTML
    const data = {
        descripcion: document.getElementById('deuda-descripcion').value.trim(),
        montoTotal: parseFloat(document.getElementById('deuda-monto').value),
        plazo: parseInt(document.getElementById('deuda-plazo').value) || null,
        pagoMinimo: parseFloat(document.getElementById('deuda-pago-minimo').value) || null,
    };

    if (!data.descripcion || isNaN(data.montoTotal) || data.montoTotal <= 0) {
        showToast('La descripción y el monto total son obligatorios.', 'error');
        return;
    }

    if (id) { // Editando
        const index = state.deudas.findIndex(d => d.id === id);
        if (index > -1) {
            state.deudas[index] = { ...state.deudas[index], ...data };
            showToast('Deuda actualizada.', 'success');
        }
    } else { // Creando
        data.id = `deuda-${Date.now()}`;
        data.montoPagado = 0;
        state.deudas.push(data);
        showToast('Deuda añadida.', 'success');
    }

    saveState();
    renderDeudas();
    closeModals();
}

/**
 * Registra un pago a una deuda específica.
 */
function registrarPagoDeuda(event) {
    event.preventDefault();
    const deudaId = pagoDeudaIdInput.value;
    const montoPagado = parseFloat(document.getElementById('pago-deuda-monto').value);
    const metodoPago = document.getElementById('metodo-pago-deuda').value;

    if (isNaN(montoPagado) || montoPagado <= 0) {
        showToast('El monto del pago debe ser un número válido.', 'error');
        return;
    }

    const deudaIndex = state.deudas.findIndex(d => d.id === deudaId);
    if (deudaIndex === -1) return;

    state.deudas[deudaIndex].montoPagado += montoPagado;

    const nuevoMovimiento = {
        id: `mov-${Date.now()}`,
        descripcion: `Pago de deuda: ${state.deudas[deudaIndex].descripcion}`,
        monto: montoPagado,
        tipo: 'egreso',
        metodoPago: metodoPago,
        categoria: 'pago deuda',
        fecha: new Date().toISOString()
    };
    state.movimientos.push(nuevoMovimiento);

    if (metodoPago !== 'efectivo') {
        const cuentaIndex = state.cuentas.findIndex(c => c.id === metodoPago);
        if (cuentaIndex > -1) {
            state.cuentas[cuentaIndex].saldo -= montoPagado;
        }
    }
    
    saveState();
    window.renderAll();
    closeModals();
    showToast('Pago registrado con éxito.', 'success');
}

/**
 * Elimina una deuda.
 */
function deleteDeuda(id) {
    const deuda = state.deudas.find(d => d.id === id);
    if (deuda.montoPagado > 0) {
        showToast('No se puede eliminar una deuda que ya tiene pagos registrados.', 'error');
        return;
    }
    if (confirm(`¿Seguro que quieres eliminar la deuda "${deuda.descripcion}"?`)) {
        state.deudas = state.deudas.filter(d => d.id !== id);
        saveState();
        renderDeudas();
        showToast('Deuda eliminada.', 'info');
    }
}

// ---> FUNCIÓN AÑADIDA PARA EL RESUMEN
/**
 * Calcula y muestra la tarjeta de resumen general de deudas.
 */
function renderDeudasSummary() {
    if (!deudasSummaryContainer) return;

    const totalDeuda = state.deudas.reduce((sum, d) => sum + d.montoTotal, 0);
    const totalPagado = state.deudas.reduce((sum, d) => sum + d.montoPagado, 0);
    const saldoPendienteTotal = totalDeuda - totalPagado;
    const porcentajeGeneralPagado = totalDeuda > 0 ? (totalPagado / totalDeuda) * 100 : 0;

    deudasSummaryContainer.innerHTML = `
        <div class="card summary-card-v2">
            <div class="summary-item">
                <span>Deuda Total</span>
                <p>${formatCurrency(totalDeuda)}</p>
            </div>
            <div class="summary-item">
                <span>Total Pagado</span>
                <p class="text-green-500">${formatCurrency(totalPagado)}</p>
            </div>
            <div class="summary-item">
                <span>Saldo Pendiente</span>
                <p class="text-red-500">${formatCurrency(saldoPendienteTotal)}</p>
            </div>
            <div class="summary-progress">
                <span>Progreso General</span>
                <div class="progress-bar-v2 mt-2">
                    <div class="progress normal" style="width: ${porcentajeGeneralPagado}%;"></div>
                </div>
            </div>
        </div>
    `;
}


/**
 * Dibuja las tarjetas de deudas y el resumen.
 */
export function renderDeudas() {
    if (!deudasContainer) return;
    
    renderDeudasSummary(); // Se llama a la nueva función de resumen

    if (!state.deudas || state.deudas.length === 0) {
        deudasContainer.innerHTML = '<p class="empty-state">No tienes deudas registradas.</p>';
        return;
    }

    deudasContainer.innerHTML = state.deudas.map(deuda => {
        const saldoPendiente = deuda.montoTotal - deuda.montoPagado;
        const porcentajePagado = deuda.montoTotal > 0 ? (deuda.montoPagado / deuda.montoTotal) * 100 : 0;
        
        let progressColor = '#dc3545'; // Rojo
        if (porcentajePagado > 60) progressColor = '#0d6efd'; // Azul
        else if (porcentajePagado > 25) progressColor = '#ffc107'; // Amarillo

        return `
            <div class="deuda-card-v2">
                <div class="deuda-card-header">
                    <h3>${deuda.descripcion}</h3>
                    <div class="card-actions">
                        <button class="edit-deuda" data-id="${deuda.id}" aria-label="Editar"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-deuda" data-id="${deuda.id}" aria-label="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="deuda-card-body">
                    <div class="deuda-progress-chart" style="--progress-color: ${progressColor}; --progress-value: ${porcentajePagado}%">
                        <div class="progress-inner-circle">
                            <span class="progress-percentage">${Math.round(porcentajePagado)}%</span>
                            <span class="progress-label">Pagado</span>
                        </div>
                    </div>
                    <div class="deuda-info">
                        <div class="info-item">
                            <span>Saldo Pendiente</span>
                            <p>${formatCurrency(saldoPendiente)}</p>
                        </div>
                        <div class="info-item">
                            <span>Monto Total</span>
                            <p>${formatCurrency(deuda.montoTotal)}</p>
                        </div>
                    </div>
                </div>
                <div class="deuda-card-footer">
                    <button class="btn-primary registrar-pago" data-id="${deuda.id}">+ Registrar Pago</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Inicializa los listeners para la sección de deudas.
 */
export function initDeudas() {
    if (!btnNuevaDeuda || !deudasContainer) return;
    
    btnNuevaDeuda.addEventListener('click', () => {
        prepararModalParaCrear();
        openModal('modal-deuda');
    });

    if (formDeuda) formDeuda.addEventListener('submit', saveDeuda);
    if (formPagoDeuda) formPagoDeuda.addEventListener('submit', registrarPagoDeuda);

    deudasContainer.addEventListener('click', e => {
        const editBtn = e.target.closest('.edit-deuda');
        const deleteBtn = e.target.closest('.delete-deuda');
        const pagoBtn = e.target.closest('.registrar-pago');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const deuda = state.deudas.find(d => d.id === id);
            if (!deuda) return;
            
            deudaModalTitulo.textContent = 'Editar Deuda';
            deudaIdInput.value = deuda.id;
            document.getElementById('deuda-descripcion').value = deuda.descripcion;
            document.getElementById('deuda-monto').value = deuda.montoTotal;
            document.getElementById('deuda-plazo').value = deuda.plazo || '';
            document.getElementById('deuda-pago-minimo').value = deuda.pagoMinimo || '';

            openModal('modal-deuda');
        }

        if (deleteBtn) {
            deleteDeuda(deleteBtn.dataset.id);
        }

        if (pagoBtn) {
            const id = pagoBtn.dataset.id;
            const deuda = state.deudas.find(d => d.id === id);
            if (!deuda) return;
            
            pagoDeudaTitulo.textContent = `Registrar Pago a: ${deuda.descripcion}`;
            pagoDeudaIdInput.value = id;
            document.getElementById('form-pago-deuda').reset();
            populateMetodoPagoSelects('metodo-pago-deuda');
            openModal('modal-pago-deuda');
        }
    });
}
