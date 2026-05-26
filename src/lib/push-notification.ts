import webpush from "web-push";
import { prisma } from "@/lib/db";

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const subject = process.env.VAPID_EMAIL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export async function sendPushToAllEmployees(payload: PushPayload) {
  if (!ensureVapidConfigured()) {
    console.warn("VAPID not configured — skipping push notifications");
    return;
  }

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
