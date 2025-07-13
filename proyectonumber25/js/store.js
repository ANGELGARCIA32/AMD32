// js/store.js

// El estado inicial y vacío de la aplicación.
const initialState = {
    pin: null,
    theme: 'light',
    cuentas: [],
    movimientos: [],
    presupuestos: [],
    suscripciones: [],
    deudas: [],
    ahorros: [],
};

// La variable 'state' contendrá todos los datos de la app mientras se usa.
// Se exporta para que otros módulos puedan leerla.
export let state = { ...initialState };

/**
 * Carga los datos guardados desde localStorage y los fusiona con el estado inicial.
 */
export function loadState() {
    const data = localStorage.getItem('miAdminData');
    if (data) {
        const savedState = JSON.parse(data);
        // Se combina el estado guardado con el inicial para asegurar que todas las claves existan.
        state = { ...initialState, ...savedState };
    }
}

/**
 * Guarda el estado actual de la aplicación en localStorage.
 */
export function saveState() {
    localStorage.setItem('miAdminData', JSON.stringify(state));
}

/**
 * Reinicia el estado a su valor inicial y borra los datos de localStorage.
 */
export function resetState() {
    state = { ...initialState };
    localStorage.removeItem('miAdminData');
}