import React, { useState } from 'react';
import {
  X,
  Package,
  Clock,
  MapPin,
  Phone,
  User,
  Printer,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle,
  Truck,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/supabase';
import type { OrderWithItems, OrderStatus } from '../../types/database';

interface OrderDetailModalProps {
  order: OrderWithItems | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (order: OrderWithItems) => void;
  onDelete: (order: OrderWithItems) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !order) return null;

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    if (newStatus === order.status) return;

    setIsUpdatingStatus(true);
    try {
      await onStatusChange(order.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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

  const items = order.order_items || [];
  const itemsTotalCalculated = items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#0b4d8c] flex items-center justify-center font-bold">
              <Package className="w-5 h-5 text-[#0b4d8c]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Order Details
                </h3>
                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md border ${getStatusBadgeStyle(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {order.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Order Summary / Packing Slip"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Quick Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Placed on:</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatDate(order.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="quick-status" className="font-medium text-slate-500 text-[11px]">
                Update Status:
              </label>
              <select
                id="quick-status"
                value={order.status}
                disabled={isUpdatingStatus}
                onChange={handleStatusSelect}
                className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-[#0b4d8c]"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Ordered Item / Product Name Spotlight */}
          {items.length > 0 && (
            <div className="p-4 bg-sky-50/90 rounded-xl border border-sky-200/70 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b4d8c] block">
                Ordered Skincare Item(s) in this Order ({items.length})
              </span>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="p-3 bg-white rounded-lg border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-slate-900 leading-snug flex items-center gap-2">
                        <span>{it.product_name}</span>
                        <span className="text-[11px] font-mono font-bold text-[#0b4d8c] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 shrink-0">
                          Qty: {it.quantity}
                        </span>
                      </div>
                      {it.products?.size && (
                        <div className="text-xs text-slate-500">
                          Specification: {it.products.size} {it.products.badge ? `· ${it.products.badge}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs font-mono font-semibold text-slate-800">
                        {formatCurrency(it.unit_price)} each
                      </span>
                      {it.subtotal && it.quantity > 1 && (
                        <div className="text-[11px] font-mono text-slate-500">
                          Total: {formatCurrency(it.subtotal)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer & Shipping Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs border-b border-slate-100 pb-2">
                <User className="w-3.5 h-3.5 text-[#0b4d8c]" />
                Customer Contact
              </div>
              <div className="space-y-1 text-slate-600">
                <div>
                  <span className="text-slate-400 text-[11px] block">Full Name</span>
                  <span className="font-medium text-slate-900 text-sm">
                    {order.customer_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Phone Number</span>
                  <span className="font-mono text-slate-800 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {order.phone || 'No phone provided'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs border-b border-slate-100 pb-2">
                <MapPin className="w-3.5 h-3.5 text-[#0b4d8c]" />
                Delivery Address
              </div>
              <div className="space-y-1 text-slate-600">
                <div>
                  <span className="text-slate-400 text-[11px] block">City</span>
                  <span className="font-medium text-slate-900 text-sm">
                    {order.city || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Street Address</span>
                  <span className="text-slate-700 leading-relaxed">
                    {order.address || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0b4d8c]" />
                Ordered Skincare Items ({items.length})
              </h4>
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                No items recorded in <code className="font-mono">order_items</code> for this order.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Item Name</th>
                      <th className="py-2.5 px-4 text-center">Qty</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">
                            {item.product_name}
                          </div>
                          {item.products?.size && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Size: {item.products.size} {item.products.badge ? `· ${item.products.badge}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80 border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 font-semibold text-slate-700 text-right">
                        Order Grand Total:
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-base text-[#0b4d8c] tabular-nums">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onDelete(order);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Order
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(order);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
