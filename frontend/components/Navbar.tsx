'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import CrowdMeter from './CrowdMeter';
import {
  Utensils,
  Clock,
  ShoppingBag,
  Bell,
  User,
  ShieldCheck,
  ChefHat,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphql';
import { getSocket } from '@/lib/socket';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [unreadCount, setUnreadCount] = useState(1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGraphQL(`
        query Notifications {
          getNotifications {
            id
            isRead
          }
        }
      `).then((res) => {
        if (res?.getNotifications) {
          const unread = res.getNotifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        }
      }).catch(() => {});

      const socket = getSocket();
      socket.on('NOTIFICATION_CREATED', () => {
        setUnreadCount((c) => c + 1);
      });
    }
  }, [user]);

  const navLinks = [
    { name: 'Menu', href: '/menu', icon: Utensils },
    { name: 'Live Queue', href: '/queue', icon: Clock },
    { name: 'My Orders', href: '/orders', icon: ShoppingBag },
  ];

  // Role badge colour
  const roleBadge = user?.role === 'STAFF'
    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    : user?.role === 'ADMIN' || user?.role === 'COLLEGE_ADMIN'
    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    : 'bg-primary/20 text-primary border border-primary/30';

  return (
    <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-md border-b border-[#1f2937]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden group-hover:scale-105 transition-transform">
              <Image
                src="/canteenq-logo.png"
                alt="CanteenQ"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-bold text-xl tracking-tight text-white block leading-tight">
                Canteen<span className="text-primary">Q</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block">
                Good Food. Shorter Queues.
              </span>
            </div>
          </Link>

          {/* Crowd density chip (Desktop) */}
          <div className="hidden lg:block">
            <CrowdMeter compact />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}

            {/* Role-based portal links — visible based on role */}
            {(user?.role === 'STAFF') && (
              <Link
                href="/staff"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ml-2 ${
                  pathname.startsWith('/staff')
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                Kitchen Board
              </Link>
            )}

            {(user?.role === 'ADMIN' || user?.role === 'COLLEGE_ADMIN') && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 rounded-xl text-slate-400 hover:bg-white/5 hover:text-primary transition-colors"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <Link
              href="/orders"
              className="relative p-2 rounded-xl text-slate-400 hover:bg-white/5 hover:text-primary transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-[#0d1117]" />
              )}
            </Link>

            {/* User Profile / Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all border border-[#1f2937]"
                >
                  <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs ${roleBadge}`}>
                    {user.name?.slice(0, 2).toUpperCase() || 'CQ'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-[#161b27] rounded-2xl shadow-float border border-[#1f2937] p-2 z-50">
                    <div className="px-3 py-2 border-b border-[#1f2937] mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge}`}>
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      My Dashboard
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                      Order History
                    </Link>

                    <div className="border-t border-[#1f2937] mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-all shadow-sm shadow-primary/25"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
