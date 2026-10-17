import React, { useState } from 'react';
import { NavScreen } from './Sidebar.tsx';
import { Search, Plus, Bell } from 'lucide-react';

interface TopBarProps {
  activeScreen: NavScreen;
  onNewRequisition: () => void;
  onSearchOrder: (poId: string) => void;
  pendingApprovalsCount: number;
}

const SCREEN_TITLES: Record<NavScreen, string> = {
  dashboard: 'Overview Dashboard',
  orders: 'Purchase Orders & Live Tracking',
  intake: 'Create Requisition (Intake)',
  receiving: 'Cargo Receiving & Inspection Dock',
  approvals: 'Manager Exception Approvals',
  suppliers: 'Supplier League & Performance',
  supplier_portal: 'External Supplier Fulfillment Portal',
  copilot: 'AI Logistics Copilot',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeScreen,
  onNewRequisition,
  onSearchOrder,
  pendingApprovalsCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSearchOrder(searchQuery.trim().toUpperCase());
    setSearchQuery('');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6 shrink-0">
      {/* Left: Breadcrumbs Trail */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 whitespace-nowrap">
        <span>FreshMart Logistics</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold text-sm">
          {SCREEN_TITLES[activeScreen]}
        </span>
      </div>

      {/* Center: Live Order Search / Status Tracker Lookup */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Look up order status (e.g. PO-101, PO-105)..."
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
        />
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNewRequisition}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Requisition</span>
        </button>
      </div>
    </header>
  );
};
