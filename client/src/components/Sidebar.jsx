import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Truck, 
  Receipt, 
  Calculator, 
  ReceiptText, 
  BarChart3, 
  Landmark, 
  DownloadCloud,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales Management', icon: ShoppingBag },
  { id: 'purchases', label: 'Product Cost & Purchases', icon: Truck },
  { id: 'expenses', label: 'Expense Management', icon: Receipt },
  { id: 'pl', label: 'Profit & Loss Calculator', icon: Calculator },
  { id: 'transactions', label: 'Transaction History', icon: ReceiptText },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'financial', label: 'Financial Summary', icon: Landmark },
  { id: 'backup', label: 'Export & Backup', icon: DownloadCloud },
];

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, overview }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header Branding */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20">
              ₹
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white leading-none block">
                Apex Accounting
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Business OS
              </span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Core Operations
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all group
                  ${isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive ? (
                  <ChevronRight className="w-4 h-4 text-emerald-200" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Bottom Financial Mini-Card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Net Profit
              </span>
              <span className={`text-[11px] font-black px-1.5 py-0.5 rounded ${overview?.isNetLoss ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'}`}>
                {overview?.profitMargin || 0}%
              </span>
            </div>
            <div className="text-lg font-black font-mono">
              {formatINR(overview?.netProfit || 0)}
            </div>
            <div className="mt-2 text-[10px] text-slate-400 flex justify-between border-t border-slate-700/60 pt-2">
              <span>Sales: {formatINR(overview?.totalSales || 0, { decimals: 0 })}</span>
              <span>Pending: {formatINR(overview?.pendingPayments || 0, { decimals: 0 })}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
