import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../../lib/supabase';
import type { OrderWithItems } from '../../types/database';

interface DeleteConfirmModalProps {
  order: OrderWithItems | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !order) return null;

  const itemCount = order.order_items?.length || 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(order.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">
              Confirm Order Deletion
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              This action permanently removes the order from the database.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 font-sans">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Customer:</span>
              <span className="font-semibold text-slate-900">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">City:</span>
              <span className="text-slate-700">{order.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Order Total:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {formatCurrency(order.total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Order ID:</span>
              <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                {order.id}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Database Integrity Warning:</strong> Deleting this order will automatically delete its{' '}
              <span className="font-bold">{itemCount} related order {itemCount === 1 ? 'item' : 'items'}</span> in the{' '}
              <code className="font-mono">order_items</code> table to respect foreign-key constraints.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting Order...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
