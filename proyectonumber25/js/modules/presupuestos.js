// js/modules/presupuestos.js

import { state, saveState } from '../store.js';
import { showToast } from '../ui.js';
import { formatCurrency, getCategoryIcon } from '../utils.js';

// --- Elementos del DOM ---
const presupuestosContainer = document.getElementById('presupuestos-container');
const btnGuardarPresupuestos = document.getElementById('btn-guardar-presupuestos');

const CATEGORIAS_PRESUPUESTABLES = [
    'comida', 'transporte', 'vivienda', 'entretenimiento',
    'salud', 'suscripcion', 'pago deuda', 'ahorro', 'otros'
];

/**
 * Calcula el gasto total para una categoría en el mes actual.
 */
function calcularGastoPorCategoria(categoria) {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    return state.movimientos
        .filter(mov =>
            mov.tipo === 'egreso' &&
            mov.categoria === categoria &&
            new Date(mov.fecha).getMonth() === mesActual &&
            new Date(mov.fecha).getFullYear() === añoActual
        )
        .reduce((total, mov) => total + mov.monto, 0);
}

/**
 * Guarda los límites de presupuesto de todos los inputs.
 */
function savePresupuestos() {
    const inputs = document.querySelectorAll('.presupuesto-input');
    let cambiosRealizados = false;
    
    inputs.forEach(input => {
        const categoria = input.dataset.categoria;
        const limite = parseFloat(input.value) || 0;
        
        if (state.budgets[categoria] !== limite) {
            state.budgets[categoria] = limite;
            cambiosRealizados = true;
        }
    });

    if (cambiosRealizados) {
        saveState();
        renderPresupuestos();
        showToast('Presupuestos guardados con éxito.', 'success');
    } else {
        showToast('No hay cambios que guardar.', 'info');
    }
}

/**
 * Dibuja las tarjetas de presupuesto rediseñadas.
 */
export function renderPresupuestos() {
    if (!presupuestosContainer) return;

    if (!state.budgets) {
        state.budgets = {};
    }

    presupuestosContainer.innerHTML = CATEGORIAS_PRESUPUESTABLES.map(categoria => {
        const limite = state.budgets[categoria] || 0;
        const gastado = calcularGastoPorCategoria(categoria);
        const restante = limite - gastado;
        
        const porcentaje = limite > 0 ? Math.min((gastado / limite) * 100, 100) : 0;
        
        let progresoClass = 'normal';
        if (porcentaje > 85) progresoClass = 'danger';
        else if (porcentaje > 60) progresoClass = 'warning';

        return `
            <div class="presupuesto-card-v2">
                <div class="presupuesto-header">
                    <div class="presupuesto-title">
                        <i class="fas ${getCategoryIcon(categoria)}"></i>
                        <h4>${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</h4>
                    </div>
                    <div class="presupuesto-limite-control">
                        <label>Límite Mensual</label>
                        <div class="input-stepper">
                            <button class="stepper-btn minus" data-categoria="${categoria}">-</button>
                            <input type="number" 
                                   class="presupuesto-input" 
                                   data-categoria="${categoria}" 
                                   value="${limite}"
                                   placeholder="0.00">
                            <button class="stepper-btn plus" data-categoria="${categoria}">+</button>
                        </div>
                    </div>
                </div>
                <div class="presupuesto-body">
                    <div class="presupuesto-info">
                        <span>Gastado</span>
                        <p>${formatCurrency(gastado)}</p>
                    </div>
                    <div class="presupuesto-info restante">
                        <span>Restante</span>
                        <p class="${restante < 0 ? 'negative-balance' : ''}">${formatCurrency(restante)}</p>
                    </div>
                </div>
                <div class="progress-bar-v2">
                    <div class="progress ${progresoClass}" style="width: ${porcentaje}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Inicializa los listeners para la sección de presupuestos.
 */
export function initPresupuestos() {
    if (!btnGuardarPresupuestos || !presupuestosContainer) return;

    btnGuardarPresupuestos.addEventListener('click', savePresupuestos);

    // Listener para los botones +/- del stepper
    presupuestosContainer.addEventListener('click', e => {
        const target = e.target.closest('.stepper-btn');
        if (!target) return;

        const categoria = target.dataset.categoria;
        const input = document.querySelector(`.presupuesto-input[data-categoria="${categoria}"]`);
        if (!input) return;

        let valorActual = parseFloat(input.value) || 0;
        const paso = 100; // Ajusta el presupuesto en pasos de 100

        if (target.classList.contains('plus')) {
            valorActual += paso;
        } else if (target.classList.contains('minus')) {
            valorActual = Math.max(0, valorActual - paso); // No permite valores negativos
        }
        
        input.value = valorActual;
    });
}
