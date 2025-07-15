// js/utils.js

import { state } from './store.js';

/**
 * Formatea un número a moneda local (MXN).
 * @param {number} value El valor a formatear.
 * @returns {string} El valor formateado como moneda.
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value || 0);
}

/**
 * Devuelve el nombre de la clase de FontAwesome para un ícono de categoría de movimiento.
 * @param {string} categoria La categoría del movimiento.
 * @returns {string} El nombre de la clase del ícono.
 */
export function getCategoryIcon(categoria) {
    const icons = {
        'comida': 'fa-utensils',
        'transporte': 'fa-bus',
        'vivienda': 'fa-home',
        'entretenimiento': 'fa-film',
        'salud': 'fa-briefcase-medical',
        'suscripcion': 'fa-sync-alt',
        'pago deuda': 'fa-file-invoice-dollar',
        'salario': 'fa-money-bill-wave',
        'ahorro': 'fa-piggy-bank',
        'ajuste': 'fa-magic',
        'otros': 'fa-box-open'
    };
    return icons[categoria] || 'fa-question-circle';
}

/**
 * Devuelve un ícono de FontAwesome basado en el nombre de un servicio o meta de ahorro.
 * @param {string} nombre - El nombre de la suscripción o meta.
 * @returns {string} - El nombre de la clase del ícono.
 */
export function getServicioIcon(nombre) {
    const lowerCaseNombre = nombre.toLowerCase();
    const icons = {
        // Suscripciones
        'netflix': 'fa-film',
        'spotify': 'fa-music',
        'youtube': 'fa-youtube',
        'disney': 'fa-magic',
        'hbo': 'fa-video',
        'prime video': 'fa-amazon',
        'amazon prime': 'fa-amazon',
        'icloud': 'fa-cloud',
        'google one': 'fa-google-drive',
        'drive': 'fa-google-drive',
        'office 365': 'fa-windows',
        'microsoft': 'fa-windows',
        'gym': 'fa-dumbbell',
        'gimnasio': 'fa-dumbbell',

        // Metas de Ahorro
        'viaje': 'fa-plane-departure',
        'vacaciones': 'fa-umbrella-beach',
        'coche': 'fa-car',
        'auto': 'fa-car',
        'casa': 'fa-home',
        'depa': 'fa-building',
        'apartamento': 'fa-building',
        'computadora': 'fa-laptop',
        'pc': 'fa-desktop',
        'teléfono': 'fa-mobile-alt',
        'celular': 'fa-mobile-alt',
        'consola': 'fa-gamepad',
        'playstation': 'fa-playstation',
        'xbox': 'fa-xbox',
        'nintendo': 'fa-nintendo-switch',
        'regalo': 'fa-gift',
        'boda': 'fa-ring',
        'emergencia': 'fa-briefcase-medical',
    };

    for (const key in icons) {
        if (lowerCaseNombre.includes(key)) {
            return icons[key];
        }
    }
    // Íconos por defecto
    if (state.ahorros.some(a => a.nombre.toLowerCase() === lowerCaseNombre)) {
        return 'fa-piggy-bank';
    }
    return 'fa-sync-alt';
}


/**
 * Obtiene el nombre de un método de pago a partir de su ID.
 * @param {string} id El ID del método de pago ('efectivo' o ID de cuenta).
 * @returns {string} El nombre para mostrar.
 */
export function getMetodoPagoNombre(id) {
    if (id === 'efectivo') return 'Efectivo';
    const cuenta = state.cuentas.find(c => c.id === id);
    return cuenta ? cuenta.alias : 'Cuenta eliminada';
}

/**
 * Rellena un <select> de método de pago con las cuentas disponibles y la opción de Efectivo.
 * @param {string} selectId - El ID del elemento <select> a rellenar.
 * @param {string} [selectedValue] - El valor que debe quedar seleccionado por defecto.
 */
export function populateMetodoPagoSelects(selectId, selectedValue = 'efectivo') {
    const select = document.getElementById(selectId);
    if (!select) return;

    const optionsHTML = `
        <option value="efectivo">Efectivo</option>
        ${state.cuentas.map(c => `<option value="${c.id}">${c.alias}</option>`).join('')}
    `;
    
    select.innerHTML = optionsHTML;
    select.value = selectedValue;
}
