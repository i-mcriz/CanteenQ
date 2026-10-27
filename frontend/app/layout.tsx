import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';

export const metadata: Metadata = {
  title: 'CanteenQ — Smart Campus Canteen Queue & Food Ordering System',
  description: 'Order your campus food, get a digital token, and track your order in real-time without standing in line. Order Smart. Wait Less.',
  icons: {
    icon: '/canteenq-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#0d1117] text-slate-100 pb-16 md:pb-0">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <MobileNav />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
