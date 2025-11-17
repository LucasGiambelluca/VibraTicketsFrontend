class NotificationService {
  constructor() {
    this.permission = 'default';
    this.init();
  }

  async init() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }

    // Registrar Service Worker para notificaciones push
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        } catch (error) {
        }
    }
  }

  // Notificación simple del navegador
  showNotification(title, options = {}) {
    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'ticketera-notification',
        renotify: true,
        requireInteraction: false,
        ...options
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  }

  // Notificación de evento próximo
  scheduleEventReminder(eventData, minutesBefore = 60) {
    const eventTime = new Date(eventData.date + ' ' + eventData.time);
    const reminderTime = new Date(eventTime.getTime() - (minutesBefore * 60 * 1000));
    const now = new Date();

    if (reminderTime > now) {
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      setTimeout(() => {
        this.showNotification(`¡Tu evento está por comenzar!`, {
          body: `${eventData.title} comienza en ${minutesBefore} minutos`,
          icon: eventData.image,
          actions: [
            {
              action: 'view-ticket',
              title: 'Ver Ticket'
            },
            {
              action: 'dismiss',
              title: 'Cerrar'
            }
          ]
        });
      }, timeUntilReminder);
    }
  }

  // Notificación de cola virtual
  queueNotification(position, total) {
    if (position <= 10) {
      this.showNotification('¡Ya casi es tu turno!', {
        body: `Quedan ${position} personas delante de ti`,
        tag: 'queue-update'
      });
    } else if (position <= 50) {
      this.showNotification('Actualización de cola', {
        body: `Posición ${position} de ${total}`,
        tag: 'queue-update'
      });
    }
  }

  // Notificación de ticket descargado
  ticketDownloaded(eventName) {
    this.showNotification('¡Ticket descargado!', {
      body: `Tu ticket para ${eventName} se ha descargado correctamente`,
      tag: 'ticket-download'
    });
  }

  // Notificación de compra exitosa
  purchaseSuccess(orderData) {
    this.showNotification('¡Compra exitosa!', {
      body: `Tu orden ${orderData.id} ha sido procesada`,
      tag: 'purchase-success',
      actions: [
        {
          action: 'view-tickets',
          title: 'Ver Tickets'
        }
      ]
    });
  }

  // Notificación de evento cancelado/reprogramado
  eventUpdate(eventData, type = 'cancelled') {
    const messages = {
      cancelled: {
        title: 'Evento Cancelado',
        body: `${eventData.title} ha sido cancelado. Te contactaremos para el reembolso.`
      },
      rescheduled: {
        title: 'Evento Reprogramado',
        body: `${eventData.title} ha sido reprogramado para ${eventData.newDate}`
      }
    };

    this.showNotification(messages[type].title, {
      body: messages[type].body,
      tag: 'event-update',
      requireInteraction: true
    });
  }

  // Verificar soporte de notificaciones
  isSupported() {
    return 'Notification' in window;
  }

  // Obtener estado de permisos
  getPermission() {
    return this.permission;
  }
}

// Singleton
const notificationService = new NotificationService();
export default notificationService;
