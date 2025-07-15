// js/modules/reportes.js

import { state } from '../store.js';
import { formatCurrency } from '../utils.js';

// --- Elementos del DOM ---
const formReportFilters = document.getElementById('form-report-filters');
const reportSummaryCards = document.getElementById('report-summary-cards');
const categoryChartCanvas = document.getElementById('category-chart');

let categoryChartInstance = null; // Variable para guardar la instancia del gráfico

/**
 * Filtra las transacciones según las fechas y tipo del formulario.
 */
function getFilteredTransactions() {
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;
    const type = document.getElementById('filter-type').value;

    let filtered = state.movimientos;

    if (startDate) {
        filtered = filtered.filter(m => new Date(m.fecha) >= new Date(startDate));
    }
    if (endDate) {
        // Añadimos un día a la fecha final para que incluya todo el día.
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        filtered = filtered.filter(m => new Date(m.fecha) < end);
    }
    if (type !== 'todos') {
        filtered = filtered.filter(m => m.tipo === type);
    }
    
    return filtered;
}

/**
 * Dibuja el gráfico de gastos por categoría.
 */
function renderCategoryChart(transactions) {
    const egresos = transactions.filter(t => t.tipo === 'egreso');
    const gastosPorCategoria = egresos.reduce((acc, curr) => {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.monto;
        return acc;
    }, {});

    const labels = Object.keys(gastosPorCategoria);
    const data = Object.values(gastosPorCategoria);

    // Si ya existe un gráfico, lo destruimos antes de crear uno nuevo.
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(categoryChartCanvas, {
        type: 'doughnut', // Tipo de gráfico
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)), // Capitalizar
            datasets: [{
                label: 'Gastos por Categoría',
                data: data,
                backgroundColor: [ // Puedes añadir más colores
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#C9CBCF', '#E7E9ED', '#7CFFB2'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false, // El título ya está en el HTML
                }
            }
        }
    });
}


/**
 * Dibuja las tarjetas de resumen (ingresos, egresos, neto).
 */
function renderSummaryCards(transactions) {
    const ingresos = transactions
        .filter(t => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + t.monto, 0);

    const egresos = transactions
        .filter(t => t.tipo === 'egreso')
        .reduce((sum, t) => sum + t.monto, 0);
    
    const neto = ingresos - egresos;

    reportSummaryCards.innerHTML = `
        <div class="stat-card">
            <i class="fas fa-arrow-up icon-ingresos"></i>
            <div>
                <h3>Ingresos Totales</h3>
                <p>${formatCurrency(ingresos)}</p>
            </div>
        </div>
        <div class="stat-card">
            <i class="fas fa-arrow-down icon-egresos"></i>
            <div>
                <h3>Egresos Totales</h3>
                <p>${formatCurrency(egresos)}</p>
            </div>
        </div>
        <div class="stat-card">
            <i class="fas fa-balance-scale icon-total"></i>
            <div>
                <h3>Neto</h3>
                <p class="${neto >= 0 ? 'ingreso' : 'egreso'}">${formatCurrency(neto)}</p>
            </div>
        </div>
    `;
}

/**
 * Función principal para renderizar toda la sección de reportes.
 */
export function renderReportes() {
    if (!formReportFilters) return;
    const transactions = getFilteredTransactions();
    renderSummaryCards(transactions);
    renderCategoryChart(transactions);
}

/**
 * Inicializa los listeners de la sección de reportes.
 */
export function initReportes() {
    if (!formReportFilters) return;
    // Renderizar al cargar la sección
    renderReportes(); 
    // Añadir listener para cuando se aplican los filtros
    formReportFilters.addEventListener('submit', (e) => {
        e.preventDefault();
        renderReportes();
    });
}