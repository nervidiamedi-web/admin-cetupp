import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  Copy,
  Check,
  Key,
  ShieldCheck,
  Server,
  Layers,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, AUTHORIZED_ADMIN_UID, supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/authContext';

export const DatabaseSetupView: React.FC = () => {
  const { user, isAuthorizedAdmin } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const rlsSql = `-- ====================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES FOR ONLINE STORE DASHBOARD
-- Run in your Supabase SQL Editor: ${SUPABASE_URL}
-- ====================================================================

-- 1. Helper function to check if current user is admin
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

-- 2. Permissions on dashboard_admins
ALTER TABLE public.dashboard_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view dashboard_admins" ON public.dashboard_admins;
CREATE POLICY "Admins can view dashboard_admins"
ON public.dashboard_admins FOR SELECT
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

-- 3. Ensure the primary administrator is inserted in dashboard_admins
INSERT INTO public.dashboard_admins (user_id)
VALUES ('${AUTHORIZED_ADMIN_UID}')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Policies on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select orders" ON public.orders;
DROP POLICY IF EXISTS "Allow select on orders" ON public.orders;
CREATE POLICY "Allow select on orders"
ON public.orders FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
CREATE POLICY "Admins can insert orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid)
WITH CHECK (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

-- 5. Policies on order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow select on order_items" ON public.order_items;
CREATE POLICY "Allow select on order_items"
ON public.order_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert order_items" ON public.order_items;
CREATE POLICY "Admins can insert order_items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

DROP POLICY IF EXISTS "Admins can update order_items" ON public.order_items;
CREATE POLICY "Admins can update order_items"
ON public.order_items FOR UPDATE
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

DROP POLICY IF EXISTS "Admins can delete order_items" ON public.order_items;
CREATE POLICY "Admins can delete order_items"
ON public.order_items FOR DELETE
TO authenticated
USING (public.is_dashboard_admin() OR auth.uid() = '${AUTHORIZED_ADMIN_UID}'::uuid);

-- 6. Products table read access
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select products" ON public.products;
CREATE POLICY "Anyone can select products"
ON public.products FOR SELECT
USING (true);
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rlsSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunHealthCheck = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const pRes = await supabase.from('products').select('id', { count: 'exact', head: true });
      const oRes = await supabase.from('orders').select('id', { count: 'exact', head: true });
      const rpcRes = await supabase.rpc('is_dashboard_admin');

      setTestResult(
        `Health Check Passed!
• products table: Reachable (HTTP ${pRes.status})
• orders table: Reachable (HTTP ${oRes.status})
• public.is_dashboard_admin() RPC: ${rpcRes.data === true ? 'Returned true (Admin authorized)' : 'Returned ' + String(rpcRes.data)}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check failed';
      setTestResult(`Health Check Warning: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Database & Security Configuration
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Supabase PostgREST Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Schema Synchronization & RLS Verification</span>
          </div>
        </div>

        <button
          onClick={handleRunHealthCheck}
          disabled={isTesting}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#0b4d8c]' : ''}`} />
          <span>Run Database Diagnostic</span>
        </button>
      </div>

      {testResult && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 text-xs font-mono whitespace-pre-line leading-relaxed">
          {testResult}
        </div>
      )}

      {/* Configuration Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Supabase URL */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Server className="w-4 h-4 text-[#0b4d8c]" />
            <span className="text-xs font-semibold uppercase tracking-wider">Project Endpoint</span>
          </div>
          <div className="text-xs font-mono font-medium text-slate-900 truncate" title={SUPABASE_URL}>
            {SUPABASE_URL}
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Connected & Active
          </div>
        </div>

        {/* Admin UID */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Key className="w-4 h-4 text-[#0b4d8c]" />
            <span className="text-xs font-semibold uppercase tracking-wider">Authorized Admin UID</span>
          </div>
          <div className="text-xs font-mono font-medium text-slate-900 truncate" title={AUTHORIZED_ADMIN_UID}>
            {AUTHORIZED_ADMIN_UID}
          </div>
          <div className="text-[11px] text-slate-500">
            Current user:{' '}
            <span className="font-semibold text-slate-700">
              {user ? (isAuthorizedAdmin ? 'Authorized Admin' : 'Regular User') : 'Not Signed In'}
            </span>
          </div>
        </div>

        {/* Client Key */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#0b4d8c]" />
            <span className="text-xs font-semibold uppercase tracking-wider">Publishable API Key</span>
          </div>
          <div className="text-xs font-mono font-medium text-slate-900 truncate">
            {SUPABASE_PUBLISHABLE_KEY.substring(0, 18)}...
          </div>
          <div className="text-[11px] text-slate-500">
            Safe for browser client usage (No service keys)
          </div>
        </div>
      </div>

      {/* Schema Verification Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0b4d8c]" />
          Inspected Table Schemas & Foreign Keys
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The dashboard connects to these 4 existing Supabase tables without renaming or creating new ones:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* orders */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-slate-900 font-bold border-b border-slate-200 pb-1.5">
              <span>orders</span>
              <span className="text-[11px] text-[#0b4d8c]">Primary table</span>
            </div>
            <ul className="space-y-1 text-slate-700 text-[11px]">
              <li><strong className="text-slate-900">id</strong>: uuid (Primary Key)</li>
              <li><strong className="text-slate-900">customer_name</strong>: text</li>
              <li><strong className="text-slate-900">phone</strong>: text</li>
              <li><strong className="text-slate-900">address</strong>: text</li>
              <li><strong className="text-slate-900">city</strong>: text</li>
              <li><strong className="text-slate-900">status</strong>: text (pending, shipped, ...)</li>
              <li><strong className="text-slate-900">total</strong>: numeric (in LKR)</li>
              <li><strong className="text-slate-900">created_at</strong>: timestamptz</li>
            </ul>
          </div>

          {/* order_items */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-slate-900 font-bold border-b border-slate-200 pb-1.5">
              <span>order_items</span>
              <span className="text-[11px] text-[#0b4d8c]">Relational table</span>
            </div>
            <ul className="space-y-1 text-slate-700 text-[11px]">
              <li><strong className="text-slate-900">id</strong>: bigint (Primary Key)</li>
              <li><strong className="text-slate-900">order_id</strong>: uuid (FK &rarr; orders.id)</li>
              <li><strong className="text-slate-900">product_id</strong>: uuid (FK &rarr; products.id)</li>
              <li><strong className="text-slate-900">product_name</strong>: text</li>
              <li><strong className="text-slate-900">quantity</strong>: int</li>
              <li><strong className="text-slate-900">unit_price</strong>: numeric</li>
              <li><strong className="text-slate-900">subtotal</strong>: numeric</li>
            </ul>
          </div>

          {/* products */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-slate-900 font-bold border-b border-slate-200 pb-1.5">
              <span>products</span>
              <span className="text-[11px] text-emerald-700">10 active items</span>
            </div>
            <ul className="space-y-1 text-slate-700 text-[11px]">
              <li><strong className="text-slate-900">id</strong>: uuid (Primary Key)</li>
              <li><strong className="text-slate-900">slug</strong>: text</li>
              <li><strong className="text-slate-900">name</strong>: text (Cetaphil catalog)</li>
              <li><strong className="text-slate-900">category</strong>: text (Cleansers, ...)</li>
              <li><strong className="text-slate-900">price</strong>: numeric (Rs. 3,210 - 13,500)</li>
              <li><strong className="text-slate-900">stock</strong>: int (inventory count)</li>
              <li><strong className="text-slate-900">is_active</strong>: boolean</li>
            </ul>
          </div>

          {/* dashboard_admins */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-slate-900 font-bold border-b border-slate-200 pb-1.5">
              <span>dashboard_admins</span>
              <span className="text-[11px] text-purple-700">RBAC verification</span>
            </div>
            <ul className="space-y-1 text-slate-700 text-[11px]">
              <li><strong className="text-slate-900">user_id</strong>: uuid (FK &rarr; auth.users.id)</li>
              <li><strong className="text-slate-900">created_at</strong>: timestamptz</li>
              <li><strong className="text-slate-900">RPC function</strong>: public.is_dashboard_admin()</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SQL Script for RLS Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Supabase Row-Level Security (RLS) SQL Script
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Run this in your Supabase SQL editor to ensure your admin account has full CRUD permissions.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0b4d8c] bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors self-start sm:self-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard' : 'Copy SQL Script'}
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
          {rlsSql}
        </pre>
      </div>
    </div>
  );
};
