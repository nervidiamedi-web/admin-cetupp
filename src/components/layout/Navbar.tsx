import React from 'react';
import { LogOut, User, Database, Plus } from 'lucide-react';
import { useAuth } from '../../lib/authContext';

export type NavTab = 'overview' | 'orders' | 'products' | 'database';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onNewOrder: () => void;
  onOpenRlsGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onNewOrder,
  onOpenRlsGuide,
}) => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
        {/* Zone 1: Single Brand wordmark element */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('overview')}
            className="text-lg font-bold tracking-tight text-[#0b4d8c] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 focus:outline-none"
          >
            Order Admin
          </button>
        </div>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onTabChange('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'overview'
                ? 'text-[#0b4d8c] font-semibold border-b-2 border-[#0b4d8c]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onTabChange('orders')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'orders'
                ? 'text-[#0b4d8c] font-semibold border-b-2 border-[#0b4d8c]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => onTabChange('products')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'products'
                ? 'text-[#0b4d8c] font-semibold border-b-2 border-[#0b4d8c]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => onTabChange('database')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'database'
                ? 'text-[#0b4d8c] font-semibold border-b-2 border-[#0b4d8c]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Database & Setup
          </button>
        </nav>

        {/* Zone 3: 1 primary action & admin profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNewOrder}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0b4d8c] hover:bg-[#083866] active:bg-[#06294d] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Order
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* User Email & Sign Out */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs text-slate-500 max-w-[130px] sm:max-w-[160px] truncate hidden md:inline-block"
              title={user?.email || 'Admin'}
            >
              {user?.email}
            </span>
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-slate-50/70 px-2 py-2">
        <button
          onClick={() => onTabChange('overview')}
          className={`px-3 py-1 text-xs font-medium rounded-lg ${
            currentTab === 'overview'
              ? 'bg-white text-[#0b4d8c] font-semibold shadow-xs'
              : 'text-slate-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onTabChange('orders')}
          className={`px-3 py-1 text-xs font-medium rounded-lg ${
            currentTab === 'orders'
              ? 'bg-white text-[#0b4d8c] font-semibold shadow-xs'
              : 'text-slate-600'
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => onTabChange('products')}
          className={`px-3 py-1 text-xs font-medium rounded-lg ${
            currentTab === 'products'
              ? 'bg-white text-[#0b4d8c] font-semibold shadow-xs'
              : 'text-slate-600'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => onTabChange('database')}
          className={`px-3 py-1 text-xs font-medium rounded-lg ${
            currentTab === 'database'
              ? 'bg-white text-[#0b4d8c] font-semibold shadow-xs'
              : 'text-slate-600'
          }`}
        >
          Setup
        </button>
      </div>
    </header>
  );
};
