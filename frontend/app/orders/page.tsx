'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Clock, CheckCircle2, RotateCcw, ExternalLink } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { fetchGraphQL } from '@/lib/graphql';

export default function OrderHistoryPage() {
  const { addItem } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res = await fetchGraphQL(`
        query MyOrderHistory {
          getMyOrders {
            id
            orderNumber
            tokenNumber
            status
            paymentMethod
            subtotal
            tax
            totalAmount
            createdAt
            items {
              quantity
              unitPrice
              subtotal
              foodItem {
                id
                name
                image
                price
                preparationTime
                isVeg
              }
            }
          }
        }
      `);

      if (res?.getMyOrders) {
        setOrders(res.getMyOrders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleReorder = (order: any) => {
    order.items.forEach((i: any) => {
      if (i.foodItem) {
        addItem(i.foodItem, i.quantity);
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-white">Your Order History</h1>
        <p className="text-slate-400 text-xs mt-1">
          Review previous campus canteen orders, digital tokens, and reorder your favorites.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading order history...</div>
      ) : orders.length === 0 ? (
        <div className="bg-[#161b27] rounded-3xl p-12 text-center border border-[#1f2937] shadow-subtle space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-white">No orders yet</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            When you place an order, your receipts and digital tokens will appear here.
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-dark transition-all"
          >
            <span>Browse Food</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const isCompleted = ord.status === 'COMPLETED';
            const isCancelled = ord.status === 'CANCELLED';

            return (
              <div
                key={ord.id}
                className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle hover:shadow-premium transition-all duration-300 space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1f2937]">
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-xl text-primary">
                      {ord.tokenNumber || ord.orderNumber}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-xs font-mono text-slate-400">{ord.orderNumber}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
                        isCompleted
                          ? 'bg-white/10 text-slate-300'
                          : isCancelled
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ord.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="space-y-2">
                  {ord.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.quantity}x</span>
                        <span>{item.foodItem?.name || 'Dish'}</span>
                      </div>
                      <span className="font-semibold text-primary">₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom Bar: Total & Actions */}
                <div className="pt-3 border-t border-[#1f2937] flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Total: <strong className="text-white text-sm">₹{ord.totalAmount}</strong> ({ord.paymentMethod})
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(ord)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#1f2937] bg-[#0d1117] text-slate-300 text-xs font-bold hover:bg-white/5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>

                    <Link
                      href={`/order/${ord.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all shadow-sm"
                    >
                      <span>Track / QR</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
