import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  DollarSign, 
  Calendar, 
  Download, 
  PieChart as PieIcon,
  ShoppingBag,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';
import { exportToCSV } from '../utils/excelExport';

// Chart.js components
import { Bar, Line, Doughnut } from 'react-chartjs-2';

export default function ReportsAnalytics({ reports, overview }) {
  const [reportPeriod, setReportPeriod] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly'

  const productReport = reports?.productProfitReport || [];
  const bestSelling = reports?.bestSelling || [];
  const highestProfit = reports?.highestProfit || [];
  const monthlyPL = reports?.monthlyPL || [];
  const expenseBreakdown = reports?.expenseBreakdown || [];

  // Line Chart for Sales & COGS Trend
  const salesTrendData = {
    labels: (reports?.salesByDate || []).map(s => s.date),
    datasets: [
      {
        label: 'Sales Revenue (₹)',
        data: (reports?.salesByDate || []).map(s => s.sales),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Gross Profit (₹)',
        data: (reports?.salesByDate || []).map(s => s.gross_profit),
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };

  const handleExportProductReport = () => {
    const exportData = productReport.map(p => ({
      'Product Name': p.name,
      'Category': p.category,
      'Units Sold': p.units_sold,
      'Total Revenue (INR)': p.total_revenue,
      'Total COGS (INR)': p.total_cogs,
      'Gross Profit (INR)': p.total_gross_profit,
      'Gross Margin (%)': `${p.gross_margin_percent}%`,
      'Current In-Stock': p.current_stock
    }));
    exportToCSV(exportData, `Product_Profitability_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Reports & Financial Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive business performance insights, product profit margins, and sales intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800">
            {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
              <button
                key={period}
                onClick={() => setReportPeriod(period)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  reportPeriod === period
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportProductReport}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Product Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Top 2 Cards: Best Selling Products & Highest Profit Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Best Selling Products
                  </h3>
                  <span className="text-xs text-slate-400">Ranked by total quantity units sold</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {bestSelling.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No sales recorded yet. Your best-selling products will appear here.
                </div>
              ) : (
                bestSelling.slice(0, 5).map((item, idx) => (
                  <div key={item.product_name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                          {item.product_name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Total Volume: <strong className="text-emerald-600">{item.total_units} units sold</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {formatINR(item.total_sales)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Highest Profit Products */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Highest Profit Products
                  </h3>
                  <span className="text-xs text-slate-400">Ranked by total absolute gross profit generated</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {highestProfit.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No sales recorded yet. Your highest profit products will rank here.
                </div>
              ) : (
                highestProfit.slice(0, 5).map((item, idx) => (
                  <div key={item.product_name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-teal-600/10 text-teal-700 dark:text-teal-400 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                          {item.product_name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Revenue: {formatINR(item.total_sales, { decimals: 0 })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs sm:text-sm text-teal-600 dark:text-teal-400">
                        +{formatINR(item.total_profit)}
                      </div>
                      <span className="text-[10px] text-slate-400">Gross Margin</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sales & Gross Profit Interactive Trend Line Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
          Historical Revenue & Profit Trajectory
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Real-time daily transaction sales revenue curve vs gross profit
        </p>
        <div className="h-72">
          <Line 
            data={salesTrendData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { weight: 'bold' } } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatINR(ctx.raw)}` } }
              },
              scales: {
                x: { grid: { display: false } },
                y: { ticks: { callback: (val) => formatINR(val, { decimals: 0 }) } }
              }
            }} 
          />
        </div>
      </div>

      {/* Product-Wise Profit Report Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Product-Wise Profitability & Margin Analysis
          </h3>
          <p className="text-xs text-slate-400">
            Detailed breakdown of Units Sold, Revenue, Cost of Goods, Gross Profit & Profit Margin per product
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">In-Stock</th>
                <th className="py-3 px-3 text-right">Units Sold</th>
                <th className="py-3 px-3 text-right">Total Revenue</th>
                <th className="py-3 px-3 text-right">Total COGS</th>
                <th className="py-3 px-3 text-right">Gross Profit</th>
                <th className="py-3 px-3 text-right">Gross Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {productReport.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No products created yet. All sales and profit metrics start from ₹0.00.
                  </td>
                </tr>
              ) : (
                productReport.map((p) => {
                  const isGoodMargin = p.gross_margin_percent >= 40;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                        {p.current_stock}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap text-slate-900 dark:text-white">
                        {p.units_sold}
                      </td>

                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                        {formatINR(p.total_revenue)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap text-indigo-600 dark:text-indigo-400">
                        {formatINR(p.total_cogs)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap text-teal-600 dark:text-teal-400">
                        {formatINR(p.total_gross_profit)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-xs ${
                          isGoodMargin ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {p.gross_margin_percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Profit & Loss Statement Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Monthly Profit & Loss Breakdown (Audit Ledger)
          </h3>
          <p className="text-xs text-slate-400">
            Historical accounting ledger aggregated by fiscal month
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Month</th>
                <th className="py-3 px-3 text-right">Sales Revenue</th>
                <th className="py-3 px-3 text-right">COGS</th>
                <th className="py-3 px-3 text-right">Gross Profit</th>
                <th className="py-3 px-3 text-right">Operating Expenses</th>
                <th className="py-3 px-3 text-right">Net Profit</th>
                <th className="py-3 px-3 text-right">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {monthlyPL.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No monthly accounting records yet. All revenue, COGS and profit figures start at ₹0.00.
                  </td>
                </tr>
              ) : (
                monthlyPL.map((m) => {
                  const margin = m.sales > 0 ? ((m.net_profit / m.sales) * 100).toFixed(1) : 0;
                  return (
                    <tr key={m.month} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {m.month}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatINR(m.sales)}</td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-600">{formatINR(m.cogs)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-600">{formatINR(m.gross_profit)}</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-600">{formatINR(m.expenses)}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-600">{formatINR(m.net_profit)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{margin}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
