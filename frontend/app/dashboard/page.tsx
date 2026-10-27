'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Bell,
  Utensils,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import CrowdMeter from '@/components/CrowdMeter';
import { fetchGraphQL } from '@/lib/graphql';
import { getSocket } from '@/lib/socket';
import { FALLBACK_FOODS } from '@/lib/mockMenu';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const res = await fetchGraphQL(`
        query StudentDashboard {
          getMyOrders {
            id
            orderNumber
            tokenNumber
            status
            queuePosition
            estimatedWaitingTime
            totalAmount
            createdAt
            items {
              quantity
              foodItem {
                name
                image
                price
              }
            }
          }
          getNotifications {
            id
            title
            message
            createdAt
            isRead
          }
          getMenu {
            id
            name
            price
            image
            preparationTime
            rating
            isAvailable
          }
        }
      `);

      if (res?.getMyOrders) {
        const active = res.getMyOrders.find((o: any) =>
          ['PAID', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status),
        );
        setActiveOrder(active || null);
        setRecentOrders(res.getMyOrders.slice(0, 5));
      }

      if (res?.getNotifications) {
        setNotifications(res.getNotifications.slice(0, 4));
      }

      if (res?.getMenu && res.getMenu.length > 0) {
        setRecommended(res.getMenu.slice(0, 4));
      } else {
        setRecommended(FALLBACK_FOODS.slice(0, 4));
      }
    } catch (e) {
      console.warn('Backend/Database not yet reachable:', e);
      setRecommended(FALLBACK_FOODS.slice(0, 4));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const socket = getSocket();
    const refresh = () => loadDashboardData();

    socket.on('QUEUE_UPDATED', refresh);
    socket.on('ORDER_STATUS_CHANGED', refresh);
    socket.on('NOTIFICATION_CREATED', refresh);

    return () => {
      socket.off('QUEUE_UPDATED', refresh);
      socket.off('ORDER_STATUS_CHANGED', refresh);
      socket.off('NOTIFICATION_CREATED', refresh);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161b27] p-6 sm:p-8 rounded-3xl border border-[#1f2937] shadow-subtle">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Smart Campus Canteen</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-white">
            Good Morning, {user?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Track your lunch line from your classroom or desk. Order smart, wait less!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/menu"
            className="px-5 py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md shadow-primary/25 hover:bg-primary-dark transition-all flex items-center gap-2"
          >
            <Utensils className="w-4 h-4" />
            <span>Order Food</span>
          </Link>

          <Link
            href="/queue"
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs transition-all flex items-center gap-2 border border-white/5"
          >
            <Clock className="w-4 h-4" />
            <span>Live Queue</span>
          </Link>
        </div>
      </div>

      {/* Primary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Active Order & Recent Activity */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Order Card */}
          {activeOrder ? (
            <div className="bg-[#161b27] rounded-3xl p-6 sm:p-8 border-2 border-primary/40 shadow-float relative overflow-hidden space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Your Current Order
                  </span>
                  <span className="text-4xl font-extrabold font-heading text-primary">
                    {activeOrder.tokenNumber || 'CQ-124'}
                  </span>
                </div>

                <span className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs uppercase tracking-wide">
                  {activeOrder.status}
                </span>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
                  <span className="text-[11px] text-slate-400 font-medium block">Queue Position</span>
                  <span className="text-2xl font-bold font-heading text-white mt-1 block">
                    #{activeOrder.queuePosition || 8}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
                  <span className="text-[11px] text-slate-400 font-medium block">Orders Ahead</span>
                  <span className="text-2xl font-bold font-heading text-white mt-1 block">
                    {activeOrder.queuePosition ? Math.max(0, activeOrder.queuePosition - 1) : 7}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
                  <span className="text-[11px] text-slate-400 font-medium block">Estimated Wait</span>
                  <span className="text-2xl font-bold font-heading text-primary mt-1 block">
                    ~{activeOrder.estimatedWaitingTime || 14} min
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
                  <span className="text-[11px] text-slate-400 font-medium block">Canteen Crowd</span>
                  <span className="text-2xl font-bold font-heading text-amber-400 mt-1 block">
                    54%
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Total: <strong className="text-white">₹{activeOrder.totalAmount}</strong> • {activeOrder.items?.length || 1} items
                </span>

                <Link
                  href={`/order/${activeOrder.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-dark transition-all"
                >
                  <span>Track Live Status & QR</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-[#161b27] rounded-3xl p-8 border border-[#1f2937] shadow-subtle text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-xl text-white">No active orders right now</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Ready for food? Explore today's freshly prepared specials and beat the rush.
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:bg-primary-dark"
              >
                <span>Browse Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Recent Orders Section */}
          <div className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-white">Recent Orders</h3>
              <Link href="/orders" className="text-xs font-bold text-primary hover:text-primary/80">
                View All
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No previous order history yet.</p>
            ) : (
              <div className="divide-y divide-[#1f2937]">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-white">
                          {ord.tokenNumber || ord.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString()} • {ord.items?.length || 1} items
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary text-sm">₹{ord.totalAmount}</span>
                      <Link
                        href={`/order/${ord.id}`}
                        className="p-2 rounded-lg bg-[#0d1117] text-slate-400 hover:text-white border border-[#1f2937]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Crowd Meter & In-App Notifications */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Live Canteen Crowd Component */}
          <CrowdMeter />

          {/* In-app Notifications Drawer */}
          <div className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span>Notifications</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                Live
              </span>
            </div>

            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#1f2937] space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{n.title}</h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Dishes */}
          <div className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-4">
            <h3 className="font-heading font-bold text-base text-white">Recommended for You</h3>
            <div className="space-y-3">
              {recommended.map((dish) => (
                <Link
                  key={dish.id}
                  href="/menu"
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-[#1f2937] transition-all text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={dish.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop'}
                      alt={dish.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <span className="font-bold text-white group-hover:text-primary block">{dish.name}</span>
                      <span className="text-slate-400 text-[11px]">{dish.preparationTime}m prep</span>
                    </div>
                  </div>
                  <span className="font-bold text-primary">₹{dish.price}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
