// js/ui.js

// Muestra una notificación (toast)
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Abre un modal
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal with id ${modalId} not found.`);
        return;
    }
    document.getElementById('modal-container').classList.add('visible');
    modal.style.display = 'block';
}

// Cierra todos los modales
export function closeModals() {
    document.getElementById('modal-container').classList.remove('visible');
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

// Aplica el tema (claro/oscuro) a la aplicación
export function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = theme;
    }
}

// Actualiza la fecha que se muestra en el dashboard
export function updateDate() {
    const dateSpan = document.getElementById('current-date');
    if (dateSpan) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateSpan.textContent = new Date().toLocaleDateString('es-ES', options);
    }
}

// ---> NUEVA FUNCIÓN AÑADIDA
/**
 * Inicializa los listeners de la UI general, como los modales.
 * Esto se encarga de que los botones de cerrar y el fondo del modal funcionen.
 */
export function initUI() {
    const modalContainer = document.getElementById('modal-container');
    
    // Usamos un solo listener en el contenedor para manejar todos los clics (más eficiente).
    modalContainer.addEventListener('click', (event) => {
        // Si se hace clic en cualquier botón que tenga la clase 'modal-close-btn' (la 'X')
        if (event.target.closest('.modal-close-btn')) {
            closeModals();
        }
        // Si se hace clic en el fondo oscuro del contenedor (para cerrar al hacer clic fuera)
        if (event.target.id === 'modal-container') {
            closeModals();
        }
    });
}
