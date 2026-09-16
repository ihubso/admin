self.addEventListener('push', event => {
    let payload = {};

    try {
        payload = event.data ? event.data.json() : {};
    } catch (error) {
        payload = {
            title: 'Sucess Technology',
            body: event.data ? event.data.text() : 'You have a new notification'
        };
    }

    const notificationData = payload.data || {};
    const options = {
        body: payload.body || 'You have a new notification',
        icon: payload.icon || '/favicon.png',
        badge: payload.badge || '/favicon.png',
        data: notificationData,
        tag: notificationData.orderId ? `order-${notificationData.orderId}` : 'sucess-technology'
    };

    event.waitUntil(
        self.registration.showNotification(payload.title || 'Sucess Technology', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '//admin-dashboard/';
    const absoluteUrl = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url === absoluteUrl && 'focus' in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(absoluteUrl);
            }

            return undefined;
        })
    );
});
