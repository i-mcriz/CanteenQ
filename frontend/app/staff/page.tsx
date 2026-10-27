'use client';

import React, { useEffect, useState } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  X,
  RefreshCw,
  Sliders,
  Plus,
  Minus,
  Utensils,
  Package,
} from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphql';
import { getSocket } from '@/lib/socket';

export default function StaffDashboardPage() {
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'STOCK'>('KANBAN');
  const [orders, setOrders] = useState<any[]>([]);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [crowd, setCrowd] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadStaffData = async () => {
    try {
      const res = await fetchGraphQL(`
        query StaffData {
          getAllOrders {
            id
            orderNumber
            tokenNumber
            status
            paymentMethod
            totalAmount
            createdAt
            estimatedWaitingTime
            items {
              quantity
              foodItem {
                name
                preparationTime
              }
            }
            student {
              user {
                name
              }
              studentId
            }
          }
          getMenu {
            id
            name
            price
            image
            preparationTime
            stockQuantity
            isAvailable
            category {
              name
            }
          }
          getCrowdDensity {
            percentage
            status
            activeOrders
            estimatedWaitMinutes
          }
        }
      `);

      if (res?.getAllOrders) setOrders(res.getAllOrders);
      if (res?.getMenu) setFoodItems(res.getMenu);
      if (res?.getCrowdDensity) setCrowd(res.getCrowdDensity);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();

    const socket = getSocket();
    const handleRefresh = () => loadStaffData();

    socket.on('QUEUE_UPDATED', handleRefresh);
    socket.on('ORDER_STATUS_CHANGED', handleRefresh);
    socket.on('FOOD_AVAILABILITY_CHANGED', handleRefresh);

    const interval = setInterval(loadStaffData, 5000);

    return () => {
      socket.off('QUEUE_UPDATED', handleRefresh);
      socket.off('ORDER_STATUS_CHANGED', handleRefresh);
      socket.off('FOOD_AVAILABILITY_CHANGED', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Status transitions
  const handleAccept = async (orderId: string, tokenNumber?: string) => {
    try {
      await fetchGraphQL(`
        mutation AcceptOrder($orderId: String!) {
          acceptOrder(orderId: $orderId) { id status }
        }
      `, { orderId });
      showToast(`Order ${tokenNumber || ''} Accepted`);
      loadStaffData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleStartPreparing = async (orderId: string, tokenNumber?: string) => {
    try {
      await fetchGraphQL(`
        mutation StartPrep($orderId: String!) {
          startPreparing(orderId: $orderId) { id status }
        }
      `, { orderId });
      showToast(`Order ${tokenNumber || ''} in Preparation`);
      loadStaffData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMarkReady = async (orderId: string, tokenNumber?: string) => {
    try {
      await fetchGraphQL(`
        mutation MarkReady($orderId: String!) {
          markReady(orderId: $orderId) { id status }
        }
      `, { orderId });
      showToast(`Order ${tokenNumber || ''} is Ready for pickup!`);
      loadStaffData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleComplete = async (orderId: string, tokenNumber?: string) => {
    try {
      await fetchGraphQL(`
        mutation CompleteOrder($orderId: String!) {
          completeOrder(orderId: $orderId) { id status }
        }
      `, { orderId });
      showToast(`Order ${tokenNumber || ''} Completed`);
      loadStaffData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReject = async (orderId: string, tokenNumber?: string) => {
    const reason = prompt('Reason for rejection/cancellation:');
    if (reason === null) return;
    try {
      await fetchGraphQL(`
        mutation CancelOrder($orderId: String!, $reason: String) {
          cancelOrder(orderId: $orderId, reason: $reason) { id status }
        }
      `, { orderId, reason });
      showToast(`Order ${tokenNumber || ''} Cancelled`);
      loadStaffData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Food stock and availability handlers
  const handleUpdateStock = async (id: string, newStock: number, isAvail: boolean, prep: number) => {
    try {
      await fetchGraphQL(`
        mutation UpdateStock($id: String!, $isAvailable: Boolean!, $stockQuantity: Int, $preparationTime: Int) {
          updateFoodAvailability(id: $id, isAvailable: $isAvailable, stockQuantity: $stockQuantity, preparationTime: $preparationTime) {
            id
            isAvailable
            stockQuantity
          }
        }
      `, {
        id,
        stockQuantity: newStock,
        isAvailable: newStock > 0 ? isAvail : false,
        preparationTime: prep,
      });
      loadStaffData();
    } catch (e: any) {
      console.error(e);
    }
  };

  // Group orders for Kanban
  const newOrders = orders.filter((o) => ['PLACED', 'PAID'].includes(o.status));
  const acceptedOrders = orders.filter((o) => o.status === 'ACCEPTED');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-8 right-8 z-50 bg-[#161b27] border border-[#1f2937] text-white px-5 py-3 rounded-2xl shadow-float flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <ChefHat className="w-4 h-4" />
            <span>Kitchen & Counter Management</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-white">Staff Portal</h1>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-[#0d1117] p-1.5 rounded-2xl border border-[#1f2937]">
          <button
            onClick={() => setActiveTab('KANBAN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'KANBAN'
                ? 'bg-[#161b27] text-white border border-[#1f2937] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Order Kanban Board
          </button>
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'STOCK'
                ? 'bg-[#161b27] text-white border border-[#1f2937] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Food Availability & Stock
          </button>
        </div>
      </div>

      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Today's Orders</span>
          <span className="text-2xl font-bold font-heading text-white mt-1 block">{orders.length}</span>
        </div>
        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">New / Pending</span>
          <span className="text-2xl font-bold font-heading text-primary mt-1 block">{newOrders.length + acceptedOrders.length}</span>
        </div>
        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">In Preparation</span>
          <span className="text-2xl font-bold font-heading text-amber-400 mt-1 block">{preparingOrders.length}</span>
        </div>
        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Ready for Pickup</span>
          <span className="text-2xl font-bold font-heading text-blue-400 mt-1 block">{readyOrders.length}</span>
        </div>
        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Completed</span>
          <span className="text-2xl font-bold font-heading text-slate-300 mt-1 block">{completedOrders.length}</span>
        </div>
        <div className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 block">Current Crowd</span>
          <span className="text-2xl font-bold font-heading text-amber-400 mt-1 block">{crowd ? `${Math.round(crowd.percentage)}%` : '54%'}</span>
        </div>
      </div>

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Column 1: NEW / PAID */}
          <div className="bg-primary/10 rounded-3xl p-5 border border-primary/20 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-primary/20">
              <span className="font-heading font-bold text-sm text-primary">NEW ORDERS</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-white">
                {newOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {newOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No incoming new orders</p>
              ) : (
                newOrders.map((ord) => (
                  <div key={ord.id} className="bg-[#161b27] p-4 rounded-2xl border border-[#1f2937] shadow-subtle space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-lg font-extrabold font-heading text-primary block">
                          {ord.tokenNumber || 'CQ-NEW'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {ord.student?.user?.name || 'Student'} • {ord.student?.studentId || ''}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white">₹{ord.totalAmount}</span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300 border-t border-[#1f2937] pt-2">
                      {ord.items.map((i: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{i.quantity}x {i.foodItem?.name}</span>
                          <span className="text-slate-500">{i.foodItem?.preparationTime}m</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#1f2937]">
                      <button
                        onClick={() => handleAccept(ord.id, ord.tokenNumber)}
                        className="flex-1 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => handleReject(ord.id, ord.tokenNumber)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: ACCEPTED / QUEUED */}
          <div className="bg-[#161b27] rounded-3xl p-5 border border-[#1f2937] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2937]">
              <span className="font-heading font-bold text-sm text-slate-300">ACCEPTED / QUEUED</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                {acceptedOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {acceptedOrders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No accepted queued orders</p>
              ) : (
                acceptedOrders.map((ord) => (
                  <div key={ord.id} className="bg-[#0d1117] p-4 rounded-2xl border border-[#1f2937] shadow-subtle space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-lg font-extrabold font-heading text-white block">
                        {ord.tokenNumber}
                      </span>
                      <span className="text-xs font-bold text-white">₹{ord.totalAmount}</span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300 border-t border-[#1f2937] pt-2">
                      {ord.items.map((i: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{i.quantity}x {i.foodItem?.name}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleStartPreparing(ord.id, ord.tokenNumber)}
                      className="w-full py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Cooking</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: PREPARING */}
          <div className="bg-amber-500/10 rounded-3xl p-5 border border-amber-500/20 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <span className="font-heading font-bold text-sm text-amber-400">PREPARING</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                {preparingOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {preparingOrders.length === 0 ? (
                <p className="text-xs text-amber-400/60 text-center py-8">Station currently idle</p>
              ) : (
                preparingOrders.map((ord) => (
                  <div key={ord.id} className="bg-[#161b27] p-4 rounded-2xl border border-amber-500/30 shadow-subtle space-y-3 animate-soft-pulse">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-lg font-extrabold font-heading text-amber-400 block">
                          {ord.tokenNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">Station Active</span>
                      </div>
                      <span className="text-xs font-bold text-white">₹{ord.totalAmount}</span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300 border-t border-[#1f2937] pt-2">
                      {ord.items.map((i: any, idx: number) => (
                        <div key={idx} className="flex justify-between font-medium">
                          <span>{i.quantity}x {i.foodItem?.name}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleMarkReady(ord.id, ord.tokenNumber)}
                      className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Ready (Counter 1)</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 4: READY FOR PICKUP */}
          <div className="bg-blue-500/10 rounded-3xl p-5 border border-blue-500/20 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
              <span className="font-heading font-bold text-sm text-blue-400">READY AT COUNTER</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                {readyOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {readyOrders.length === 0 ? (
                <p className="text-xs text-blue-400/60 text-center py-8">Counter clear</p>
              ) : (
                readyOrders.map((ord) => (
                  <div key={ord.id} className="bg-[#161b27] p-4 rounded-2xl border-2 border-blue-500/40 shadow-premium space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xl font-extrabold font-heading text-blue-400 block">
                          {ord.tokenNumber}
                        </span>
                        <span className="text-[11px] font-bold text-blue-400/80">Awaiting QR scan</span>
                      </div>
                      <span className="text-xs font-bold text-white">₹{ord.totalAmount}</span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300 border-t border-[#1f2937] pt-2">
                      {ord.items.map((i: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{i.quantity}x {i.foodItem?.name}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleComplete(ord.id, ord.tokenNumber)}
                      className="w-full py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark flex items-center justify-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Handover & Complete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: FOOD STOCK & AVAILABILITY MANAGER */}
      {activeTab === 'STOCK' && (
        <div className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-subtle space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-xl text-white">Live Food Catalog & Stock Control</h2>
              <p className="text-xs text-slate-400">
                Adjust inventory levels, mark items sold out, and tweak prep times. Updates are broadcast to all student screens in real-time.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#1f2937]">
            {foodItems.map((item) => {
              const isLow = item.stockQuantity < 10 && item.isAvailable;
              const isOut = !item.isAvailable || item.stockQuantity <= 0;

              return (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Food Info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop'}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 bg-slate-900"
                    />
                    <div>
                      <h3 className="font-heading font-bold text-base text-white">{item.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="text-primary font-bold">₹{item.price}</span>
                        <span>•</span>
                        <span>{item.category?.name || 'General'}</span>
                        <span>•</span>
                        <span>~{item.preparationTime} min prep</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Stock Counter & Availability Toggles */}
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {/* Status Badge */}
                    <div>
                      {isOut ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">
                          🔴 Sold Out
                        </span>
                      ) : isLow ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold">
                          🟡 Low Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold">
                          🟢 Available
                        </span>
                      )}
                    </div>

                    {/* Stock Counter */}
                    <div className="flex items-center gap-2 bg-[#0d1117] px-2.5 py-1.5 rounded-xl border border-[#1f2937]">
                      <span className="text-xs text-slate-400 mr-1">Stock:</span>
                      <button
                        onClick={() => handleUpdateStock(item.id, Math.max(0, item.stockQuantity - 5), item.isAvailable, item.preparationTime)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="-5"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-white w-8 text-center">{item.stockQuantity}</span>
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stockQuantity + 5, true, item.preparationTime)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="+5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Sold Out Toggle */}
                    {isOut ? (
                      <button
                        onClick={() => handleUpdateStock(item.id, 25, true, item.preparationTime)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all"
                      >
                        Restock (25)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStock(item.id, 0, false, item.preparationTime)}
                        className="px-3.5 py-1.5 rounded-xl border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all"
                      >
                        Mark Sold Out
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
