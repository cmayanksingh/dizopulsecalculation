import React from 'react';
import { 
  PlusCircle, 
  Sun, 
  Moon, 
  Menu, 
  ShoppingBag, 
  Truck, 
  Receipt, 
  Wallet,
  RefreshCw
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function Navbar({ 
  darkMode, 
  setDarkMode, 
  overview, 
  onOpenSaleModal, 
  onOpenPurchaseModal, 
  onOpenExpenseModal, 
  onRefresh,
  toggleSidebar,
  setActiveTab
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20">
              ₹
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                Apex<span className="text-emerald-600 dark:text-emerald-400">Books</span>
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Accounting & Sales Engine
              </span>
            </div>
          </div>
        </div>

        {/* Center: Available Balance Pill */}
        <div 
          onClick={() => setActiveTab('financial')}
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:border-emerald-500/50 transition-all group"
          title="Click to view full Cashflow & Financial Summary"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available Balance:</span>
          <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            {formatINR(overview?.availableBalance || 0)}
          </span>
        </div>

        {/* Right: Quick Action Buttons & Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Refresh */}
          <button
            onClick={onRefresh}
            title="Refresh All Data"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Quick Add Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Add Sale Button */}
            <button
              onClick={onOpenSaleModal}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">+ Sale</span>
              <span className="sm:hidden">+Sale</span>
            </button>

            {/* Add Purchase Button */}
            <button
              onClick={onOpenPurchaseModal}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Truck className="w-4 h-4" />
              <span>+ Purchase</span>
            </button>

            {/* Add Expense Button */}
            <button
              onClick={onOpenExpenseModal}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 active:scale-95 transition-all"
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">+ Expense</span>
              <span className="sm:hidden">+Exp</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
