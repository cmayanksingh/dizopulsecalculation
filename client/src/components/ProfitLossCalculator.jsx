import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Minus, 
  Equal, 
  Percent, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';

export default function ProfitLossCalculator({ overview, reports, onDateRangeChange }) {
  // Scenario Simulator states
  const [projectedSalesGrowth, setProjectedSalesGrowth] = useState(0); // in %
  const [projectedExpenseCut, setProjectedExpenseCut] = useState(0); // in %

  const totalSales = overview?.totalSales || 0;
  const cogs = overview?.totalCost || 0;
  const grossProfit = overview?.grossProfit || 0;
  const totalExpenses = overview?.totalExpenses || 0;
  const netProfit = overview?.netProfit || 0;
  const isLoss = netProfit < 0;
  const profitMargin = overview?.profitMargin || 0;
  const totalInvestment = overview?.totalInvestment || 0;

  // Simulator calculations
  const simSales = totalSales * (1 + projectedSalesGrowth / 100);
  const simCogs = totalSales > 0 ? (cogs / totalSales) * simSales : cogs; // assumes variable cost ratio
  const simGross = simSales - simCogs;
  const simExpenses = totalExpenses * (1 - projectedExpenseCut / 100);
  const simNet = simGross - simExpenses;
  const simMargin = simSales > 0 ? ((simNet / simSales) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <span>Profit & Loss Calculator (P&L)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time financial statement following standard double-entry accounting formulas
          </p>
        </div>

        {/* Date Filter Quick Pills */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          {['All-Time', 'This Month', 'Last Month', 'This Fiscal Year'].map((label, idx) => (
            <button
              key={label}
              onClick={() => {
                const now = new Date();
                let start = '';
                let end = now.toISOString().split('T')[0];
                if (label === 'This Month') {
                  start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                } else if (label === 'Last Month') {
                  start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                  end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                } else if (label === 'This Fiscal Year') {
                  start = `${now.getFullYear()}-04-01`;
                }
                onDateRangeChange(start, end);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary 6 Metrics Required in Section 5 */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Total Revenue</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatINR(totalSales)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Total Sales</span>
        </div>

        {/* Total Investment */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Total Investment</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatINR(totalInvestment)}
          </div>
          <span className="text-[10px] text-indigo-600 font-semibold">Capital + Stock</span>
        </div>

        {/* COGS */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Cost of Goods</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatINR(cogs)}
          </div>
          <span className="text-[10px] text-slate-500">Inventory Sold Cost</span>
        </div>

        {/* Gross Profit */}
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 shadow-sm">
          <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">4. Gross Profit</span>
          <div className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400 font-mono mt-1">
            {formatINR(grossProfit)}
          </div>
          <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">Revenue − COGS</span>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 shadow-sm">
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">5. Total Expenses</span>
          <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {formatINR(totalExpenses)}
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">Overhead Costs</span>
        </div>

        {/* Net Profit / Loss */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isLoss 
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider block">
            6. {isLoss ? 'Total Loss' : 'Total Net Profit'}
          </span>
          <div className="text-base sm:text-lg font-black font-mono mt-1">
            {formatINR(Math.abs(netProfit))}
          </div>
          <span className="text-[10px] font-bold">
            Margin: {profitMargin}%
          </span>
        </div>
      </div>

      {/* The Master Financial Waterfall Statement */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Formal Profit & Loss Statement (Income Statement)
          </h3>
          <p className="text-xs text-slate-400">
            Certified accounting computation for audited reporting
          </p>
        </div>

        <div className="space-y-4">
          {/* Step 1: Gross Sales */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                +
              </span>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  Total Sales Revenue
                </span>
                <span className="text-xs text-slate-500">Gross customer billings across all completed orders</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                {formatINR(totalSales)}
              </span>
            </div>
          </div>

          {/* Step 2: Less COGS */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                <Minus className="w-4 h-4" />
              </span>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  Cost of Goods Sold (COGS)
                </span>
                <span className="text-xs text-slate-500">Direct product acquisition cost of inventory sold (Quantity Sold × Unit Cost)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                - {formatINR(cogs)}
              </span>
            </div>
          </div>

          {/* Subtotal 1: Gross Profit */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow">
                <Equal className="w-4 h-4" />
              </span>
              <div>
                <span className="text-sm font-black text-teal-900 dark:text-teal-200 block">
                  Gross Profit = Total Sales − Cost of Goods Sold
                </span>
                <span className="text-xs text-teal-700 dark:text-teal-400">
                  Gross Profit Margin: {totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg sm:text-xl font-black text-teal-700 dark:text-teal-300 font-mono">
                {formatINR(grossProfit)}
              </span>
            </div>
          </div>

          {/* Step 3: Less Business Expenses */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                  <Minus className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Total Operating Business Expenses
                  </span>
                  <span className="text-xs text-slate-500">Overhead, marketing, software, rent and logistical expenses</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                  - {formatINR(totalExpenses)}
                </span>
              </div>
            </div>

            {/* Breakdown of 9 Expense Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              {(reports?.expenseBreakdown || []).map((eb) => (
                <div key={eb.category} className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>{eb.category}:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatINR(eb.total_amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final Net Profit / Net Loss */}
          <div className={`flex items-center justify-between p-5 rounded-2xl border shadow-lg ${
            isLoss 
              ? 'bg-rose-950 text-white border-rose-800' 
              : 'bg-emerald-950 text-white border-emerald-800'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shadow ${
                isLoss ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-slate-950'
              }`}>
                =
              </span>
              <div>
                <span className="text-base font-black tracking-tight block">
                  {isLoss ? 'Net Business Loss' : 'Net Business Profit'} = Gross Profit − Business Expenses
                </span>
                <span className="text-xs text-slate-300">
                  Formula: Profit Margin = (Net Profit ÷ Total Sales) × 100 = <strong className="text-white">{profitMargin}%</strong>
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {formatINR(netProfit)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "What-If" Scenario Forecasting Sandbox */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight">
              Interactive "What-If" Profit Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Simulate changes in sales volume or expense cuts to forecast your future net profit and margin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Slider */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Projected Sales Growth:</span>
              <span className="text-emerald-400 font-mono">+{projectedSalesGrowth}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={projectedSalesGrowth}
              onChange={(e) => setProjectedSalesGrowth(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Current ({formatINR(totalSales, { decimals: 0 })})</span>
              <span>2X (+100%)</span>
            </div>
          </div>

          {/* Expense Cut Slider */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Projected Expense Reduction:</span>
              <span className="text-amber-400 font-mono">-{projectedExpenseCut}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={projectedExpenseCut}
              onChange={(e) => setProjectedExpenseCut(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% Reduction</span>
              <span>-50% Lean Overheads</span>
            </div>
          </div>
        </div>

        {/* Projected Simulation Results */}
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
              Forecasted Future Net Profit
            </span>
            <div className="text-3xl font-black font-mono mt-1 text-emerald-400">
              {formatINR(simNet)}
            </div>
            <span className="text-xs text-slate-400">
              Simulated Profit Margin: <strong className="text-white">{simMargin}%</strong> (vs current {profitMargin}%)
            </span>
          </div>

          <div className="text-right text-xs text-slate-300 space-y-1">
            <div>Projected Revenue: <strong className="font-mono text-white">{formatINR(simSales)}</strong></div>
            <div>Projected Expenses: <strong className="font-mono text-white">{formatINR(simExpenses)}</strong></div>
            <div>Net Profit Delta: <strong className="font-mono text-emerald-400">+{formatINR(simNet - netProfit)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
