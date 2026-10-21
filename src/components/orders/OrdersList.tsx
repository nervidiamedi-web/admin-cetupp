import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Package,
  Calendar,
  ShieldAlert,
  ArrowUpDown,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import { getOrders, updateOrder, deleteOrder } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/supabase';
import type { OrderWithItems, OrderStatus } from '../../types/database';
import { OrderDetailModal } from './OrderDetailModal';
import { OrderEditModal } from './OrderEditModal';
import { OrderCreateModal } from './OrderCreateModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface OrdersListProps {
  initialStatusFilter?: OrderStatus | 'all';
  initialSearchQuery?: string;
  onOpenRlsGuide: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({
  initialStatusFilter = 'all',
  initialSearchQuery = '',
  onOpenRlsGuide,
  showToast,
}) => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRlsBlocked, setIsRlsBlocked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery || '');
  const [sortBy, setSortBy] = useState<'created_at' | 'total' | 'customer_name' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      setPage(1);
    }
  }, [initialSearchQuery]);

  // Modal States
  const [activeOrderForDetail, setActiveOrderForDetail] = useState<OrderWithItems | null>(null);
  const [activeOrderForEdit, setActiveOrderForEdit] = useState<OrderWithItems | null>(null);
  const [activeOrderForDelete, setActiveOrderForDelete] = useState<OrderWithItems | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Sync initialStatusFilter if changed from parent
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
      setPage(1);
    }
  }, [initialStatusFilter]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsRlsBlocked(false);

    try {
      const res = await getOrders({
        page,
        pageSize,
        status: statusFilter,
        search: searchQuery,
        sortBy,
        sortOrder,
      });

      if (res.error) {
        setError(res.error);
        if (res.isRlsBlocked) setIsRlsBlocked(true);
      } else {
        setOrders(res.orders);
        setTotalCount(res.totalCount);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const res = await updateOrder(orderId, { status: newStatus });
    if (res.error) {
      showToast('error', 'Status Update Failed', res.error);
      return;
    }
    showToast('success', 'Order Updated', `Status changed to ${newStatus}`);
    // Update local state
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (activeOrderForDetail?.id === orderId) {
      setActiveOrderForDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteConfirm = async (orderId: string) => {
    const res = await deleteOrder(orderId);
    if (res.error) {
      showToast('error', 'Deletion Denied', res.error);
      return;
    }
    showToast('success', 'Order Deleted', 'Order and associated line items were removed.');
    loadOrders();
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'processing':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'shipped':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'delivered':
      case 'completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'cancelled':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Orders Management
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Customer Fulfillments</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{totalCount} total orders recorded</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0b4d8c]' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Order
          </button>
        </div>
      </div>

      {/* RLS Policy Notice if needed */}
      {isRlsBlocked && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Supabase Row-Level Security Restriction
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Supabase returned code 42501 (permission denied). The authenticated user needs a SELECT policy on the <code className="font-mono">orders</code> table.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenRlsGuide}
            className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shrink-0 shadow-2xs"
          >
            View SQL Configuration
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* Status Filter Tabs (Segmented controls) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(
            [
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'processing', label: 'Processing' },
              { id: 'shipped', label: 'Shipped' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-[#0b4d8c] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ordered item name, customer, phone, city..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4d8c] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="text-slate-400 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0b4d8c]"
            >
              <option value="created_at">Order Date</option>
              <option value="total">Order Total</option>
              <option value="customer_name">Customer Name</option>
              <option value="status">Status</option>
            </select>

            <button
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                setPage(1);
              }}
              className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
              title={`Sorting ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="uppercase text-[10px] font-mono font-semibold">{sortOrder}</span>
            </button>
          </div>
        </div>

        {/* Quick Filter by Product Name */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-2 border-t border-slate-100">
          <span className="text-slate-400 shrink-0 font-medium">Filter by Ordered Product:</span>
          {[
            { label: 'Gentle Skin Cleanser', query: 'Cetaphil Gentle Skin Cleanser' },
            { label: 'Baby Daily Moisturizing Lotion', query: 'Cetaphil Baby Daily Moisturizing Lotion' },
            { label: 'Baby Daily Lotion', query: 'Cetaphil Baby Daily Lotion' },
            { label: 'Oily Skin Cleanser', query: 'Cetaphil Oily Skin Cleanser' },
          ].map(({ label, query }) => (
            <button
              key={query}
              onClick={() => {
                setSearchQuery(searchQuery === query ? '' : query);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 border ${
                searchQuery === query
                  ? 'bg-sky-100 border-sky-300 text-[#0b4d8c] font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="text-[#0b4d8c] hover:underline text-[11px] px-1.5 font-medium shrink-0"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900">
                {searchQuery || statusFilter !== 'all' ? 'No Matching Orders' : 'No Orders Found'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try modifying your search query or selecting a different status filter.'
                  : 'Your database has zero orders, or an RLS policy is restricting read operations.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors shadow-2xs"
              >
                Create New Order
              </button>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[11px]">
                  <tr>
                    <th className="py-3 px-6">Customer Name & Phone</th>
                    <th className="py-3 px-6">Delivery Address</th>
                    <th className="py-3 px-6">Ordered Item(s)</th>
                    <th className="py-3 px-6">Date Placed</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Total Amount</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const items = order.order_items || [];
                    const itemCount = items.length;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setActiveOrderForDetail(order)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-6 font-medium text-slate-900">
                          <div>{order.customer_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {order.phone || 'No phone'}
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="font-medium text-slate-700">{order.city}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={order.address}>
                            {order.address}
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          {items.length > 0 ? (
                            <div className="space-y-1.5 min-w-[220px] max-w-[340px]">
                              {items.map((it, idx) => (
                                <div key={it.id || idx} className="text-xs">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <span className="font-semibold text-slate-900 leading-snug">
                                      {it.product_name}
                                    </span>
                                    <span className="font-mono text-[11px] text-[#0b4d8c] font-bold shrink-0">
                                      ×{it.quantity}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
                                    <span>{formatCurrency(it.unit_price)} each</span>
                                    {it.products?.size && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-300">·</span>
                                        <span className="font-sans text-slate-400">{it.products.size}</span>
                                      </>
                                    )}
                                    {it.quantity > 1 && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-300">·</span>
                                        <span className="text-slate-700 font-semibold">{formatCurrency(it.subtotal)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic">No item details</div>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500 font-mono tabular-nums whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md uppercase tracking-wider border ${getStatusBadgeStyle(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setActiveOrderForDetail(order)}
                              className="p-1.5 text-slate-500 hover:text-[#0b4d8c] hover:bg-sky-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setActiveOrderForEdit(order)}
                              className="p-1.5 text-slate-500 hover:text-[#0b4d8c] hover:bg-sky-50 rounded-lg transition-colors"
                              title="Edit Order"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setActiveOrderForDelete(order)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-slate-400">·</span>
                <span className="font-mono tabular-nums">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono tabular-nums px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <OrderDetailModal
        order={activeOrderForDetail}
        isOpen={Boolean(activeOrderForDetail)}
        onClose={() => setActiveOrderForDetail(null)}
        onEdit={(ord) => {
          setActiveOrderForDetail(null);
          setActiveOrderForEdit(ord);
        }}
        onDelete={(ord) => {
          setActiveOrderForDetail(null);
          setActiveOrderForDelete(ord);
        }}
        onStatusChange={handleStatusChange}
      />

      <OrderEditModal
        order={activeOrderForEdit}
        isOpen={Boolean(activeOrderForEdit)}
        onClose={() => setActiveOrderForEdit(null)}
        onSaved={() => {
          showToast('success', 'Order Saved', 'Customer details and items were updated successfully.');
          loadOrders();
        }}
      />

      <OrderCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={() => {
          showToast('success', 'Order Created', 'New order was added to the database.');
          loadOrders();
        }}
      />

      <DeleteConfirmModal
        order={activeOrderForDelete}
        isOpen={Boolean(activeOrderForDelete)}
        onClose={() => setActiveOrderForDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
