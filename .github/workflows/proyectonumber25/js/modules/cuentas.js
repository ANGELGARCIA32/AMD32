// js/modules/cuentas.js

import { state, saveState } from '../store.js';
import { openModal, closeModals, showToast } from '../ui.js';
import { formatCurrency } from '../utils.js';

// --- Elementos del DOM ---
const cuentasContainer = document.getElementById('cuentas-container');
const btnNuevaCuenta = document.getElementById('btn-nueva-cuenta');
const formCuenta = document.getElementById('form-cuenta');
const cuentaModalTitulo = document.getElementById('cuenta-modal-titulo');
const cuentaIdInput = document.getElementById('cuenta-id');
const cuentaNombreInput = document.getElementById('cuenta-nombre');
const cuentaAliasInput = document.getElementById('cuenta-alias');
const cuentaSaldoInput = document.getElementById('cuenta-saldo');
const cuentaColorInput = document.getElementById('cuenta-color');


export function prepararModalParaCrear() {
    formCuenta.reset();
    cuentaModalTitulo.textContent = 'Nueva Cuenta Bancaria';
    cuentaIdInput.value = '';
    cuentaSaldoInput.disabled = false;
}

function saveCuenta(event) {
    event.preventDefault();
    const id = cuentaIdInput.value;
    const cuentaData = {
        nombre: cuentaNombreInput.value.trim(),
        alias: cuentaAliasInput.value.trim(),
        saldo: parseFloat(cuentaSaldoInput.value),
        color: cuentaColorInput.value
    };

    if (!cuentaData.nombre || !cuentaData.alias || isNaN(cuentaData.saldo)) {
        showToast('Por favor completa todos los campos requeridos.', 'error');
        return;
    }

    if (id) { // Editando una cuenta existente
        const index = state.cuentas.findIndex(c => c.id === id);
        if (index > -1) {
            const saldoPreservado = state.cuentas[index].saldo;
            state.cuentas[index] = { ...state.cuentas[index], nombre: cuentaData.nombre, alias: cuentaData.alias, color: cuentaData.color, id: id, saldo: saldoPreservado };
            showToast('Cuenta actualizada con éxito.', 'success');
        }
    } else { // Creando una nueva cuenta
        cuentaData.id = `cta-${Date.now()}`;
        state.cuentas.push(cuentaData);
        showToast('Cuenta creada con éxito.', 'success');
    }
    
    saveState();
    window.renderAll();
    closeModals();
}

function deleteCuenta(id) {
    if (state.movimientos.some(m => m.metodoPago === id)) {
        showToast('No se puede eliminar una cuenta con movimientos asociados.', 'error');
        return;
    }
    
    const cuenta = state.cuentas.find(c => c.id === id);
    if (confirm(`¿Estás seguro de que quieres eliminar la cuenta "${cuenta.alias}"?`)) {
        state.cuentas = state.cuentas.filter(c => c.id !== id);
        saveState();
        renderCuentas();
        showToast('Cuenta eliminada.', 'info');
    }
}

// ---> FUNCIÓN DE RENDERIZADO COMPLETAMENTE REDISEÑADA PARA ANÁLISIS
export function renderCuentas() {
    if (!cuentasContainer) return;

    const cuentasHTML = state.cuentas.map(cuenta => {
        const saldoNegativoClass = cuenta.saldo < 0 ? 'negative-balance' : '';
        
        // --- Lógica de Análisis para la tarjeta ---
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const añoActual = ahora.getFullYear();

        const movimientosCuenta = state.movimientos.filter(m => m.metodoPago === cuenta.id && new Date(m.fecha).getMonth() === mesActual && new Date(m.fecha).getFullYear() === añoActual);
        
        const ingresos = movimientosCuenta.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
        const egresos = movimientosCuenta.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);

        return `
            <div class="cuenta-card-wrapper">
                <div class="cuenta-card" style="--glow-color: ${cuenta.color};">
                    <div class="cuenta-card-header">
                        <span class="cuenta-nombre">${cuenta.nombre}</span>
                        <div class="card-actions">
                            <button class="edit-cuenta" data-id="${cuenta.id}" aria-label="Editar cuenta"><i class="fas fa-edit"></i></button>
                            <button class="delete-cuenta" data-id="${cuenta.id}" aria-label="Eliminar cuenta"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                    <div class="cuenta-card-body">
                        <p class="cuenta-alias">${cuenta.alias}</p>
                        <p class="cuenta-saldo ${saldoNegativoClass}">${formatCurrency(cuenta.saldo)}</p>
                    </div>
                    <div class="cuenta-card-stats">
                        <div class="stat-item">
                            <span class="stat-label">Ingresos (mes)</span>
                            <span class="stat-value ingreso">+${formatCurrency(ingresos)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Egresos (mes)</span>
                            <span class="stat-value egreso">-${formatCurrency(egresos)}</span>
                        </div>
                    </div>
                    <div class="cuenta-card-footer">
                        <button class="btn-secondary view-movimientos" data-id="${cuenta.id}">Ver Movimientos</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const addCuentaHTML = `
        <div class="cuenta-card-wrapper">
            <button class="add-cuenta-card" aria-label="Añadir nueva cuenta">
                <i class="fas fa-plus"></i>
                <span>Añadir Cuenta</span>
            </button>
        </div>
    `;

    cuentasContainer.innerHTML = cuentasHTML + addCuentaHTML;

    if (state.cuentas.length === 0) {
        // ... (código de estado vacío sin cambios)
    }
}

export function initCuentas() {
    if (!btnNuevaCuenta) return;

    btnNuevaCuenta.addEventListener('click', () => {
        prepararModalParaCrear();
        openModal('modal-cuenta');
    });

    formCuenta.addEventListener('submit', saveCuenta);

    cuentasContainer.addEventListener('click', e => {
        const editBtn = e.target.closest('.edit-cuenta');
        const deleteBtn = e.target.closest('.delete-cuenta');
        const addCardBtn = e.target.closest('.add-cuenta-card');
        const addFirstBtn = e.target.closest('#btn-add-first-cuenta');
        const viewMovimientosBtn = e.target.closest('.view-movimientos'); // ---> NUEVO

        if (editBtn) {
            // ... (código de editar sin cambios)
        }

        if (deleteBtn) {
            deleteCuenta(deleteBtn.dataset.id);
        }

        if (addCardBtn || addFirstBtn) {
            prepararModalParaCrear();
            openModal('modal-cuenta');
        }

        // ---> NUEVO: Lógica para el botón "Ver Movimientos"
        if (viewMovimientosBtn) {
            const cuentaId = viewMovimientosBtn.dataset.id;
            // Guardamos el filtro en el estado para que el módulo de movimientos lo use
            state.filtroMovimientosCuenta = cuentaId;
            // Navegamos a la sección de movimientos
            window.location.hash = '#movimientos';
        }
    });
}
