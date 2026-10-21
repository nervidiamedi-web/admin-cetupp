import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertCircle, ShoppingBag } from 'lucide-react';
import { updateOrder, updateOrderItems, getProducts } from '../../lib/api';
import { formatCurrency } from '../../lib/supabase';
import type { OrderWithItems, OrderStatus, Product } from '../../types/database';

interface OrderEditModalProps {
  order: OrderWithItems | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface EditableItem {
  id?: number;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize data when modal opens
  useEffect(() => {
    if (order && isOpen) {
      setCustomerName(order.customer_name || '');
      setPhone(order.phone || '');
      setAddress(order.address || '');
      setCity(order.city || '');
      setStatus(order.status || 'pending');
      setErrorMessage(null);

      // Map existing items
      const mappedItems: EditableItem[] = (order.order_items || []).map((it) => ({
        id: it.id,
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal: it.subtotal,
      }));
      setItems(mappedItems);

      // Load products for adding items
      getProducts({ activeOnly: true }).then((res) => {
        if (res.data) {
          setProductsList(res.data);
          if (res.data.length > 0) setSelectedProductId(res.data[0].id);
        }
      });
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleQuantityChange = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        return {
          ...it,
          quantity: qty,
          subtotal: qty * it.unit_price,
        };
      })
    );
  };

  const handleUnitPriceChange = (index: number, newPrice: number) => {
    const price = Math.max(0, newPrice);
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        return {
          ...it,
          unit_price: price,
          subtotal: it.quantity * price,
        };
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = () => {
    const prod = productsList.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check if item already exists in list
    const existingIndex = items.findIndex((it) => it.product_id === prod.id);
    if (existingIndex >= 0) {
      handleQuantityChange(existingIndex, items[existingIndex].quantity + 1);
      return;
    }

    const newItem: EditableItem = {
      product_id: prod.id,
      product_name: prod.name,
      quantity: 1,
      unit_price: prod.price,
      subtotal: prod.price,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const calculatedTotal = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Customer name is required.');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('City is required for delivery.');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Delivery address is required.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update order fields and total
      const orderRes = await updateOrder(order.id, {
        customer_name: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        status,
        total: calculatedTotal,
      });

      if (orderRes.error) {
        setErrorMessage(orderRes.error);
        setIsSaving(false);
        return;
      }

      // 2. Update line items
      const itemsRes = await updateOrderItems(order.id, items);
      if (itemsRes.error) {
        setErrorMessage(itemsRes.error);
        setIsSaving(false);
        return;
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update order';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Edit Order
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Order ID: {order.id}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden" noValidate>
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Status & Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4d8c]"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Priyantha Silva"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4d8c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4d8c] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Delivery City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Colombo 03, Kandy, Galle"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4d8c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Street Address *
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Building, street name, apartment or suite"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4d8c] resize-none"
              />
            </div>

            {/* Line Items Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Order Line Items ({items.length})
                </span>
                <span className="text-xs font-mono font-semibold text-[#0b4d8c] tabular-nums">
                  Calculated Total: {formatCurrency(calculatedTotal)}
                </span>
              </div>

              {/* Add item control */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  {productsList.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({formatCurrency(prod.price)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="p-4 text-center bg-slate-50/50 rounded-xl text-slate-400 text-xs">
                  No line items. Use the selector above to add products.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {it.product_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {formatCurrency(it.unit_price)} each
                        </div>
                      </div>

                      {/* Quantity input */}
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Qty:</span>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={it.quantity}
                          onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 text-center font-mono text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="w-24 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(it.subtotal)}
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Total: <strong className="text-slate-900">{formatCurrency(calculatedTotal)}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors shadow-xs disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
