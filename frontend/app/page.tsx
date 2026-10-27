'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  Clock,
  QrCode,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Users,
  Utensils,
  Plus,
  Flame,
} from 'lucide-react';
import CrowdMeter from '@/components/CrowdMeter';
import { useCart } from '@/context/CartContext';
import { fetchGraphQL } from '@/lib/graphql';
import { FALLBACK_FOODS, FoodItem } from '@/lib/mockMenu';

export default function HomePage() {
  const { addItem } = useCart();
  const [popularFoods, setPopularFoods] = useState<FoodItem[]>(FALLBACK_FOODS.slice(0, 6));
  const [addedItem, setAddedItem] = useState<string | null>(null);

  useEffect(() => {
    fetchGraphQL(`
      query PopularItems {
        getMenu {
          id
          name
          description
          price
          image
          category { name }
          preparationTime
          isAvailable
          isVeg
          rating
        }
      }
    `).then((res) => {
      if (res?.getMenu && res.getMenu.length > 0) {
        // Pick top available dishes
        setPopularFoods(res.getMenu.slice(0, 6));
      }
    }).catch(() => {
      setPopularFoods(FALLBACK_FOODS.slice(0, 6));
    });
  }, []);

  const handleAddToCart = (food: FoodItem) => {
    addItem(food, 1);
    setAddedItem(food.id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-8 md:pt-20 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle decorative background blur shapes */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Smart Campus Canteen Queue & Ordering</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              Good Food. <br className="hidden sm:inline" />
              <span className="text-primary">Shorter Queues.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Order your campus food, get a digital token, and track your order in real-time without standing in line.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/menu"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/30 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Order Food</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/queue"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#161b27] text-white font-bold text-base border border-[#1f2937] shadow-subtle hover:bg-[#1e2535] transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5 text-primary" />
                <span>View Live Queue</span>
              </Link>
            </div>

            {/* Quick Features pill highlights */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>No physical queueing</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Instant digital token</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>QR code verification</span>
              </div>
            </div>
          </div>

          {/* Right Live Dashboard Preview */}
          <div className="lg:col-span-5 relative">
            <div className="bg-[#161b27] rounded-3xl p-6 sm:p-8 border border-[#1f2937] shadow-float relative z-10 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#1f2937]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                  <div>
                    <h3 className="font-heading font-bold text-white text-lg">Canteen Status</h3>
                    <p className="text-xs text-slate-500">Campus Central • Ground Floor</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                  LIVE
                </span>
              </div>

              {/* Dynamic Crowd Meter */}
              <CrowdMeter />

              {/* Token Simulation Snapshot */}
              <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937] text-white space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Current Serving Token</span>
                  <span className="text-primary font-bold">Counter 1</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-heading font-extrabold text-white tracking-wider">
                    CQ-124
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs">
                      PREPARING
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-[#1f2937]">
                  <span>Your Position: <strong>#8 (7 orders ahead)</strong></span>
                  <span>Est: <strong>~14 min</strong></span>
                </div>
              </div>

              <Link
                href="/queue"
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-[#1f2937]"
              >
                <span>Check Campus Queue Board</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3-STEP SIMPLE PROCESS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">How CanteenQ Works</span>
          <h2 className="text-3xl font-bold font-heading text-white">Get your food in 3 simple steps</h2>
          <p className="text-slate-400 text-sm">No waiting in lines, no shouting over noisy counters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="bg-[#161b27] rounded-2xl p-8 border border-[#1f2937] shadow-subtle hover:border-primary/40 hover:shadow-premium transition-all duration-300 relative group">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-heading font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="font-heading font-bold text-xl text-white mb-2">Browse & Order</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Explore today’s menu, real-time stock availability, custom preparation times, and pay securely in seconds.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#161b27] rounded-2xl p-8 border border-[#1f2937] shadow-subtle hover:border-amber-500/40 hover:shadow-premium transition-all duration-300 relative group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-heading font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="font-heading font-bold text-xl text-white mb-2">Get Digital Token</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Receive your authoritative token (e.g. CQ-124), live queue slot, and watch preparation stages from your desk.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#161b27] rounded-2xl p-8 border border-[#1f2937] shadow-subtle hover:border-primary/40 hover:shadow-premium transition-all duration-300 relative group">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-heading font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="font-heading font-bold text-xl text-white mb-2">Instant QR Pickup</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              When your order is Ready, flash your secure QR verification code at the counter and pick up hot food immediately.
            </p>
          </div>
        </div>
      </section>

      {/* POPULAR FOODS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Campus Favorites</span>
            <h2 className="text-3xl font-bold font-heading text-white mt-1">Popular Foods Right Now</h2>
          </div>
          <Link
            href="/menu"
            className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 group"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularFoods.map((food) => (
            <div
              key={food.id}
              className="bg-[#161b27] rounded-2xl border border-[#1f2937] overflow-hidden shadow-subtle hover:shadow-premium hover:border-primary/30 transition-all duration-300 flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                <img
                  src={food.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop'}
                  alt={food.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span
                    className={`w-3 h-3 rounded-full border-2 border-white ${
                      food.isVeg ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md">
                    {food.category?.name || 'Popular'}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{food.preparationTime}m prep</span>
                </div>
              </div>

              {/* Food Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-1">
                      {food.name}
                    </h3>
                    <span className="font-heading font-bold text-lg text-primary shrink-0">
                      ₹{food.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {food.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1f2937]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold text-primary">Available</span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(food)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      addedItem === food.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                    }`}
                  >
                    {addedItem === food.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CAMPUS BENEFITS */}
      <section className="bg-[#161b27] border border-[#1f2937] text-white py-16 px-4 sm:px-6 lg:px-8 rounded-3xl max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Campus Technology</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading">
            Built Specifically for High-Volume Campus Canteens
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            CanteenQ combines intelligent order throttling, queue position tracking, and predictive kitchen management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-black/30 border border-[#1f2937] space-y-2">
            <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
            <h4 className="font-heading font-bold text-white text-lg">Real-Time Estimations</h4>
            <p className="text-xs text-slate-400">Dynamic wait times calculated from active kitchen stations and dishes.</p>
          </div>
          <div className="p-6 rounded-2xl bg-black/30 border border-[#1f2937] space-y-2">
            <Users className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h4 className="font-heading font-bold text-white text-lg">Crowd Meter</h4>
            <p className="text-xs text-slate-400">Color-coded campus crowd density to help students pick optimal lunch times.</p>
          </div>
          <div className="p-6 rounded-2xl bg-black/30 border border-[#1f2937] space-y-2">
            <QrCode className="w-8 h-8 text-primary mx-auto mb-3" />
            <h4 className="font-heading font-bold text-white text-lg">Secure QR Verification</h4>
            <p className="text-xs text-slate-400">Zero duplicate pickups or order mix-ups with cryptographic verification.</p>
          </div>
          <div className="p-6 rounded-2xl bg-black/30 border border-[#1f2937] space-y-2">
            <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h4 className="font-heading font-bold text-white text-lg">Peak Hour AI Engine</h4>
            <p className="text-xs text-slate-400">Predictive demand analysis allows kitchen staff to prep meals ahead.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
