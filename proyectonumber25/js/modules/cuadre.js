// js/modules/cuadre.js

import { state, saveState } from '../store.js';
import { formatCurrency, getServicioIcon } from '../utils.js'; // Usamos getServicioIcon para los íconos
import { showToast } from '../ui.js';

const cuadreContainer = document.getElementById('cuadre-container');

/**
 * Calcula el saldo actual del efectivo basado en los movimientos.
 */
function getSaldoEfectivo() {
    const ingresos = state.movimientos
        .filter(m => m.tipo === 'ingreso' && m.metodoPago === 'efectivo')
        .reduce((sum, m) => sum + m.monto, 0);
    const egresos = state.movimientos
        .filter(m => m.tipo === 'egreso' && m.metodoPago === 'efectivo')
        .reduce((sum, m) => sum + m.monto, 0);
    return ingresos - egresos;
}

/**
 * Crea un movimiento de ajuste para corregir la diferencia de saldo.
 */
function crearAjuste(idCuenta, diferencia) {
    if (diferencia === 0) return;

    const esEfectivo = idCuenta === 'efectivo';
    const tipoAjuste = diferencia > 0 ? 'ingreso' : 'egreso';
    const montoAjuste = Math.abs(diferencia);
    const nombreCuenta = esEfectivo ? 'Efectivo' : state.cuentas.find(c => c.id === idCuenta).alias;

    const nuevoMovimiento = {
        id: `mov-${Date.now()}`,
        descripcion: `Ajuste de cuadre - ${nombreCuenta}`,
        monto: montoAjuste,
        tipo: tipoAjuste,
        metodoPago: idCuenta,
        categoria: 'ajuste',
        fecha: new Date().toISOString()
    };

    if (!esEfectivo) {
        const cuentaIndex = state.cuentas.findIndex(c => c.id === idCuenta);
        if (cuentaIndex > -1) {
            state.cuentas[cuentaIndex].saldo += diferencia;
        }
    }

    state.movimientos.push(nuevoMovimiento);
    saveState();
    showToast(`Ajuste de ${formatCurrency(diferencia)} creado.`, 'success');
    renderCuadre();
    window.renderAll(); // Para actualizar el dashboard
}

// ---> FUNCIÓN DE RENDERIZADO COMPLETAMENTE REDISEÑADA
export function renderCuadre() {
    if (!cuadreContainer) return;

    const cuentaEfectivo = {
        id: 'efectivo',
        alias: 'Efectivo',
        nombre: 'Dinero en mano',
        saldo: getSaldoEfectivo(),
        color: '#28a745'
    };

    const todasLasCuentas = [cuentaEfectivo, ...state.cuentas];

    cuadreContainer.innerHTML = todasLasCuentas.map(cuenta => `
        <div class="cuadre-card-v2">
            <div class="cuadre-card-header">
                <div class="cuadre-icon" style="--glow-color: ${cuenta.color};">
                    <i class="fas ${cuenta.id === 'efectivo' ? 'fa-money-bill-wave' : 'fa-landmark'}"></i>
                </div>
                <div class="cuadre-title">
                    <h3>${cuenta.alias}</h3>
                    <span>Saldo en App: <strong>${formatCurrency(cuenta.saldo)}</strong></span>
                </div>
            </div>
            <div class="cuadre-card-body">
                <div class="cuadre-input-group">
                    <label for="real-${cuenta.id}">Ingresa Saldo Real:</label>
                    <input type="number" id="real-${cuenta.id}" placeholder="0.00" step="0.01">
                    <button class="btn-primary comparar-btn" data-id="${cuenta.id}">Comparar</button>
                </div>
            </div>
            <div class="cuadre-resultado" id="resultado-${cuenta.id}">
                <!-- El resultado de la comparación aparecerá aquí -->
            </div>
        </div>
    `).join('');
}

/**
 * Inicializa los listeners para la sección de cuadre.
 */
export function initCuadre() {
    if (!cuadreContainer) return;

    cuadreContainer.addEventListener('click', e => {
        const compararBtn = e.target.closest('.comparar-btn');
        const ajusteBtn = e.target.closest('.ajuste-btn');

        if (compararBtn) {
            const id = compararBtn.dataset.id;
            const saldoApp = id === 'efectivo' ? getSaldoEfectivo() : state.cuentas.find(c => c.id === id).saldo;
            const inputSaldoReal = document.getElementById(`real-${id}`);
            const saldoReal = parseFloat(inputSaldoReal.value);
            const resultadoEl = document.getElementById(`resultado-${id}`);

            if (isNaN(saldoReal)) {
                resultadoEl.innerHTML = '<p class="resultado-feedback error">Por favor, ingresa un número válido.</p>';
                return;
            }

            const diferencia = saldoReal - saldoApp;
            let resultadoHTML = '';

            if (Math.abs(diferencia) < 0.01) {
                resultadoHTML = `
                    <div class="resultado-feedback success">
                        <i class="fas fa-check-circle"></i>
                        <span>¡Todo cuadra perfecto!</span>
                    </div>
                `;
            } else {
                const tipoDiferencia = diferencia > 0 ? 'sobrante' : 'faltante';
                const claseColor = diferencia > 0 ? 'ingreso' : 'egreso';
                resultadoHTML = `
                    <div class="resultado-feedback ${tipoDiferencia}">
                        <i class="fas ${diferencia > 0 ? 'fa-plus-circle' : 'fa-minus-circle'}"></i>
                        <div class="resultado-info">
                            <span>Diferencia (${tipoDiferencia}):</span>
                            <strong class="${claseColor}">${formatCurrency(diferencia)}</strong>
                        </div>
                        <button class="btn-secondary ajuste-btn" data-id="${id}" data-diferencia="${diferencia}">Crear Ajuste</button>
                    </div>
                `;
            }
            resultadoEl.innerHTML = resultadoHTML;
        }

        if (ajusteBtn) {
            const id = ajusteBtn.dataset.id;
            const diferencia = parseFloat(ajusteBtn.dataset.diferencia);
            crearAjuste(id, diferencia);
        }
    });
}
