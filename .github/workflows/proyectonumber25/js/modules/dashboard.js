// js/modules/dashboard.js 

import { state } from '../store.js'; 
// Solo se importan funciones de bajo nivel que no crean dependencias
import { formatCurrency, getCategoryIcon, getMetodoPagoNombre, populateMetodoPagoSelects } from '../utils.js'; 
import { openModal } from '../ui.js'; 

// --- Elementos del DOM del Dashboard --- 
const saldoTotalEl = document.getElementById('total-disponible'); 
const saldoEfectivoEl = document.getElementById('saldo-efectivo'); 
const saldoCuentasEl = document.getElementById('saldo-cuentas'); 
const upcomingPaymentsList = document.getElementById('upcoming-payments-list'); 
const recentActivityList = document.getElementById('recent-activity-list'); 
const quickActionMovimientoBtn = document.getElementById('quick-action-movimiento'); 
const quickActionCuentaBtn = document.getElementById('quick-action-cuenta'); 
const dashboardBudgetsSummary = document.getElementById('dashboard-budgets-summary');
const greetingEl = document.getElementById('dashboard-greeting');
const mainChartCanvas = document.getElementById('main-dashboard-chart');

let mainChartInstance = null;

/**
 * Actualiza el saludo según la hora del día.
 */
function updateGreeting() {
    if (!greetingEl) return;
    const hour = new Date().getHours();
    if (hour < 12) {
        greetingEl.textContent = 'Buenos días';
    } else if (hour < 19) {
        greetingEl.textContent = 'Buenas tardes';
    } else {
        greetingEl.textContent = 'Buenas noches';
    }
}

/** * Calcula y muestra los saldos totales en las tarjetas principales. 
 */ 
function renderSaldos() { 
    const saldoEnCuentas = state.cuentas.reduce((total, cuenta) => total + cuenta.saldo, 0); 
    const ingresosEfectivo = state.movimientos.filter(m => m.tipo === 'ingreso' && m.metodoPago === 'efectivo').reduce((total, m) => total + m.monto, 0); 
    const egresosEfectivo = state.movimientos.filter(m => m.tipo === 'egreso' && m.metodoPago === 'efectivo').reduce((total, m) => total + m.monto, 0); 
    const saldoEnEfectivo = ingresosEfectivo - egresosEfectivo; 
    const saldoTotal = saldoEnCuentas + saldoEnEfectivo; 

    if (saldoTotalEl) saldoTotalEl.textContent = formatCurrency(saldoTotal); 
    if (saldoEfectivoEl) saldoEfectivoEl.textContent = formatCurrency(saldoEnEfectivo); 
    if (saldoCuentasEl) saldoCuentasEl.textContent = formatCurrency(saldoEnCuentas); 
} 

/** * Muestra los próximos pagos basados en suscripciones. 
 */ 
function renderProximosPagos() { 
    if (!upcomingPaymentsList) return; 

    const hoy = new Date(); 
    const diaActual = hoy.getDate(); 

    const proximosPagos = state.suscripciones.map(sub => { 
        let proximoMes = hoy.getMonth(); 
        let proximoAño = hoy.getFullYear(); 
        if (diaActual > sub.fechaCorte) { 
            proximoMes++; 
            if (proximoMes > 11) { 
                proximoMes = 0; 
                proximoAño++; 
            } 
        } 
        return { 
            nombre: sub.nombre, 
            fecha: new Date(proximoAño, proximoMes, sub.fechaCorte), 
            monto: sub.monto 
        }; 
    }) 
    .sort((a, b) => a.fecha - b.fecha)
    .slice(0, 5);

    if (proximosPagos.length === 0) { 
        upcomingPaymentsList.innerHTML = '<p class="empty-state-small">No hay pagos próximos.</p>'; 
        return; 
    } 

    upcomingPaymentsList.innerHTML = proximosPagos.map(pago => ` 
        <div class="list-item"> 
            <div class="list-item-details"> 
                <p>${pago.nombre}</p> 
                <span>${pago.fecha.toLocaleDateString('es-ES')}</span> 
            </div> 
            <p class="list-item-amount">${formatCurrency(pago.monto)}</p> 
        </div> 
    `).join(''); 
} 

/** * Muestra los últimos movimientos registrados. 
 */ 
function renderActividadReciente() { 
    if (!recentActivityList) return; 
     
    const actividadReciente = [...state.movimientos] 
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) 
        .slice(0, 5); 

    if (actividadReciente.length === 0) { 
        recentActivityList.innerHTML = '<p class="empty-state-small">No hay actividad reciente.</p>'; 
        return; 
    } 

    recentActivityList.innerHTML = actividadReciente.map(mov => ` 
        <div class="list-item"> 
            <div class="list-item-icon ${mov.tipo}"> 
                <i class="fas ${getCategoryIcon(mov.categoria)}"></i> 
            </div> 
            <div class="list-item-details"> 
                <p>${mov.descripcion}</p> 
                <span>${getMetodoPagoNombre(mov.metodoPago)}</span> 
            </div> 
            <p class="list-item-amount ${mov.tipo}"> 
                ${mov.tipo === 'ingreso' ? '+' : '-'}${formatCurrency(mov.monto)} 
            </p> 
        </div> 
    `).join(''); 
} 

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

function renderResumenPresupuestos() {
    if (!dashboardBudgetsSummary) return;

    const presupuestosActivos = Object.entries(state.budgets || {})
        .filter(([_, limite]) => limite > 0)
        .map(([categoria, limite]) => ({
            categoria,
            limite,
            gastado: calcularGastoPorCategoria(categoria)
        }));

    if (presupuestosActivos.length === 0) {
        dashboardBudgetsSummary.innerHTML = '<p class="empty-state-small">No has definido presupuestos.</p>';
        return;
    }

    dashboardBudgetsSummary.innerHTML = presupuestosActivos.map(p => {
        const porcentaje = p.limite > 0 ? Math.min((p.gastado / p.limite) * 100, 100) : 0;
        const claseProgreso = p.gastado > p.limite ? 'excedido' : '';

        return `
            <div class="budget-summary-item">
                <div class="budget-summary-header">
                    <i class="fas ${getCategoryIcon(p.categoria)}"></i>
                    <span>${p.categoria.charAt(0).toUpperCase() + p.categoria.slice(1)}</span>
                </div>
                <div class="budget-summary-details">
                    <span class="gastado">${formatCurrency(p.gastado)}</span>
                    <span class="limite">/ ${formatCurrency(p.limite)}</span>
                </div>
                <div class="progress-bar-summary">
                    <div class="progress ${claseProgreso}" style="width: ${porcentaje}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Dibuja el gráfico principal de Ingresos vs Egresos del mes actual.
 */
function renderMainChart() {
    if (!mainChartCanvas) return;

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    const movimientosMes = state.movimientos.filter(m => {
        const fechaMov = new Date(m.fecha);
        return fechaMov.getMonth() === mesActual && fechaMov.getFullYear() === añoActual;
    });

    const ingresos = movimientosMes.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
    const egresos = movimientosMes.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);

    if (mainChartInstance) {
        mainChartInstance.destroy();
    }

    mainChartInstance = new Chart(mainChartCanvas, {
        type: 'bar',
        data: {
            labels: ['Ingresos', 'Egresos'],
            datasets: [{
                label: 'Monto',
                data: [ingresos, egresos],
                backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

/** * Función principal que se llama para dibujar todo el dashboard. 
 */ 
export function renderDashboard() { 
    updateGreeting();
    renderSaldos(); 
    renderProximosPagos(); 
    renderActividadReciente(); 
    renderResumenPresupuestos();
    renderMainChart();
} 

/** * Inicializa los listeners de los botones del dashboard. 
 */ 
export function initDashboard() { 
    if (quickActionMovimientoBtn) {
        quickActionMovimientoBtn.addEventListener('click', () => { 
            const form = document.getElementById('form-movimiento');
            if (form) form.reset();
            populateMetodoPagoSelects();
            openModal('modal-movimiento'); 
        }); 
    }
    
    if (quickActionCuentaBtn) {
        quickActionCuentaBtn.addEventListener('click', () => { 
            const form = document.getElementById('form-cuenta');
            if (form) form.reset();
            const modalTitle = document.getElementById('cuenta-modal-titulo');
            if(modalTitle) modalTitle.textContent = 'Nueva Cuenta Bancaria';
            const cuentaIdInput = document.getElementById('cuenta-id');
            if(cuentaIdInput) cuentaIdInput.value = '';
            const cuentaSaldoInput = document.getElementById('cuenta-saldo');
            if(cuentaSaldoInput) cuentaSaldoInput.disabled = false;
            openModal('modal-cuenta'); 
        }); 
    }
}
