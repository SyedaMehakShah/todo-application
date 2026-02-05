/**
 * Root layout component.
 * Wraps all pages with common HTML structure and global styles.
 */
import type { Metadata } from 'next';
import '../styles/globals.css';
import { ToastProvider } from '../components/ToastProvider';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Premium Glassmorphism Todo Application',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
