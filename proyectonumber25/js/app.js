// js/app.js

import { loadState, saveState, state, resetState } from './store.js';
import { applyTheme, updateDate, initUI } from './ui.js';
import { initAuth } from './modules/auth.js';
import { initNavigation, showSection } from './modules/navigation.js';
import { initDashboard, renderDashboard } from './modules/dashboard.js';
import { initCuentas, renderCuentas } from './modules/cuentas.js';
import { initMovimientos, renderMovimientos } from './modules/movimientos.js';
import { initPresupuestos, renderPresupuestos } from './modules/presupuestos.js';
import { initSuscripciones, renderSuscripciones } from './modules/suscripciones.js';
import { initDeudas, renderDeudas } from './modules/deudas.js';
import { initAhorros, renderAhorros } from './modules/ahorros.js';
import { initReportes, renderReportes } from './modules/reportes.js';
import { initCuadre, renderCuadre } from './modules/cuadre.js';

let mainAppEventsBound = false;

function initConfiguracion() {
    const themeSelector = document.getElementById('theme-selector');
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const importFileInput = document.getElementById('import-file-input');
    const changePinForm = document.getElementById('form-change-pin');
    const newPinInput = document.getElementById('new-pin');
    const confirmPinInput = document.getElementById('confirm-pin');
    const resetDataBtn = document.getElementById('reset-data-btn');

    // Lógica para el selector de temas
    if (themeSelector) {
        themeSelector.value = state.theme;
        themeSelector.addEventListener('change', (event) => {
            const newTheme = event.target.value;
            state.theme = newTheme;
            applyTheme(newTheme);
            saveState();
        });
    }

    // Lógica para el botón de Exportar JSON
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            try {
                const jsonString = JSON.stringify(state, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const today = new Date().toISOString().slice(0, 10);
                a.download = `mi_admin_backup_${today}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Error al exportar los datos:", error);
            }
        });
    }

    // Lógica para Importar JSON
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            if(importFileInput) importFileInput.click();
        });
    }
    if (importFileInput) {
        importFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (importedData.pin && importedData.accounts && importedData.movimientos !== undefined) {
                        if (confirm('¿Estás seguro de que quieres reemplazar TODOS tus datos actuales? Esta acción no se puede deshacer.')) {
                            Object.assign(state, importedData);
                            saveState();
                            alert('¡Datos importados con éxito! La aplicación se recargará.');
                            window.location.reload();
                        }
                    } else {
                        alert('Error: El archivo no parece ser una copia de seguridad válida.');
                    }
                } catch (error) {
                    alert('Error: El archivo seleccionado está dañado o no tiene el formato correcto.');
                } finally {
                    event.target.value = null;
                }
            };
            reader.readAsText(file);
        });
    }

    // Lógica para Cambiar PIN
    if (changePinForm) {
        changePinForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const newPin = newPinInput.value;
            const confirmPin = confirmPinInput.value;

            if (newPin.length !== 4 || confirmPin.length !== 4) {
                alert('El PIN debe tener exactamente 4 dígitos.');
                return;
            }
            if (newPin !== confirmPin) {
                alert('Los PINs no coinciden. Por favor, inténtalo de nuevo.');
                return;
            }
            if (!/^\d{4}$/.test(newPin)) {
                alert('El PIN solo debe contener números.');
                return;
            }

            state.pin = newPin;
            saveState();
            alert('¡PIN actualizado con éxito!');
            changePinForm.reset();
        });
    }
    
    // Lógica para Borrar Todos los Datos
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            const confirmation1 = confirm("¡ADVERTENCIA! ¿Estás absolutamente seguro de que quieres borrar TODOS tus datos?");
            if (confirmation1) {
                const confirmation2 = confirm("Esta acción es PERMANENTE y no se puede deshacer. ¿Continuar con el borrado?");
                if (confirmation2) {
                    resetState();
                    alert('Todos los datos han sido eliminados. La aplicación se reiniciará.');
                    window.location.reload();
                }
            }
        });
    }
}

// Función global para re-renderizar todo
function renderAll() {
    renderDashboard();
    renderCuentas();
    renderMovimientos();
    renderPresupuestos();
    renderSuscripciones();
    renderDeudas();
    renderAhorros();
    renderCuadre();
    renderReportes();
}
window.renderAll = renderAll;

export function showMainApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    if (!mainAppEventsBound) {
        initMainApp();
        mainAppEventsBound = true;
    }
    renderAll();
}

export function initMainApp() {
    console.log("Inicializando eventos de la app principal...");
    initNavigation();
    initDashboard();
    initCuentas();
    initMovimientos();
    initPresupuestos();
    initSuscripciones();
    initDeudas();
    initAhorros();
    initCuadre();
    initReportes();
    initConfiguracion(); 
    initUI();

    updateDate();
    applyTheme(state.theme);
    showSection(window.location.hash);
}

function main() {
    loadState();
    initAuth();
}

document.addEventListener('DOMContentLoaded', main);
