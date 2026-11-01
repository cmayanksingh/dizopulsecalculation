import React from 'react';
import { 
  Landmark, 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function FinancialSummary({ overview, sales = [], onMarkPaid }) {
  const pendingSales = sales.filter(s => s.pending_amount > 0 && s.status !== 'Refunded');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Landmark className="w-5 h-5 text-emerald-600" />
          <span>Financial Summary & Cash Reconciliation</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Strict separation of Accrual Revenue vs Actual Cash Received (Zero unpaid inflation)
        </p>
      </div>

      {/* 6 Required Financial Pillars (Section 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Money Received */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Total Money Received</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatINR(overview?.totalMoneyReceived || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Actual cash collected in bank/hand from paid and partial orders
            </p>
          </div>
        </div>

        {/* Total Money Pending */}
        <div className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">2. Total Money Pending</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatINR(overview?.totalMoneyPending || 0)}
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
              Unpaid customer receivables (Strictly isolated from cash balance)
            </p>
          </div>
        </div>

        {/* Total Money Spent */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">3. Total Money Spent</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatINR(overview?.totalMoneySpent || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Actual supplier payments + all operational business expenses paid
            </p>
          </div>
        </div>

        {/* Total Purchase Cost */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">4. Total Purchase Cost</span>
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {formatINR(overview?.totalPurchaseCost || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total historical value of product inventory batches acquired
            </p>
          </div>
        </div>

        {/* Current Cash Balance */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl relative overflow-hidden sm:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                5. Current Available Cash Balance
              </span>
              <p className="text-xs text-emerald-100 mt-0.5">
                Lifetime Cash In (Capital + Collected Sales) − Lifetime Cash Out (Purchases + Expenses)
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/20 text-white">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <div className="text-3xl sm:text-4xl font-black font-mono">
              {formatINR(overview?.availableBalance || 0)}
            </div>
            <span className="text-xs font-bold text-emerald-100">
              100% Liquid Cash in Bank/Hand
            </span>
          </div>
        </div>

        {/* Overall Business Profit */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl relative overflow-hidden sm:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                6. Overall Business Profit (Net Performance)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Gross Profit − Total Operating Expenses
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-300">
              Net Profit Margin: {overview?.profitMargin || 0}%
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-3xl sm:text-4xl font-black font-mono text-white">
              {formatINR(overview?.netProfit || 0)}
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              {overview?.isNetLoss ? 'Operating at Net Loss' : 'Healthy Profitable Operation'}
            </span>
          </div>
        </div>
      </div>

      {/* Strict Accounting Rule Notice */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <span className="font-extrabold text-slate-900 dark:text-white block">
            Accounting Integrity Standard: Separation of Unpaid Receivables
          </span>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Unpaid sales ({formatINR(overview?.pendingPayments || 0)}) are categorized strictly as <strong>Pending Receivables</strong> on the accrual side. Under no circumstances are unpaid sales included in your Available Cash Balance. Only funds physically received via UPI, Bank Transfer, Card, or Cash are reconciled as cash in hand.
          </p>
        </div>
      </div>

      {/* Unpaid Customer Receivables Section with Fast Collection */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Pending Receivables Ledger ({pendingSales.length} Invoices Due)
            </h3>
            <p className="text-xs text-slate-400">
              Customer orders with outstanding pending balances awaiting collection
            </p>
          </div>
          <span className="text-xs font-bold text-amber-600 font-mono">
            Total Due: {formatINR(overview?.pendingPayments || 0)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Sale ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3 text-right">Order Total</th>
                <th className="py-3 px-3 text-right">Paid So Far</th>
                <th className="py-3 px-3 text-right">Pending Due</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {pendingSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Great news! No pending customer payments. All sales are 100% paid!
                  </td>
                </tr>
              ) : (
                pendingSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-slate-400">#{s.id}</td>
                    <td className="py-3 px-3 text-xs text-slate-500">{s.sale_date}</td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{s.customer_name || 'Walk-in'}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{s.product_name}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatINR(s.total_amount)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600">{formatINR(s.amount_received)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">{formatINR(s.pending_amount)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onMarkPaid(s)}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 ml-auto"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Collect Balance
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
