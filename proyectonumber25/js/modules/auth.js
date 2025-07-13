// js/modules/auth.js

import { state, saveState } from '../store.js';
import { showToast } from '../ui.js';
import { initMainApp, showMainApp } from '../app.js';

const loginScreen = document.getElementById('login-screen');
const pinContainer = document.getElementById('pin-container');
const realPinInput = document.getElementById('real-pin-input');
const pinHint = document.getElementById('pin-hint');
const loginContainer = document.querySelector('.login-container');
const logoutBtn = document.getElementById('logout-btn');

function updatePinDisplay(pinValue) {
    const visualBoxes = document.querySelectorAll('.pin-box-visual');
    visualBoxes.forEach((box, index) => {
        box.textContent = (index < pinValue.length) ? '●' : '';
        box.classList.toggle('filled', index < pinValue.length);
    });
}

function handlePinInput() {
    const pin = realPinInput.value;
    if (pin.length !== 4) return;

    if (!state.pin) { // Si es la primera vez (creando PIN)
        state.pin = pin;
        saveState();
        showToast('PIN creado con éxito. ¡Bienvenido!', 'success');
        showMainApp();
    } else if (pin === state.pin) { // Si el PIN es correcto
        showMainApp();
    } else { // Si el PIN es incorrecto
        loginContainer.classList.add('error');
        showToast('PIN incorrecto.', 'error');
        realPinInput.value = '';
        updatePinDisplay('');
        setTimeout(() => loginContainer.classList.remove('error'), 500);
    }
}

function logout() {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
        window.location.reload();
    }
}

export function initAuth() {
    // Event listeners del login
    pinContainer.addEventListener('click', () => realPinInput.focus());
    realPinInput.addEventListener('input', () => {
        updatePinDisplay(realPinInput.value);
        handlePinInput();
    });
    logoutBtn.addEventListener('click', logout);

    // Configuración inicial de la pantalla de login
    if (!state.pin) {
        pinHint.textContent = 'Crea tu PIN de 4 dígitos para empezar.';
        pinHint.classList.remove('hidden');
    } else {
        pinHint.classList.add('hidden');
    }
}