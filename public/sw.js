// Service Worker for Push Notifications
console.log('Service Worker loaded');

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Lắng nghe push notification
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('Error parsing push data:', e);
  }
  
  const title = data.title || 'Thông báo mới';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url || '/announcements',
    },
    tag: data.tag || 'announcement',
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Xử lý click vào notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/announcements';
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Tìm tab đã mở announcements
      for (const client of clientList) {
        if (client.url.includes('/announcements') && 'focus' in client) {
          return client.focus();
        }
      }
      // Mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
