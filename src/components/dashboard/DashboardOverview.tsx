import React, { useEffect, useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { getDashboardStats, getOrders } from '../../lib/api';
import { formatCurrency, formatDate, formatShortDate } from '../../lib/supabase';
import type { DashboardStats, OrderWithItems, OrderStatus } from '../../types/database';

interface DashboardOverviewProps {
  onNavigateToOrders: (statusFilter?: OrderStatus | 'all', searchQuery?: string) => void;
  onNavigateToProducts: () => void;
  onOpenOrder: (order: OrderWithItems) => void;
  onNewOrder: () => void;
  onOpenRlsGuide: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateToOrders,
  onNavigateToProducts,
  onOpenOrder,
  onNewOrder,
  onOpenRlsGuide,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRlsBlocked, setIsRlsBlocked] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    setIsRlsBlocked(false);

    try {
      const [statsResult, ordersResult] = await Promise.all([
        getDashboardStats(),
        getOrders({ page: 1, pageSize: 10, sortBy: 'created_at', sortOrder: 'desc' }),
      ]);

      if (statsResult.error) {
        setError(statsResult.error);
        if (statsResult.isRlsBlocked) setIsRlsBlocked(true);
      } else if (statsResult.data) {
        setStats(statsResult.data);
      }

      if (ordersResult.error) {
        if (ordersResult.isRlsBlocked) setIsRlsBlocked(true);
      } else {
        setRecentOrders(ordersResult.orders);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute ordered products breakdown across recent orders
  const orderedProductsSummary = React.useMemo(() => {
    const map = new Map<string, { count: number; totalQty: number; samplePrice: number }>();
    for (const ord of recentOrders) {
      for (const it of ord.order_items || []) {
        const name = it.product_name;
        if (!name) continue;
        const existing = map.get(name) || { count: 0, totalQty: 0, samplePrice: it.unit_price };
        existing.count += 1;
        existing.totalQty += it.quantity || 1;
        map.set(name, existing);
      }
    }
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        orderCount: data.count,
        totalQty: data.totalQty,
        samplePrice: data.samplePrice,
      }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }, [recentOrders]);

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'text-amber-700 bg-amber-50 border border-amber-200';
      case 'processing':
        return 'text-sky-700 bg-sky-50 border border-sky-200';
      case 'shipped':
        return 'text-indigo-700 bg-indigo-50 border border-indigo-200';
      case 'delivered':
      case 'completed':
        return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'cancelled':
        return 'text-rose-700 bg-rose-50 border border-rose-200';
      default:
        return 'text-slate-700 bg-slate-50 border border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Actions Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Store Performance & Orders
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Clinical Skincare Catalog</span>
            <span aria-hidden="true">·</span>
            <span>Live Supabase Connected</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Active Currency: LKR</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0b4d8c]' : ''}`} />
          </button>
          <button
            onClick={onNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Manual Order
          </button>
        </div>
      </div>

      {/* RLS Alert Banner if policies need configuration */}
      {isRlsBlocked && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Supabase Row-Level Security Policy Notice
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Database queries on <code className="font-mono">orders</code> were restricted by RLS.
                Ensure policies for <code className="font-mono">authenticated</code> role or admin UID are deployed in Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenRlsGuide}
            className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shrink-0 shadow-2xs"
          >
            View SQL Policies
          </button>
        </div>
      )}

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Orders */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-[#0b4d8c]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {isLoading ? (
                <div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
              ) : (
                stats?.totalOrders ?? 0
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <button
                onClick={() => onNavigateToOrders('all')}
                className="text-[#0b4d8c] hover:underline flex items-center gap-1"
              >
                View all orders <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {isLoading ? (
                <div className="h-7 w-28 bg-slate-100 rounded animate-pulse" />
              ) : (
                formatCurrency(stats?.totalRevenue)
              )}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Avg Order Value:{' '}
              <span className="font-mono tabular-nums font-medium text-slate-700">
                {formatCurrency(stats?.averageOrderValue)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Pending Orders */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Fulfillment
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {isLoading ? (
                <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
              ) : (
                stats?.pendingOrders ?? 0
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <button
                onClick={() => onNavigateToOrders('pending')}
                className="text-amber-800 font-medium hover:underline flex items-center gap-1"
              >
                Review pending queue <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI 4: Completed / Delivered Orders */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Completed Orders
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {isLoading ? (
                <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
              ) : (
                stats?.completedOrders ?? 0
              )}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <span>{stats?.shippedOrders ?? 0} shipped</span>
              <span aria-hidden="true">·</span>
              <span>{stats?.processingOrders ?? 0} processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Catalog Stock Overview & Quick Stats Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catalog Inventory Card */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Skincare Products Catalog</h3>
              <button
                onClick={onNavigateToProducts}
                className="text-xs font-medium text-[#0b4d8c] hover:underline flex items-center gap-1"
              >
                Catalog View <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active dermatological inventory from existing <code className="font-mono">products</code> table
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Total Items
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {stats?.totalProducts ?? 10}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Active catalog</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Low Stock
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {stats?.lowStockProducts ?? 0}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">
                  Inventory healthy
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Includes Cleansers, Moisturizers, Sunscreens</span>
            <button
              onClick={onNavigateToProducts}
              className="text-[#0b4d8c] font-medium hover:text-[#083866]"
            >
              Browse Stock
            </button>
          </div>
        </div>

        {/* Order Status Distribution Card */}
        <div className="lg:col-span-2 p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Order Status Distribution</h3>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Total: {stats?.totalOrders ?? 0}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline breakdown across fulfillment stages
          </p>

          <div className="mt-6 space-y-3.5">
            {/* Status bars */}
            {[
              {
                label: 'Pending Confirmation',
                count: stats?.pendingOrders ?? 0,
                color: 'bg-amber-500',
                status: 'pending' as OrderStatus,
              },
              {
                label: 'In Processing',
                count: stats?.processingOrders ?? 0,
                color: 'bg-sky-500',
                status: 'processing' as OrderStatus,
              },
              {
                label: 'Dispatched / In Transit',
                count: stats?.shippedOrders ?? 0,
                color: 'bg-indigo-500',
                status: 'shipped' as OrderStatus,
              },
              {
                label: 'Delivered & Completed',
                count: stats?.completedOrders ?? 0,
                color: 'bg-emerald-500',
                status: 'completed' as OrderStatus,
              },
              {
                label: 'Cancelled / Returned',
                count: stats?.cancelledOrders ?? 0,
                color: 'bg-rose-400',
                status: 'cancelled' as OrderStatus,
              },
            ].map((row) => {
              const total = stats?.totalOrders || 1;
              const pct = stats?.totalOrders ? Math.round((row.count / total) * 100) : 0;
              return (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => onNavigateToOrders(row.status)}
                      className="text-slate-700 hover:text-[#0b4d8c] font-medium"
                    >
                      {row.label}
                    </button>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="font-mono tabular-nums font-semibold text-slate-800">
                        {row.count}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${row.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${stats?.totalOrders ? pct : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest transactions recorded in the store database
            </p>
          </div>
          <button
            onClick={() => onNavigateToOrders('all')}
            className="text-xs font-semibold text-[#0b4d8c] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Open Complete Orders Page <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ordered Skincare Products Spotlight Strip */}
        {orderedProductsSummary.length > 0 && (
          <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">
              Ordered Products in Store ({orderedProductsSummary.length}):
            </span>
            {orderedProductsSummary.map((item) => (
              <button
                key={item.name}
                onClick={() => onNavigateToOrders('all', item.name)}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 hover:border-[#0b4d8c] hover:bg-sky-50/60 transition-all text-slate-800 shadow-2xs cursor-pointer"
                title={`Click to view all orders containing ${item.name}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0b4d8c] group-hover:scale-125 transition-transform" />
                <span className="font-semibold text-slate-900 group-hover:text-[#0b4d8c]">
                  {item.name}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#0b4d8c] bg-sky-50 group-hover:bg-sky-100 px-1.5 py-0.5 rounded border border-sky-100">
                  {item.orderCount} {item.orderCount === 1 ? 'order' : 'orders'}
                </span>
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">No Orders Recorded Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No orders are currently in the database, or RLS policies require authenticated configuration.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onNewOrder}
                className="px-4 py-2 text-xs font-medium text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors shadow-xs"
              >
                Create Sample Order
              </button>
              <button
                onClick={onOpenRlsGuide}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Check RLS Guide
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="py-3 px-6">Customer & Phone</th>
                  <th className="py-3 px-6">Ordered Item(s)</th>
                  <th className="py-3 px-6">Delivery City</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Order Total</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const items = order.order_items || [];
                  return (
                    <tr
                      key={order.id}
                      onClick={() => onOpenOrder(order)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        <div>{order.customer_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {order.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        {items.length > 0 ? (
                          <div className="space-y-1.5 max-w-[280px]">
                            {items.map((it, idx) => (
                              <div
                                key={it.id || idx}
                                className="p-2 rounded-lg bg-sky-50/40 border border-sky-100/70 group-hover:bg-sky-50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <span className="font-semibold text-slate-900 leading-snug">
                                    {it.product_name}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-[#0b4d8c] bg-white px-1.5 py-0.5 rounded border border-sky-200 shrink-0">
                                    ×{it.quantity}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center gap-1.5">
                                  <span>{formatCurrency(it.unit_price)} each</span>
                                  {it.subtotal && it.quantity > 1 && (
                                    <>
                                      <span aria-hidden="true" className="text-slate-300">·</span>
                                      <span className="font-semibold text-slate-700">Subtotal: {formatCurrency(it.subtotal)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No items recorded</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        <div>{order.city}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {order.address}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 font-mono tabular-nums whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md uppercase tracking-wider ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenOrder(order);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-[#0b4d8c] hover:bg-sky-50 rounded transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
