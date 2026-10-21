import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle, Check } from 'lucide-react';
import { createOrder, getProducts } from '../../lib/api';
import { formatCurrency } from '../../lib/supabase';
import type { Product, OrderStatus } from '../../types/database';

interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

interface NewOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export const OrderCreateModal: React.FC<OrderCreateModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [items, setItems] = useState<NewOrderItem[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setPhone('');
      setAddress('');
      setCity('');
      setStatus('pending');
      setErrorMessage(null);

      // Fetch active catalog products
      getProducts({ activeOnly: true }).then((res) => {
        if (res.data && res.data.length > 0) {
          setProductsList(res.data);
          setSelectedProductId(res.data[0].id);

          // Pre-populate with first item as a helpful starting point
          const first = res.data[0];
          setItems([
            {
              product_id: first.id,
              product_name: first.name,
              quantity: 1,
              unit_price: first.price,
              subtotal: first.price,
            },
          ]);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const prod = productsList.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // If item already in cart, increment qty
    const existingIndex = items.findIndex((it) => it.product_id === prod.id);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx !== existingIndex) return it;
          const qty = it.quantity + 1;
          return { ...it, quantity: qty, subtotal: qty * it.unit_price };
        })
      );
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        product_id: prod.id,
        product_name: prod.name,
        quantity: 1,
        unit_price: prod.price,
        subtotal: prod.price,
      },
    ]);
  };

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

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Customer name is required.');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('City is required.');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Street address is required.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one product item to the order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder(
        {
          customer_name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          status,
          total: totalAmount,
        },
        items
      );

      if (result.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      onOrderCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create order';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#0b4d8c] flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5 text-[#0b4d8c]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Create New Order
              </h3>
              <p className="text-xs text-slate-500">
                Record a phone order or manual store transaction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
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

            {/* Customer Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Kasun Jayawardena"
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
                  placeholder="+94 71 987 6543"
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
                  placeholder="e.g. Colombo, Kandy, Negombo"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4d8c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Initial Status
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
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Full Street Address *
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="House or unit number, street address, landmarks"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4d8c] resize-none"
              />
            </div>

            {/* Line Items Picker */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select Skincare Products ({items.length})
                </span>
                <span className="text-xs font-mono font-semibold text-[#0b4d8c] tabular-nums">
                  Total: {formatCurrency(totalAmount)}
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
                  onClick={handleAddItem}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Order
                </button>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="p-4 text-center bg-slate-50/50 rounded-xl text-slate-400 text-xs">
                  No products added yet. Choose a product from the list above.
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div
                      key={it.product_id + idx}
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

                      <div className="w-24 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(it.subtotal)}
                      </div>

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
              Order Total: <strong className="text-slate-900 font-bold">{formatCurrency(totalAmount)}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors shadow-xs disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Order...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Order</span>
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
