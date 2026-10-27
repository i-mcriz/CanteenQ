'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchGraphQL } from '@/lib/graphql';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const res = await fetchGraphQL(`
        query AdminDashboard {
          getAnalytics {
            totalOrders
            totalRevenue
            averageWaitingTime
            averagePreparationTime
            currentCrowdPercentage
            peakHour
            completionRate
            cancellationRate
            hourlyOrders {
              hour
              orders
              revenue
            }
            popularFoods {
              name
              count
              revenue
            }
          }
          getPredictions {
            predictedPeakPeriod
            expectedOrders
            expectedCrowdPercentage
            expectedWaitMinutes
            forecastNextHours {
              hour
              orders
              revenue
            }
            highDemandItems
          }
        }
      `);

      if (res?.getAnalytics) setAnalytics(res.getAnalytics);
      if (res?.getPredictions) setPrediction(res.getPredictions);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Campus Executive Analytics</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-white">Operations & Analytics</h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time canteen revenue, throughput velocity, bottleneck detection, and AI peak predictions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            College Admin Mode
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Orders</span>
          <span className="text-2xl font-bold font-heading text-white mt-1 block">
            {analytics?.totalOrders || 142}
          </span>
        </div>

        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Revenue</span>
          <span className="text-2xl font-bold font-heading text-blue-400 mt-1 block">
            ₹{analytics?.totalRevenue || '18,420'}
          </span>
        </div>

        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Avg Wait Time</span>
          <span className="text-2xl font-bold font-heading text-primary mt-1 block">
            ~{analytics?.averageWaitingTime || 14}m
          </span>
        </div>

        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Avg Prep Time</span>
          <span className="text-2xl font-bold font-heading text-white mt-1 block">
            ~{analytics?.averagePreparationTime || 8.5}m
          </span>
        </div>

        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Current Crowd</span>
          <span className="text-2xl font-bold font-heading text-amber-400 mt-1 block">
            {analytics?.currentCrowdPercentage ? `${Math.round(analytics.currentCrowdPercentage)}%` : '54%'}
          </span>
        </div>

        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Peak Window</span>
          <span className="text-lg font-bold font-heading text-purple-400 mt-1 block truncate">
            {analytics?.peakHour || '12:30 PM'}
          </span>
        </div>

        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Completion</span>
          <span className="text-2xl font-bold font-heading text-blue-400 mt-1 block">
            {analytics?.completionRate || 96.5}%
          </span>
        </div>

        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Cancellation</span>
          <span className="text-2xl font-bold font-heading text-slate-400 mt-1 block">
            {analytics?.cancellationRate || 2.4}%
          </span>
        </div>
      </div>

      {/* PEAK-HOUR PREDICTION ENGINE (PROMINENT HIGHLIGHT) */}
      <div className="bg-[#161b27] border border-[#1f2937] text-white rounded-3xl p-6 sm:p-8 shadow-float relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2937]">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Predictive Demand & Bottleneck Model (NestJS Engine)</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">Peak-Hour AI Forecast</h2>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30">
            Automated Historical Aggregator
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
            <span className="text-xs text-slate-400 block">Predicted Peak Period</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-300 mt-1 block">
              {prediction?.predictedPeakPeriod || '12:30 PM – 1:30 PM'}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Major lunch break rush</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
            <span className="text-xs text-slate-400 block">Expected Orders</span>
            <span className="text-3xl font-extrabold font-heading text-white mt-1 block">
              {prediction?.expectedOrders || 87}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Estimated volume</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
            <span className="text-xs text-slate-400 block">Expected Crowd Density</span>
            <span className="text-3xl font-extrabold font-heading text-red-400 mt-1 block">
              {prediction?.expectedCrowdPercentage ? `${Math.round(prediction.expectedCrowdPercentage)}%` : '92%'}
            </span>
            <span className="text-[11px] text-red-400/80 font-semibold mt-1 block">HIGH RUSH EXPECTED</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#1f2937]">
            <span className="text-xs text-slate-400 block">Expected Wait Time</span>
            <span className="text-3xl font-extrabold font-heading text-amber-300 mt-1 block">
              ~{prediction?.expectedWaitMinutes || 21} min
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Recommend pre-ordering</span>
          </div>
        </div>

        {/* High demand items forecast tags */}
        {prediction?.highDemandItems && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">High Demand Dishes to Pre-cook:</span>
            {prediction.highDemandItems.map((item: string, idx: number) => (
              <span key={idx} className="px-3 py-1 rounded-xl bg-white/10 text-white font-bold text-xs border border-white/5">
                🔥 {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* RECHARTS VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Hourly Orders & Revenue Trend */}
        <div className="lg:col-span-8 bg-[#161b27] p-6 rounded-3xl border border-[#1f2937] shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-white">Orders Throughput by Hour</h3>
            <span className="text-xs text-slate-400 font-medium">Campus Operating Hours (08:00 - 20:00)</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.hourlyOrders || []}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b27', borderRadius: '12px', border: '1px solid #1f2937', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#orderGrad)" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Foods Breakdown */}
        <div className="lg:col-span-4 bg-[#161b27] p-6 rounded-3xl border border-[#1f2937] shadow-subtle space-y-4">
          <h3 className="font-heading font-bold text-lg text-white">Top Selling Foods</h3>
          <div className="space-y-3 pt-2">
            {(analytics?.popularFoods || []).map((food: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-primary/15 text-primary font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-white truncate max-w-[140px]">{food.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white block">{food.count} sold</span>
                  <span className="text-[10px] text-primary">₹{food.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
