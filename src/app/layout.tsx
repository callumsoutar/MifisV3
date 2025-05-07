import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { ReactNode } from 'react';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aero Safety - Flight School Safety Management System",
  description: "A comprehensive safety management system for flight schools",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // TODO: Add AuthProvider and ThemeProvider here when implementing auth and theming
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        <Providers>
        {/* Providers will be added here */}
        {children}
        </Providers>
      </body>
    </html>
  );
}
