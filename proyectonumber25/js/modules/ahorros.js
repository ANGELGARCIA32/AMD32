// js/modules/ahorros.js

import { state, saveState } from '../store.js';
import { openModal, closeModals, showToast } from '../ui.js';
import { formatCurrency, populateMetodoPagoSelects, getServicioIcon } from '../utils.js';

// --- Elementos del DOM ---
const ahorrosContainer = document.getElementById('ahorros-container');
const btnNuevaMeta = document.getElementById('btn-nueva-meta');
const formAhorro = document.getElementById('form-ahorro');
const formAporteAhorro = document.getElementById('form-aporte-ahorro');
const aporteAhorroTitulo = document.getElementById('aporte-ahorro-titulo');
const aporteAhorroIdInput = document.getElementById('aporte-ahorro-id');

/**
 * Prepara el modal para crear una nueva meta de ahorro.
 */
function prepararModalParaCrear() {
    if (formAhorro) formAhorro.reset();
    const ahorroIdInput = document.getElementById('ahorro-id');
    if (ahorroIdInput) ahorroIdInput.value = '';
    const ahorroActualInput = document.getElementById('ahorro-actual');
    if (ahorroActualInput) ahorroActualInput.disabled = false;
    const modalTitle = document.querySelector('#modal-ahorro h3');
    if(modalTitle) modalTitle.textContent = 'Nueva Meta de Ahorro';
}

/**
 * Guarda o actualiza una meta de ahorro.
 */
function saveAhorro(event) {
    event.preventDefault();
    const id = document.getElementById('ahorro-id').value;
    const data = {
        nombre: document.getElementById('ahorro-nombre').value.trim(),
        montoMeta: parseFloat(document.getElementById('ahorro-meta').value),
        montoActual: parseFloat(document.getElementById('ahorro-actual').value) || 0
    };

    if (!data.nombre || isNaN(data.montoMeta) || data.montoMeta <= 0) {
        showToast('El nombre y el monto objetivo son obligatorios.', 'error');
        return;
    }

    if (id) { // Editando
        const index = state.ahorros.findIndex(a => a.id === id);
        if (index > -1) {
            state.ahorros[index].nombre = data.nombre;
            state.ahorros[index].montoMeta = data.montoMeta;
            showToast('Meta de ahorro actualizada.', 'success');
        }
    } else { // Creando
        data.id = `ahorro-${Date.now()}`;
        state.ahorros.push(data);
        showToast('Meta de ahorro creada.', 'success');
    }

    saveState();
    renderAhorros();
    closeModals();
}

/**
 * Guarda un aporte a una meta de ahorro.
 */
function saveAporte(event) {
    event.preventDefault();
    const metaId = aporteAhorroIdInput.value;
    const montoAporte = parseFloat(document.getElementById('aporte-ahorro-monto').value);
    const metodoPago = document.getElementById('metodo-pago-aporte').value;

    if (isNaN(montoAporte) || montoAporte <= 0) {
        showToast('Ingresa un monto válido para el aporte.', 'error');
        return;
    }

    const metaIndex = state.ahorros.findIndex(a => a.id === metaId);
    if (metaIndex === -1) return;

    state.ahorros[metaIndex].montoActual += montoAporte;

    const nuevoMovimiento = {
        id: `mov-${Date.now()}`,
        descripcion: `Aporte a meta: ${state.ahorros[metaIndex].nombre}`,
        monto: montoAporte,
        tipo: 'egreso',
        metodoPago: metodoPago,
        categoria: 'ahorro',
        fecha: new Date().toISOString()
    };
    state.movimientos.push(nuevoMovimiento);

    if (metodoPago !== 'efectivo') {
        const cuentaIndex = state.cuentas.findIndex(c => c.id === metodoPago);
        if (cuentaIndex > -1) {
            state.cuentas[cuentaIndex].saldo -= montoAporte;
        }
    }

    saveState();
    window.renderAll();
    closeModals();
    showToast('Aporte registrado con éxito.', 'success');
}

/**
 * Elimina una meta de ahorro.
 */
function deleteAhorro(id) {
    const meta = state.ahorros.find(a => a.id === id);
    if (confirm(`¿Seguro que quieres eliminar la meta "${meta.nombre}"? Esto no afectará los movimientos ya realizados.`)) {
        state.ahorros = state.ahorros.filter(a => a.id !== id);
        saveState();
        renderAhorros();
        showToast('Meta eliminada.', 'info');
    }
}

/**
 * Dibuja las tarjetas de metas de ahorro con el nuevo diseño.
 */
export function renderAhorros() {
    if (!ahorrosContainer) return;
    if (!state.ahorros || state.ahorros.length === 0) {
        ahorrosContainer.innerHTML = '<p class="empty-state">No tienes metas de ahorro. ¡Crea una para empezar a planificar!</p>';
        return;
    }

    ahorrosContainer.innerHTML = state.ahorros.map(meta => {
        const porcentaje = meta.montoMeta > 0 ? Math.min((meta.montoActual / meta.montoMeta) * 100, 100) : 0;
        const restante = meta.montoMeta - meta.montoActual;

        return `
            <div class="ahorro-card-v2">
                <div class="ahorro-card-header">
                    <div class="ahorro-icon">
                        <i class="fas ${getServicioIcon(meta.nombre)}"></i>
                    </div>
                    <div class="ahorro-title">
                        <h3>${meta.nombre}</h3>
                        <span>Meta: ${formatCurrency(meta.montoMeta)}</span>
                    </div>
                    <div class="card-actions">
                         <button class="edit-ahorro" data-id="${meta.id}" aria-label="Editar meta"><i class="fas fa-pencil-alt"></i></button>
                         <button class="delete-ahorro" data-id="${meta.id}" aria-label="Eliminar meta"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="ahorro-card-body">
                    <div class="ahorro-progreso-info">
                        <span class="ahorro-actual">${formatCurrency(meta.montoActual)}</span>
                        <span class="ahorro-porcentaje">${Math.round(porcentaje)}%</span>
                    </div>
                    <div class="progress-bar-v3">
                        <div class="progress" style="width: ${porcentaje}%;"></div>
                    </div>
                    <p class="ahorro-restante">Te faltan ${formatCurrency(restante > 0 ? restante : 0)} para alcanzar tu meta.</p>
                </div>
                <div class="ahorro-card-footer">
                    <button class="btn-primary add-aporte" data-id="${meta.id}">+ Añadir Aporte</button>
                </div>
            </div>
        `;
    }).join('');
}


/**
 * Inicializa los listeners para la sección de ahorros.
 */
export function initAhorros() {
    if (!btnNuevaMeta || !ahorrosContainer) return;

    btnNuevaMeta.addEventListener('click', () => {
        prepararModalParaCrear();
        openModal('modal-ahorro');
    });

    if (formAhorro) formAhorro.addEventListener('submit', saveAhorro);
    if (formAporteAhorro) formAporteAhorro.addEventListener('submit', saveAporte);

    ahorrosContainer.addEventListener('click', e => {
        const editBtn = e.target.closest('.edit-ahorro');
        const deleteBtn = e.target.closest('.delete-ahorro');
        const aporteBtn = e.target.closest('.add-aporte');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const meta = state.ahorros.find(a => a.id === id);
            if (!meta) return;

            const modalTitle = document.querySelector('#modal-ahorro h3');
            if(modalTitle) modalTitle.textContent = 'Editar Meta de Ahorro';
            document.getElementById('ahorro-id').value = meta.id;
            document.getElementById('ahorro-nombre').value = meta.nombre;
            document.getElementById('ahorro-meta').value = meta.montoMeta;
            document.getElementById('ahorro-actual').value = meta.montoActual;
            document.getElementById('ahorro-actual').disabled = true;
            openModal('modal-ahorro');
        }

        if (deleteBtn) {
            deleteAhorro(deleteBtn.dataset.id);
        }

        if (aporteBtn) {
            const id = aporteBtn.dataset.id;
            const meta = state.ahorros.find(a => a.id === id);
            if (!meta) return;

            // Verificación de que el modal existe
            const modalAporte = document.getElementById('modal-aporte-ahorro');
            if (!modalAporte || !aporteAhorroTitulo || !aporteAhorroIdInput) {
                console.error("El modal de aporte de ahorro no se encuentra en index.html.");
                showToast("Error: No se puede abrir la ventana de aportes.", "error");
                return;
            }

            aporteAhorroTitulo.textContent = `Añadir Aporte a: ${meta.nombre}`;
            aporteAhorroIdInput.value = id;
            if (formAporteAhorro) formAporteAhorro.reset();
            populateMetodoPagoSelects('metodo-pago-aporte');
            openModal('modal-aporte-ahorro');
        }
    });
}
