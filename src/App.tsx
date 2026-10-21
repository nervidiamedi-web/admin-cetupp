/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { LoginView } from './components/auth/LoginView';
import { UnauthorizedView } from './components/auth/UnauthorizedView';
import { Navbar, NavTab } from './components/layout/Navbar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { OrdersList } from './components/orders/OrdersList';
import { ProductsList } from './components/products/ProductsList';
import { DatabaseSetupView } from './components/database/DatabaseSetupView';
import { OrderCreateModal } from './components/orders/OrderCreateModal';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { RlsHelpModal } from './components/common/RlsHelpModal';
import { ToastContainer, ToastMessage, ToastType } from './components/common/Toast';
import { updateOrder } from './lib/api';
import type { OrderWithItems, OrderStatus } from './types/database';
import { ShieldCheck } from 'lucide-react';

function DashboardContent() {
  const { user, isLoading, isAuthorizedAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [ordersSearchQuery, setOrdersSearchQuery] = useState<string>('');

  // Global modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isRlsModalOpen, setIsRlsModalOpen] = useState(false);
  const [inspectingOrder, setInspectingOrder] = useState<OrderWithItems | null>(null);

  // Global toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm text-[#0b4d8c] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 animate-pulse text-[#0b4d8c]" />
        </div>
        <p className="text-xs font-medium text-slate-500">
          Verifying administrator credentials...
        </p>
      </div>
    );
  }

  // Unauthenticated user -> Login Screen
  if (!user) {
    return <LoginView />;
  }

  // Authenticated, but not authorized as admin -> Unauthorized Security Wall
  if (!isAuthorizedAdmin) {
    return <UnauthorizedView />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800">
      {/* Strict 3-Zone Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onNewOrder={() => setIsNewOrderModalOpen(true)}
        onOpenRlsGuide={() => setIsRlsModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'overview' && (
          <DashboardOverview
            onNavigateToOrders={(filter, search) => {
              setOrdersStatusFilter(filter || 'all');
              setOrdersSearchQuery(search || '');
              setCurrentTab('orders');
            }}
            onNavigateToProducts={() => setCurrentTab('products')}
            onOpenOrder={(order) => setInspectingOrder(order)}
            onNewOrder={() => setIsNewOrderModalOpen(true)}
            onOpenRlsGuide={() => setIsRlsModalOpen(true)}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersList
            initialStatusFilter={ordersStatusFilter}
            initialSearchQuery={ordersSearchQuery}
            onOpenRlsGuide={() => setIsRlsModalOpen(true)}
            showToast={showToast}
          />
        )}

        {currentTab === 'products' && (
          <ProductsList onOpenRlsGuide={() => setIsRlsModalOpen(true)} />
        )}

        {currentTab === 'database' && <DatabaseSetupView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-600">Order Admin</span> · Dermatological Skincare Operations
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRlsModalOpen(true)}
              className="text-[#0b4d8c] hover:underline"
            >
              Row-Level Security Policies
            </button>
            <span aria-hidden="true">·</span>
            <span>Connected to Supabase PostgreSQL</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <OrderCreateModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderCreated={() => {
          showToast('success', 'Order Created', 'Manual order registered successfully.');
          if (currentTab !== 'orders') setCurrentTab('orders');
        }}
      />

      <OrderDetailModal
        order={inspectingOrder}
        isOpen={Boolean(inspectingOrder)}
        onClose={() => setInspectingOrder(null)}
        onEdit={(ord) => {
          setInspectingOrder(null);
          setCurrentTab('orders');
        }}
        onDelete={(ord) => {
          setInspectingOrder(null);
          setCurrentTab('orders');
        }}
        onStatusChange={async (orderId, newStatus) => {
          const res = await updateOrder(orderId, { status: newStatus });
          if (res.error) {
            showToast('error', 'Status Update Denied', res.error);
          } else {
            showToast('success', 'Status Updated', `Order changed to ${newStatus}`);
            setInspectingOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
          }
        }}
      />

      <RlsHelpModal isOpen={isRlsModalOpen} onClose={() => setIsRlsModalOpen(false)} />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
