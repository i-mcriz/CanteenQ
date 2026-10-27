'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Users, Flame, Sparkles, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import CrowdMeter from '@/components/CrowdMeter';
import { fetchGraphQL } from '@/lib/graphql';
import { getSocket } from '@/lib/socket';

export default function QueuePage() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [crowd, setCrowd] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadQueueData = async () => {
    try {
      const res = await fetchGraphQL(`
        query GetPublicQueue {
          getCurrentQueue {
            id
            tokenNumber
            status
            position
            estimatedWaitTime
            issuedAt
            order {
              id
              orderNumber
              status
              totalAmount
              items {
                quantity
                foodItem {
                  name
                }
              }
            }
          }
          getCrowdDensity {
            percentage
            status
            activeOrders
            estimatedWaitMinutes
            queueLength
          }
        }
      `);

      if (res?.getCurrentQueue) setTokens(res.getCurrentQueue);
      if (res?.getCrowdDensity) setCrowd(res.getCrowdDensity);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueueData();

    const socket = getSocket();
    const handleUpdate = () => loadQueueData();

    socket.on('QUEUE_UPDATED', handleUpdate);
    socket.on('ORDER_STATUS_CHANGED', handleUpdate);
    socket.on('CROWD_DENSITY_CHANGED', handleUpdate);

    const interval = setInterval(loadQueueData, 6000);

    return () => {
      socket.off('QUEUE_UPDATED', handleUpdate);
      socket.off('ORDER_STATUS_CHANGED', handleUpdate);
      socket.off('CROWD_DENSITY_CHANGED', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const readyTokens = tokens.filter((t) => t.status === 'SERVING' || t.order?.status === 'READY');
  const preparingTokens = tokens.filter((t) => t.order?.status === 'PREPARING');
  const queuedTokens = tokens.filter((t) => t.order?.status === 'ACCEPTED' || t.order?.status === 'PAID');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Campus Live Display Board</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-white">Live Canteen Queue</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Watch real-time token transitions. Pick up your order once your token number appears under "Ready for Pickup".
          </p>
        </div>

        <button
          onClick={loadQueueData}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-[#161b27] border border-[#1f2937] text-slate-300 text-xs font-bold hover:bg-[#1e2535] flex items-center gap-2 shadow-subtle transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Crowd Density Card */}
      <div className="max-w-xl">
        <CrowdMeter />
      </div>

      {/* Token Columns Display Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Ready for Pickup (Highest Attention) */}
        <div className="bg-blue-500/10 rounded-3xl p-6 border-2 border-blue-500/40 shadow-premium space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
              <h2 className="font-heading font-bold text-lg text-blue-400">
                Ready for Pickup
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
              {readyTokens.length}
            </span>
          </div>

          <div className="space-y-3">
            {readyTokens.length === 0 ? (
              <p className="text-blue-400/60 text-xs text-center py-8">
                No orders ready for pickup at this moment.
              </p>
            ) : (
              readyTokens.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#161b27] rounded-2xl p-5 border border-blue-500/30 shadow-sm flex items-center justify-between animate-soft-pulse"
                >
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold font-heading text-blue-400 tracking-wider block">
                      {t.tokenNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Counter 1 & 2 • Flash QR Code
                    </span>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-blue-400" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Preparation */}
        <div className="bg-amber-500/10 rounded-3xl p-6 border border-amber-500/30 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="font-heading font-bold text-lg text-amber-400">
                In Preparation
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white">
              {preparingTokens.length}
            </span>
          </div>

          <div className="space-y-3">
            {preparingTokens.length === 0 ? (
              <p className="text-amber-400/60 text-xs text-center py-8">
                No orders currently in active preparation.
              </p>
            ) : (
              preparingTokens.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#161b27] rounded-2xl p-4 border border-amber-500/20 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="text-xl font-bold font-heading text-white tracking-wide block">
                      {t.tokenNumber}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Station: {t.order?.items?.[0]?.foodItem?.name || 'Chef Counter'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg">
                    Cooking
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Scheduled / Next in Queue */}
        <div className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2937]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="font-heading font-bold text-lg text-white">
                Next in Queue
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300">
              {queuedTokens.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {queuedTokens.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-8">
                Queue is clear! Quick orders will be served instantly.
              </p>
            ) : (
              queuedTokens.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-[#0d1117] border border-[#1f2937] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#161b27] text-slate-400 font-bold text-[10px] flex items-center justify-center border border-[#1f2937]">
                      {idx + 1}
                    </span>
                    <span className="font-heading font-bold text-sm text-white">
                      {t.tokenNumber}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ~{(idx + 1) * 3} min
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
