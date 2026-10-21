import React from 'react';
import { ShieldAlert, LogOut, ArrowLeft, Key, UserCheck } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { AUTHORIZED_ADMIN_UID } from '../../lib/supabase';

export const UnauthorizedView: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Unauthorized Account
          </h2>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            You are signed in, but your user identifier is not registered in the{' '}
            <code className="text-slate-900 font-mono font-semibold">dashboard_admins</code> table and did not pass{' '}
            <code className="text-slate-900 font-mono font-semibold">is_dashboard_admin()</code> verification.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
              Current Signed-In Email
            </span>
            <span className="font-medium text-slate-800 break-all">{user?.email || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
              Current User UID
            </span>
            <span className="font-mono text-slate-800 break-all select-all">{user?.id || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
              Expected Admin UID
            </span>
            <span className="font-mono text-[#0b4d8c] break-all select-all">{AUTHORIZED_ADMIN_UID}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-[#0b4d8c] hover:bg-[#083866] transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};
