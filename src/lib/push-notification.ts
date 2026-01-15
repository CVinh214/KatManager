import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

// Setup VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export async function sendPushToAllEmployees(payload: PushPayload) {
  try {
    // Lấy tất cả employees (role = 'staff')
    const employees = await prisma.user.findMany({
      where: { role: 'staff' },
      include: { pushSubscriptions: true },
    });

    const promises: Promise<void>[] = [];

    for (const employee of employees) {
      for (const sub of employee.pushSubscriptions) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        promises.push(
          webpush
            .sendNotification(pushSubscription, JSON.stringify(payload))
            .then(() => {
              console.log(`✓ Push sent to user ${employee.id}`);
            })
            .catch(async (error: any) => {
              console.error(`✗ Push failed for user ${employee.id}:`, error.statusCode);
              
              // Xóa subscription nếu hết hạn hoặc invalid
              if (error.statusCode === 410 || error.statusCode === 404) {
                await prisma.pushSubscription.delete({
                  where: { endpoint: sub.endpoint },
                }).catch(() => {});
              }
            })
        );
      }
    }

    await Promise.allSettled(promises);
    console.log(`Push notifications sent to ${employees.length} employees`);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}
