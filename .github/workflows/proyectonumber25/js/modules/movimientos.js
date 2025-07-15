// js/modules/movimientos.js

import { state, saveState } from '../store.js';
import { openModal, closeModals, showToast } from '../ui.js';
import { formatCurrency, getCategoryIcon, getMetodoPagoNombre, populateMetodoPagoSelects } from '../utils.js';

// --- Elementos del DOM ---
const movimientosContainer = document.getElementById('movimientos-lista');
const btnNuevoMovimiento = document.getElementById('btn-nuevo-movimiento');
const formMovimiento = document.getElementById('form-movimiento');
const movimientoIdInput = document.getElementById('movimiento-id');

/**
 * Prepara y abre el modal para crear un nuevo movimiento.
 * Esta es la función centralizada y segura que se usará en toda la app.
 */
export function openNuevoMovimientoModal() {
    if (formMovimiento) formMovimiento.reset();
    if (movimientoIdInput) movimientoIdInput.value = '';
    const modalTitle = document.querySelector('#modal-movimiento h3');
    if(modalTitle) modalTitle.textContent = 'Nuevo Movimiento';
    
    // Paso CRÍTICO: Rellena el select con las cuentas actualizadas ANTES de abrir.
    populateMetodoPagoSelects('metodo-pago-movimiento');
    
    openModal('modal-movimiento');
}

/**
 * Aplica o revierte el monto de un movimiento en el saldo de una cuenta.
 * @param {object} movimiento - El objeto del movimiento.
 * @param {string} accion - 'aplicar' o 'revertir'.
 */
function actualizarSaldoCuenta(movimiento, accion = 'aplicar') {
    if (movimiento.metodoPago === 'efectivo') return;

    const cuentaIndex = state.cuentas.findIndex(c => c.id === movimiento.metodoPago);
    if (cuentaIndex === -1) return;

    let monto = movimiento.monto;
    if (accion === 'revertir') {
        monto = -monto; // Invierte el monto para la reversión
    }

    if (movimiento.tipo === 'ingreso') {
        state.cuentas[cuentaIndex].saldo += monto;
    } else {
        state.cuentas[cuentaIndex].saldo -= monto;
    }
}

/**
 * Guarda un movimiento nuevo o actualiza uno existente.
 */
function saveMovimiento(event) {
    event.preventDefault();
    const id = movimientoIdInput.value;
    const data = {
        descripcion: document.getElementById('descripcion-movimiento').value.trim(),
        monto: parseFloat(document.getElementById('monto-movimiento').value),
        tipo: document.getElementById('tipo-movimiento').value,
        metodoPago: document.getElementById('metodo-pago-movimiento').value,
        categoria: document.getElementById('categoria-movimiento').value,
    };

    if (!data.descripcion || isNaN(data.monto) || data.monto <= 0) {
        showToast('Por favor completa los campos correctamente.', 'error');
        return;
    }

    if (id) { // Editando
        const index = state.movimientos.findIndex(m => m.id === id);
        if (index > -1) {
            actualizarSaldoCuenta(state.movimientos[index], 'revertir'); // Revierte el monto antiguo
            data.fecha = state.movimientos[index].fecha; // Mantiene la fecha original al editar
            state.movimientos[index] = { ...data, id };
            actualizarSaldoCuenta(data, 'aplicar'); // Aplica el monto nuevo
            showToast('Movimiento actualizado.', 'success');
        }
    } else { // Creando
        data.id = `mov-${Date.now()}`;
        data.fecha = new Date().toISOString();
        state.movimientos.push(data);
        actualizarSaldoCuenta(data, 'aplicar');
        showToast('Movimiento guardado.', 'success');
    }

    saveState();
    window.renderAll(); // Llama a la función global para actualizar todas las secciones
    closeModals();
}

/**
 * Elimina un movimiento.
 */
function deleteMovimiento(id) {
    const movIndex = state.movimientos.findIndex(m => m.id === id);
    if (movIndex === -1) return;
    
    if (confirm('¿Seguro que quieres eliminar este movimiento?')) {
        actualizarSaldoCuenta(state.movimientos[movIndex], 'revertir');
        state.movimientos.splice(movIndex, 1);
        saveState();
        window.renderAll(); // Actualiza todas las secciones
        showToast('Movimiento eliminado.', 'info');
    }
}

/**
 * Formatea una fecha para mostrarla como "Hoy", "Ayer" o la fecha completa.
 */
function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0,0,0,0);
    yesterday.setHours(0,0,0,0);
    date.setHours(0,0,0,0);

    if (date.getTime() === today.getTime()) return 'Hoy';
    if (date.getTime() === yesterday.getTime()) return 'Ayer';
    
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Dibuja la lista de movimientos agrupados por fecha.
 */
export function renderMovimientos() {
    if (!movimientosContainer) return;
    
    let movimientosAMostrar = [...state.movimientos];
    let tituloSeccion = 'Mis Movimientos';

    if (state.filtroMovimientosCuenta) {
        const cuenta = state.cuentas.find(c => c.id === state.filtroMovimientosCuenta);
        if (cuenta) {
            tituloSeccion = `Movimientos de: ${cuenta.alias}`;
            movimientosAMostrar = state.movimientos.filter(m => m.metodoPago === state.filtroMovimientosCuenta);
        }
        state.filtroMovimientosCuenta = null; 
    }

    const headerTitle = document.querySelector('#movimientos .section-header h2');
    if (headerTitle) headerTitle.textContent = tituloSeccion;

    const movimientosOrdenados = movimientosAMostrar.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (movimientosOrdenados.length === 0) {
        movimientosContainer.innerHTML = '<div class="card empty-state"><p>No hay movimientos para esta selección.</p></div>';
        return;
    }

    const grupos = movimientosOrdenados.reduce((acc, mov) => {
        const fechaRelativa = formatRelativeDate(mov.fecha);
        if (!acc[fechaRelativa]) {
            acc[fechaRelativa] = [];
        }
        acc[fechaRelativa].push(mov);
        return acc;
    }, {});

    movimientosContainer.innerHTML = Object.entries(grupos).map(([fecha, movs]) => `
        <div class="movimiento-group">
            <h4 class="movimiento-group-header">${fecha}</h4>
            ${movs.map(mov => `
                <div class="movimiento-item">
                    <div class="movimiento-icon ${mov.tipo}">
                        <i class="fas ${getCategoryIcon(mov.categoria)}"></i>
                    </div>
                    <div class="movimiento-details">
                        <p>${mov.descripcion}</p>
                        <span>${getMetodoPagoNombre(mov.metodoPago)}</span>
                    </div>
                    <div class="movimiento-monto ${mov.tipo}">
                        ${mov.tipo === 'ingreso' ? '+' : '-'}${formatCurrency(mov.monto)}
                    </div>
                    <div class="movimiento-actions">
                        <button class="edit-movimiento" data-id="${mov.id}" aria-label="Editar movimiento"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-movimiento" data-id="${mov.id}" aria-label="Eliminar movimiento"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

/**
 * Inicializa los listeners para la sección de movimientos.
 */
export function initMovimientos() {
    if (btnNuevoMovimiento) {
        btnNuevoMovimiento.addEventListener('click', openNuevoMovimientoModal);
    }
    if (formMovimiento) {
        formMovimiento.addEventListener('submit', saveMovimiento);
    }
    if (movimientosContainer) {
        movimientosContainer.addEventListener('click', e => {
            const deleteBtn = e.target.closest('.delete-movimiento');
            const editBtn = e.target.closest('.edit-movimiento');

            if (deleteBtn) {
                deleteMovimiento(deleteBtn.dataset.id);
            }
            if (editBtn) {
                const id = editBtn.dataset.id;
                const mov = state.movimientos.find(m => m.id === id);
                if (mov) {
                    const modalTitle = document.querySelector('#modal-movimiento h3');
                    if(modalTitle) modalTitle.textContent = 'Editar Movimiento';
                    movimientoIdInput.value = mov.id;
                    document.getElementById('descripcion-movimiento').value = mov.descripcion;
                    document.getElementById('monto-movimiento').value = mov.monto;
                    document.getElementById('tipo-movimiento').value = mov.tipo;
                    populateMetodoPagoSelects('metodo-pago-movimiento', mov.metodoPago);
                    document.getElementById('categoria-movimiento').value = mov.categoria;
                    openModal('modal-movimiento');
                }
            }
        });
    }
}
