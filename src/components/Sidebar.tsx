import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Truck,
  CheckSquare,
  Building2,
  TrendingUp,
  Bot,
  RotateCcw,
  Package,
} from 'lucide-react';

export type NavScreen =
  | 'dashboard'
  | 'orders'
  | 'intake'
  | 'receiving'
  | 'approvals'
  | 'suppliers'
  | 'supplier_portal'
  | 'copilot';

interface SidebarProps {
  activeScreen: NavScreen;
  onSelectScreen: (screen: NavScreen) => void;
  pendingApprovalsCount: number;
  activeOrdersCount: number;
  onResetSeed: () => void;
  isProcessing: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  pendingApprovalsCount,
  activeOrdersCount,
  onResetSeed,
  isProcessing,
}) => {
  const navItems: { screen: NavScreen; label: string; icon: any; badge?: number }[] = [
    { screen: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { screen: 'orders', label: 'Orders & Tracking', icon: ClipboardList, badge: activeOrdersCount },
    { screen: 'intake', label: 'New Requisition', icon: PlusCircle },
    { screen: 'receiving', label: 'Receiving Dock', icon: Truck },
    { screen: 'approvals', label: 'Manager Approvals', icon: CheckSquare, badge: pendingApprovalsCount },
    { screen: 'suppliers', label: 'Supplier League', icon: TrendingUp },
    { screen: 'supplier_portal', label: 'Supplier Portal', icon: Building2 },
    { screen: 'copilot', label: 'Logistics Copilot', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold text-base shadow-sm">
          FM
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
            FreshMart Logistics
          </h1>
          <span className="text-[11px] text-slate-400 block font-medium">
            Order Autopilot Hub
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Supply Chain Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.screen;

          return (
            <button
              key={item.screen}
              onClick={() => onSelectScreen(item.screen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                    isActive ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Context & Footer */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Hub</div>
          <div className="text-white font-medium text-xs mt-0.5">Central Warehouse Dock #4</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Autopilot Engine Live</span>
          </div>
        </div>

        <button
          onClick={onResetSeed}
          disabled={isProcessing}
          title="Restore database to pristine initial state"
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
  );
};
