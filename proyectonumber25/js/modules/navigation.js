// js/modules/navigation.js

import { renderDashboard } from './dashboard.js';
import { renderCuentas } from './cuentas.js';
import { renderMovimientos } from './movimientos.js';
import { renderPresupuestos } from './presupuestos.js';
import { renderSuscripciones } from './suscripciones.js';
import { renderDeudas } from './deudas.js';
import { renderAhorros } from './ahorros.js';
import { renderReportes } from './reportes.js';
import { renderCuadre } from './cuadre.js';
 // ---> AÑADIDO


const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.nav-item');
const navMenu = document.querySelector('.nav-menu');

export function showSection(hash) {
    const targetHash = (!hash || hash === '#') ? '#dashboard' : hash;
    const sectionId = targetHash.substring(1);

    sections.forEach(sec => sec.classList.remove('active'));
    navItems.forEach(item => item.classList.remove('active'));

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    const activeNavItem = document.querySelector(`.nav-item[href="${targetHash}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    switch (sectionId) {
        case 'dashboard': renderDashboard(); break;
        case 'cuentas': renderCuentas(); break;
        case 'movimientos': renderMovimientos(); break;
        case 'presupuestos': renderPresupuestos(); break;
        case 'suscripciones': renderSuscripciones(); break;
        case 'deudas': renderDeudas(); break;
        case 'ahorros': renderAhorros(); break;
        case 'cuadre': renderCuadre(); break;
        case 'reportes': renderReportes(); break; // ---> AÑADIDO
    }
}

export function initNavigation() {
    window.addEventListener('hashchange', () => showSection(window.location.hash));

    navMenu.addEventListener('click', e => {
        const anchor = e.target.closest('a.nav-item');
        if (anchor) {
            e.preventDefault();
            const targetHash = anchor.getAttribute('href');
            if (window.location.hash !== targetHash) {
                window.location.hash = targetHash;
            } else {
                showSection(targetHash);
            }
        }
    });

    showSection(window.location.hash);
}