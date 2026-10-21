import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, X, Database, Key } from 'lucide-react';
import { AUTHORIZED_ADMIN_UID, SUPABASE_URL } from '../../lib/supabase';

interface RlsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  specificTable?: string;
}

export const RlsHelpModal: React.FC<RlsHelpModalProps> = ({ isOpen, onClose, specificTable }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const sqlGuide = `-- ====================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) CONFIGURATION FOR ORDER MANAGEMENT
-- Run in your Supabase SQL Editor: ${SUPABASE_URL}
-- ====================================================================

-- 1. Ensure public.is_dashboard_admin() function exists and checks admin UID
CREATE OR REPLACE FUNCTION public.is_dashboard_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dashboard_admins
    WHERE user_id = auth.uid()
  ) OR (auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);
$$;

-- 2. Grant permissions on dashboard_admins
ALTER TABLE public.dashboard_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view dashboard_admins"
ON public.dashboard_admins FOR SELECT
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

-- 3. Configure RLS Policies on 'orders'
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on orders"
ON public.orders FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid)
WITH CHECK (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

-- 4. Configure RLS Policies on 'order_items'
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on order_items"
ON public.order_items FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert order_items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

CREATE POLICY "Admins can update order_items"
ON public.order_items FOR UPDATE
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

CREATE POLICY "Admins can delete order_items"
ON public.order_items FOR DELETE
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

-- 5. Products table (allows read access to everyone / authenticated admins)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
ON public.products FOR SELECT
USING (true);
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlGuide);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0b4d8c] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#0b4d8c]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Supabase Security & RLS Policy Guide
              </h3>
              <p className="text-xs text-slate-500">
                {specificTable ? `Configuring permissions for '${specificTable}'` : 'Row-Level Security setup instructions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600">
          <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-100 text-sky-950 flex items-start gap-3">
            <Key className="w-5 h-5 text-[#0b4d8c] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-[#0b4d8c]">
                Authorized Admin User UID: <span className="font-mono text-slate-900 select-all">{AUTHORIZED_ADMIN_UID}</span>
              </p>
              <p className="text-slate-600">
                When RLS is active in Supabase, authenticated admins must have corresponding policies to read, modify, and delete rows in <code className="text-slate-900 font-mono">orders</code>, <code className="text-slate-900 font-mono">order_items</code>, and <code className="text-slate-900 font-mono">dashboard_admins</code>.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-500" />
                Recommended SQL Setup Script
              </label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#0b4d8c] bg-sky-50 hover:bg-sky-100 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy SQL'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-64 leading-relaxed">
              {sqlGuide}
            </pre>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <p>1. Open your Supabase Project Dashboard at <span className="font-mono text-slate-700">{SUPABASE_URL}</span></p>
            <p>2. Navigate to <strong>SQL Editor</strong> &gt; <strong>New Query</strong></p>
            <p>3. Paste the SQL script above and click <strong>Run</strong></p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
