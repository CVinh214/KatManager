'use client';

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

export default function PushNotificationSubscriber() {
  const { user, isHydrated } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!isHydrated || !user || user.role !== 'staff') return;
    
    // Check current permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Show prompt nếu chưa hỏi
      if (Notification.permission === 'default') {
        setShowPrompt(true);
      } else if (Notification.permission === 'granted') {
        // Auto subscribe nếu đã có permission
        registerServiceWorkerAndSubscribe();
      }
    }
  }, [user, isHydrated]);

  const registerServiceWorkerAndSubscribe = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.error('Push not supported');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setIsSubscribed(true);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: user?.id,
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        setShowPrompt(false);
        console.log('✅ Push subscribed');
      }
    } catch (error) {
      console.error('Push error:', error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await registerServiceWorkerAndSubscribe();
      }
    } catch (error) {
      console.error('Permission error:', error);
    } finally {
      setShowPrompt(false);
    }
  };

  if (!isHydrated || !user || user.role !== 'staff') return null;

  // Hiển thị prompt yêu cầu bật notification
  if (showPrompt && permission === 'default') {
    return (
      <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm border border-gray-200 z-50">
        <div className="flex items-start gap-3">
          <Bell className="text-indigo-600 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Bật thông báo
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              BẮT BUỘC BẬT ĐỂ NHẬN THÔNG BÁO TỪ QUẢN LÝ!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnableNotifications}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Bật ngay
              </button>
              <button
                onClick={handleEnableNotifications}
                className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded-lg"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
