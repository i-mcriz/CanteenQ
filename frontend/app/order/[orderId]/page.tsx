'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Users,
  Utensils,
  QrCode,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphql';
import { getSocket } from '@/lib/socket';

interface OrderData {
  id: string;
  orderNumber: string;
  tokenNumber?: string;
  status: 'PLACED' | 'PAYMENT_PENDING' | 'PAID' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  queuePosition?: number;
  estimatedWaitingTime?: number;
  totalAmount: number;
  qrVerificationCode?: string;
  createdAt: string;
  items: Array<{
    quantity: number;
    unitPrice: number;
    subtotal: number;
    foodItem: {
      name: string;
      image?: string;
      preparationTime: number;
      isVeg: boolean;
    };
  }>;
}

export default function OrderTrackingPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadOrder = async () => {
    try {
      const res = await fetchGraphQL(`
        query GetSingleOrder($id: String!) {
          getOrder(id: $id) {
            id
            orderNumber
            tokenNumber
            status
            queuePosition
            estimatedWaitingTime
            totalAmount
            qrVerificationCode
            createdAt
            items {
              quantity
              unitPrice
              subtotal
              foodItem {
                name
                image
                preparationTime
                isVeg
              }
            }
          }
        }
      `, { id: params.orderId });

      if (res?.getOrder) {
        setOrder(res.getOrder);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Unable to load order');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();

    const socket = getSocket();
    socket.emit('joinOrder', params.orderId);

    const handleStatusChange = (updatedOrder: any) => {
      if (updatedOrder.id === params.orderId) {
        setOrder((prev) => (prev ? { ...prev, ...updatedOrder } : updatedOrder));
      }
    };

    socket.on('ORDER_STATUS_CHANGED', handleStatusChange);
    socket.on('QUEUE_UPDATED', loadOrder);

    const interval = setInterval(loadOrder, 8000);

    return () => {
      socket.off('ORDER_STATUS_CHANGED', handleStatusChange);
      socket.off('QUEUE_UPDATED', loadOrder);
      clearInterval(interval);
    };
  }, [params.orderId]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-slate-600 text-sm font-semibold">Connecting to live kitchen queue...</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-2xl font-bold font-heading text-slate-900">Order Not Found</h2>
        <p className="text-slate-500 text-xs">{errorMsg || 'We could not locate this order.'}</p>
        <Link href="/menu" className="inline-block px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold">
          Return to Menu
        </Link>
      </div>
    );
  }

  // Stepper state logic
  const steps = [
    { key: 'PLACED', label: 'Order Placed', desc: 'Received by kitchen' },
    { key: 'PAID', label: 'Payment Confirmed', desc: 'Token generated' },
    { key: 'ACCEPTED', label: 'Order Accepted', desc: 'Staff scheduled' },
    { key: 'PREPARING', label: 'Cooking & Prep', desc: 'On the kitchen station' },
    { key: 'READY', label: 'Ready for Pickup', desc: 'Waiting at counter' },
    { key: 'COMPLETED', label: 'Picked Up', desc: 'Meal collected' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PLACED': return 0;
      case 'PAYMENT_PENDING': return 0;
      case 'PAID': return 1;
      case 'ACCEPTED': return 2;
      case 'PREPARING': return 3;
      case 'READY': return 4;
      case 'COMPLETED': return 5;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isReady = order.status === 'READY';
  const isCompleted = order.status === 'COMPLETED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Hero Digital Token Banner */}
      <div className="bg-[#161b27] rounded-3xl p-6 sm:p-8 border border-[#1f2937] shadow-float relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1f2937]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Authoritative Queue Token
              </span>
            </div>
            <div className="text-5xl sm:text-6xl font-extrabold font-heading text-primary tracking-tight">
              {order.tokenNumber || 'CQ-TOKEN'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Order ID: <span className="font-mono text-slate-300">{order.orderNumber}</span>
            </p>
          </div>

          {/* Live Status Pill */}
          <div className="text-left md:text-right">
            <span
              className={`inline-block px-4 py-2 rounded-2xl font-bold text-xs tracking-wide uppercase ${
                isReady
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-bounce'
                  : isCompleted
                  ? 'bg-white/10 text-slate-300'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {order.status}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Live Metrics Quad */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
            <span className="text-[11px] font-semibold text-slate-400 block">Queue Position</span>
            <span className="text-2xl font-extrabold font-heading text-white mt-0.5 block">
              {order.queuePosition ? `#${order.queuePosition}` : '—'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
            <span className="text-[11px] font-semibold text-slate-400 block">Orders Ahead</span>
            <span className="text-2xl font-extrabold font-heading text-white mt-0.5 block">
              {order.queuePosition ? Math.max(0, order.queuePosition - 1) : 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
            <span className="text-[11px] font-semibold text-slate-400 block">Estimated Wait</span>
            <span className="text-2xl font-extrabold font-heading text-primary mt-0.5 block">
              ~{order.estimatedWaitingTime ?? 12} min
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
            <span className="text-[11px] font-semibold text-slate-400 block">Canteen Rush</span>
            <span className="text-2xl font-extrabold font-heading text-amber-400 mt-0.5 block">
              54% (MED)
            </span>
          </div>
        </div>
      </div>

      {/* QR Pickup Card (HIGHLIGHTED WHEN READY) */}
      <div
        className={`bg-[#161b27] rounded-3xl p-6 sm:p-8 border shadow-subtle transition-all duration-500 ${
          isReady
            ? 'border-blue-500/50 ring-4 ring-blue-500/10 shadow-float bg-blue-500/10'
            : 'border-[#1f2937]'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          
          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl border border-white/20 shadow-sm shrink-0">
            <QRCodeSVG
              value={order.qrVerificationCode || `CQ-PICKUP:${order.tokenNumber}:${order.id}`}
              size={140}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
              <QrCode className="w-3.5 h-3.5" />
              <span>Digital Counter Pickup Pass</span>
            </div>

            <h3 className="text-xl font-bold font-heading text-white">
              {isReady
                ? '🎉 Your Food is Ready! Flash this QR at Counter 1'
                : 'QR Verification Ready for Pickup'}
            </h3>

            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Show this code to the canteen staff when picking up your food. Does not contain any sensitive payment credentials.
            </p>

            <div className="text-[11px] font-mono text-slate-400 bg-[#0d1117] border border-[#1f2937] px-3 py-1.5 rounded-lg inline-block">
              Verification: {order.qrVerificationCode || 'CQ-VERIFY'}
            </div>
          </div>
        </div>
      </div>

      {/* Status Progression Stepper */}
      <div className="bg-[#161b27] rounded-3xl p-6 sm:p-8 border border-[#1f2937] shadow-subtle space-y-6">
        <h3 className="font-heading font-bold text-lg text-white">Order Progress Timeline</h3>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1f2937]">
          {steps.map((step, idx) => {
            const isPassed = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={step.key} className="relative flex items-start gap-4 group">
                <span
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 transition-all ${
                    isPassed
                      ? 'bg-primary border-white ring-4 ring-primary/20'
                      : 'bg-[#161b27] border-[#1f2937]'
                  }`}
                />
                <div>
                  <h4
                    className={`text-sm font-bold ${
                      isCurrent
                        ? 'text-primary text-base'
                        : isPassed
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items Ordered List */}
      <div className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-4">
        <h3 className="font-heading font-bold text-lg text-white">Items in this Order</h3>
        <div className="divide-y divide-[#1f2937]">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                  <img
                    src={item.foodItem.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop'}
                    alt={item.foodItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="font-bold text-white block text-sm">{item.foodItem.name}</span>
                  <span className="text-slate-400 text-[11px]">{item.quantity}x @ ₹{item.unitPrice}</span>
                </div>
              </div>
              <span className="font-bold text-primary text-sm">₹{item.subtotal}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#1f2937] flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Total Paid (incl. tax)</span>
          <span className="font-heading font-bold text-xl text-primary">₹{order.totalAmount}</span>
        </div>
      </div>

    </div>
  );
}
