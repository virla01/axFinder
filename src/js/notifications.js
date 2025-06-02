// src/js/notifications.js

/**
 * Muestra una notificación en la pantalla.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} [type='info'] - El tipo de notificación ('success', 'error', 'info', 'warning').
 * @param {number} [duration=5000] - Duración en milisegundos antes de que la notificación desaparezca. 0 para persistente.
 */
export function showNotification(message, type = 'info', duration = 5000) {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {
        console.error('Error: El área de notificaciones (notification-area) no se encontró en el DOM.');
        return;
    }

    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const notification = document.createElement('div');
    notification.id = notificationId;
    
    // Clases base de Tailwind y la clase de tipo específico
    // Las clases de Tailwind para la animación (opacity-0, translate-x-full) se aplican desde el CSS base de .notification
    notification.className = `notification ${type}`;
        
    // Icono (opcional, se puede mejorar con SVGs específicos)
    let iconHTML = '';
    // Ejemplo simple con texto:
    // if (type === 'success') iconHTML = '<span class="notification-icon">✓</span>';
    // else if (type === 'error') iconHTML = '<span class="notification-icon">✗</span>';
    // else if (type === 'info') iconHTML = '<span class="notification-icon">ℹ</span>';
    // else if (type === 'warning') iconHTML = '<span class="notification-icon">⚠</span>';

    notification.innerHTML = `
        ${iconHTML}
        <div class="notification-content">${message}</div>
        ${duration === 0 ? `<button class="btn btn-rounded-full" data-dismiss="${notificationId}">&times;</button>` : ''}
    `;

    notificationArea.appendChild(notification);

    // Forzar reflujo para asegurar que la animación de entrada se ejecute
    // Esto es necesario porque estamos cambiando clases justo después de añadir el elemento al DOM.
    void notification.offsetWidth; 

    notification.classList.add('show'); // Activa la animación de entrada

    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show'); // Inicia animación de salida
            // Esperar a que termine la animación de salida antes de eliminar
            notification.addEventListener('transitionend', () => {
                if (notification.parentElement) {
                    notificationArea.removeChild(notification);
                }
            }, { once: true });
        }, duration);
    } else {
        // Si es persistente, añadir lógica para el botón de cierre
        const closeButton = notification.querySelector(`[data-dismiss="${notificationId}"]`);
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.classList.remove('show');
                notification.addEventListener('transitionend', () => {
                    if (notification.parentElement) {
                        notificationArea.removeChild(notification);
                    }
                }, { once: true });
            });
        }
    }
}
