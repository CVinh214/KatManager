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
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn" />
      
      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
          {/* Header với gradient */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
              <Bell className="text-indigo-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Bật thông báo
            </h3>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                    Bắt buộc bật để nhận thông báo từ quản lý!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Nhận tin ngay khi có thông báo mới</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Hoạt động ngay cả khi đóng trình duyệt</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Có thể tắt bất cứ lúc nào trong cài đặt</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleEnableNotifications}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Bật ngay
              </button>
              <button
                onClick={handleEnableNotifications}
                className="flex-1 px-6 py-3.5 text-gray-700 text-sm font-medium hover:bg-gray-100 rounded-xl border-2 border-gray-300 transition-all duration-200 hover:border-gray-400"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


  return null;
}
