'use client';

import React, { useEffect, useState } from 'react';
import { Users, Clock, Flame } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { fetchGraphQL } from '@/lib/graphql';

interface CrowdData {
  percentage: number;
  status: 'LOW' | 'MODERATE' | 'HIGH';
  activeOrders: number;
  estimatedWaitMinutes: number;
  queueLength: number;
}

const CROWD_QUERY = `
  query GetCrowd {
    getCrowdDensity {
      percentage
      status
      activeOrders
      estimatedWaitMinutes
      queueLength
    }
  }
`;

export default function CrowdMeter({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<CrowdData>({
    percentage: 54,
    status: 'MODERATE',
    activeOrders: 16,
    estimatedWaitMinutes: 12,
    queueLength: 16,
  });

  const loadData = async () => {
    try {
      const res = await fetchGraphQL(CROWD_QUERY);
      if (res?.getCrowdDensity) {
        setData(res.getCrowdDensity);
      }
    } catch (e) {
      // Keep optimistic state if network is initializing
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time crowd changes from NestJS backend
    const socket = getSocket();
    const handleUpdate = (updated: CrowdData) => {
      setData(updated);
    };

    socket.on('CROWD_DENSITY_CHANGED', handleUpdate);
    socket.on('QUEUE_UPDATED', loadData);

    const interval = setInterval(loadData, 10000); // 10s fallback polling

    return () => {
      socket.off('CROWD_DENSITY_CHANGED', handleUpdate);
      socket.off('QUEUE_UPDATED', loadData);
      clearInterval(interval);
    };
  }, []);

  // Theme color styling based on density
  const getStatusConfig = (status: string, pct: number) => {
    if (pct > 70 || status === 'HIGH') {
      return {
        label: 'HIGH RUSH',
        color: 'text-red-400',
        bg: 'bg-red-500/15',
        border: 'border-red-500/30',
        bar: 'bg-red-500',
        dot: 'bg-red-500',
      };
    }
    if (pct > 40 || status === 'MODERATE') {
      return {
        label: 'MODERATE',
        color: 'text-amber-400',
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        bar: 'bg-amber-500',
        dot: 'bg-amber-500',
      };
    }
    return {
      label: 'LOW CROWD',
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/30',
      bar: 'bg-blue-500',
      dot: 'bg-blue-500',
    };
  };

  const config = getStatusConfig(data.status, data.percentage);

  if (compact) {
    return (
      <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border ${config.border} ${config.bg}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
        <span className={`text-xs font-bold ${config.color}`}>{Math.round(data.percentage)}% Crowd</span>
        <span className="text-slate-600">|</span>
        <span className="text-xs text-slate-300 font-medium">{data.activeOrders} orders (~{data.estimatedWaitMinutes}m)</span>
      </div>
    );
  }

  return (
    <div className="bg-[#161b27] rounded-2xl p-5 border border-[#1f2937] shadow-subtle hover:shadow-premium transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Canteen Crowd</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white font-heading">
                {Math.round(data.percentage)}%
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                {config.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-xs bg-[#0d1117] px-2.5 py-1 rounded-lg border border-[#1f2937]">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>~{data.estimatedWaitMinutes} min wait</span>
        </div>
      </div>

      {/* Modern Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${config.bar}`}
          style={{ width: `${Math.min(100, Math.max(5, data.percentage))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1f2937]">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Active queue: <strong className="text-white">{data.activeOrders} orders</strong></span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-blue-400 font-medium">0-40% Low</span>
          <span className="text-amber-400 font-medium">41-70% Med</span>
          <span className="text-red-400 font-medium">71%+ High</span>
        </div>
      </div>
    </div>
  );
}
