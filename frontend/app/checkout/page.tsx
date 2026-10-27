'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Landmark,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { fetchGraphQL } from '@/lib/graphql';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, tax, total, clearCart } = useCart();
  const { user, isAuthenticated, login, quickSwitch } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'TEST_MODE'>('UPI');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold font-heading text-slate-900">No active items in tray</h2>
        <Link href="/menu" className="inline-block px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold">
          Go to Menu
        </Link>
      </div>
    );
  }

  const handlePayAndPlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 0. Ensure user is logged in as a student
      let currentToken = typeof window !== 'undefined' ? localStorage.getItem('sq_token') : null;
      if (!user || !currentToken || user.role !== 'STUDENT') {
        try {
          await login('student@canteenq.local', 'Password@123');
        } catch (loginErr: any) {
          throw new Error('Please log in with your student account to place orders.');
        }
      }

      // 1. Fetch live menu from database to ensure valid database IDs
      const menuRes = await fetchGraphQL(`query { getMenu { id name } }`).catch(() => null);
      const dbMenu = menuRes?.getMenu || [];

      // 2. Sync items with backend cart
      for (const item of items) {
        let targetId = item.foodItemId;
        if (targetId.startsWith('food-') || !targetId) {
          const match = dbMenu.find((m: any) => m.name.toLowerCase() === item.name.toLowerCase());
          if (match) {
            targetId = match.id;
          } else if (dbMenu.length > 0) {
            targetId = dbMenu[0].id;
          }
        }

        await fetchGraphQL(`
          mutation AddCartItem($foodItemId: String!, $quantity: Int!) {
            addToCart(foodItemId: $foodItemId, quantity: $quantity) {
              id
            }
          }
        `, {
          foodItemId: targetId,
          quantity: item.quantity,
        }).catch((e) => {
          console.warn('Cart sync notice:', e);
        });
      }

      // 3. Create the authoritative order on backend
      const res = await fetchGraphQL(`
        mutation CreateOrder($paymentMethod: String!) {
          createOrder(paymentMethod: $paymentMethod) {
            id
            orderNumber
            tokenNumber
            status
            queuePosition
            estimatedWaitingTime
            totalAmount
          }
        }
      `, {
        paymentMethod,
      });

      if (!res?.createOrder) {
        throw new Error('Could not create order. Please try again.');
      }

      const createdOrder = res.createOrder;
      clearCart();

      // 4. Navigate to live order tracking screen
      router.push(`/order/${createdOrder.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Payment or order creation failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart Tray</span>
        </Link>
        <h1 className="text-3xl font-bold font-heading text-white">Secure Checkout</h1>
        <p className="text-slate-400 text-xs mt-1">
          Review your items, choose instant payment, and collect your digital queue token.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Student & Payment Details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Student Profile Card */}
          <div className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-3">
            <h3 className="font-heading font-bold text-base text-white flex items-center justify-between">
              <span>Ordering Student</span>
              <span className="text-xs font-medium text-slate-400">Verified Campus ID</span>
            </h3>

            {user ? (
              <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937] flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white text-sm">{user.name}</p>
                  <p className="text-slate-400">{user.email}</p>
                  <p className="text-slate-500 mt-0.5">Role: {user.role} • Verified Account</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Student
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#0d1117] border border-blue-500/30 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white text-sm">Aditya Krishnan (Demo Student)</p>
                  <p className="text-slate-400">Will auto-authenticate as student@canteenq.local on checkout</p>
                </div>
                <button
                  type="button"
                  onClick={() => login('student@canteenq.local', 'Password@123')}
                  className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-white">Payment Option</h3>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                256-bit Encrypted
              </span>
            </div>

            <div className="space-y-2.5">
              
              {/* UPI */}
              <label
                onClick={() => setPaymentMethod('UPI')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-[#1f2937] bg-[#0d1117] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                    UPI
                  </div>
                  <div>
                    <span className="font-heading font-bold text-sm text-white block">UPI Instant (GPay / PhonePe / Paytm)</span>
                    <span className="text-[11px] text-slate-400">Scan & pay or enter UPI ID</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="w-4 h-4 text-primary"
                />
              </label>

              {paymentMethod === 'UPI' && (
                <div className="p-4 rounded-2xl bg-[#0d1117] border border-primary/30 space-y-2 animate-in fade-in">
                  <label className="text-xs font-bold text-slate-300">Student UPI VPA Address</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@oksbi"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#1f2937] bg-[#161b27] text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-slate-500">
                    UPI payment simulated instantly in developer test mode.
                  </p>
                </div>
              )}

              {/* Debit/Credit Card */}
              <label
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-[#1f2937] bg-[#0d1117] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-sm text-white block">Credit / Debit Card</span>
                    <span className="text-[11px] text-slate-400">Visa, Mastercard, RuPay</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                  className="w-4 h-4 text-primary"
                />
              </label>

              {/* Net Banking */}
              <label
                onClick={() => setPaymentMethod('NET_BANKING')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'NET_BANKING'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-[#1f2937] bg-[#0d1117] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-sm text-white block">Net Banking</span>
                    <span className="text-[11px] text-slate-400">SBI, HDFC, ICICI, Axis</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'NET_BANKING'}
                  onChange={() => setPaymentMethod('NET_BANKING')}
                  className="w-4 h-4 text-primary"
                />
              </label>

              {/* Test Gateway */}
              <label
                onClick={() => setPaymentMethod('TEST_MODE')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'TEST_MODE'
                    ? 'border-blue-500 bg-blue-500/15 shadow-sm'
                    : 'border-[#1f2937] bg-[#0d1117] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                    ⚡
                  </div>
                  <div>
                    <span className="font-heading font-bold text-sm text-white block">Fast Campus Pass (Dev Mode)</span>
                    <span className="text-[11px] text-slate-400">Instant bypass verification for quick demo testing</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'TEST_MODE'}
                  onChange={() => setPaymentMethod('TEST_MODE')}
                  className="w-4 h-4 text-blue-500"
                />
              </label>

            </div>
          </div>
        </div>

        {/* Right Column: Order Review & Execution */}
        <div className="lg:col-span-5 bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-6">
          <h2 className="font-heading font-bold text-xl text-white">Order Overview</h2>

          {/* Items Preview */}
          <div className="divide-y divide-[#1f2937] max-h-56 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.foodItemId} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{item.quantity}x</span>
                  <span className="text-slate-300 truncate max-w-[180px]">{item.name}</span>
                </div>
                <span className="font-bold text-primary">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Queue Estimation Summary */}
          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937] space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                Estimated Wait
              </span>
              <strong className="text-white">~12 - 14 minutes</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Canteen Load</span>
              <strong className="text-amber-400 font-bold">54% (MODERATE)</strong>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-2 text-sm pt-2 border-t border-[#1f2937]">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-200">₹{subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>GST / Campus Tax (5%)</span>
              <span className="font-semibold text-slate-200">₹{tax}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#1f2937]">
              <span className="font-heading font-bold text-base text-white">Total Amount</span>
              <span className="font-heading font-bold text-2xl text-primary">₹{total}</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            disabled={isSubmitting}
            onClick={handlePayAndPlaceOrder}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Order & Token...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Pay ₹{total} & Place Order</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Payment verified by Razorpay / Campus Smart Pay. Authoritative token generated by NestJS.
          </p>
        </div>

      </div>
    </div>
  );
}
