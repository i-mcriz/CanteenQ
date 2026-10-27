'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, Clock } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, tax, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-heading text-white">Your cart is empty</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Looks like you haven't added any delicious food to your tray yet.
          </p>
        </div>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md shadow-primary/25 hover:bg-primary-dark transition-all"
        >
          <span>Explore Menu</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Max prep time in cart
  const maxPrep = items.reduce((max, i) => Math.max(max, i.preparationTime), 6);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/menu" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Menu</span>
          </Link>
          <h1 className="text-3xl font-bold font-heading text-white">Your Order Tray</h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cart Items List */}
        <div className="lg:col-span-8 bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-4">
          <div className="divide-y divide-[#1f2937]">
            {items.map((item) => (
              <div key={item.foodItemId} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-2xl bg-slate-900 overflow-hidden shrink-0">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.isVeg ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                    />
                    <h3 className="font-heading font-bold text-base text-white truncate">
                      {item.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>₹{item.price} each</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      {item.preparationTime}m
                    </span>
                  </div>
                </div>

                {/* Counter & Subtotal */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-[#0d1117] px-2.5 py-1 rounded-xl border border-[#1f2937]">
                    <button
                      onClick={() => updateQuantity(item.foodItemId, item.quantity - 1)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.foodItemId, item.quantity + 1)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="font-heading font-bold text-base text-primary">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.foodItemId)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#1f2937] flex items-center justify-between text-xs text-slate-400">
            <span>Estimated food preparation time:</span>
            <span className="font-bold text-white">~{maxPrep} minutes</span>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-4 bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-6">
          <h2 className="font-heading font-bold text-xl text-white">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-200">₹{subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Campus GST / Tax (5%)</span>
              <span className="font-semibold text-slate-200">₹{tax}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Queue Convenience Fee</span>
              <span className="font-semibold text-blue-400">FREE</span>
            </div>

            <div className="pt-3 border-t border-[#1f2937] flex items-center justify-between">
              <span className="font-heading font-bold text-base text-white">Total Payable</span>
              <span className="font-heading font-bold text-2xl text-primary">₹{total}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 group"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="text-[11px] text-slate-500 text-center">
            Digital token will be immediately issued upon payment verification.
          </p>
        </div>

      </div>
    </div>
  );
}
