import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InitializeUsers } from "@/components/initialize-users";
import PushNotificationSubscriber from '@/components/push-notification-subscriber';
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quản lý công việc",
  description: "Hệ thống quản lý nhân viên và lịch làm việc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <InitializeUsers />
        <SpeedInsights />
        <PushNotificationSubscriber />
        {children}
      </body>
    </html>
  );
}

<link rel="manifest" href="/manifest.json" />

