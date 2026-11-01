import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Truck, 
  Receipt, 
  Wallet, 
  Layers, 
  PackageCheck, 
  Clock, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function DashboardOverview({ 
  overview, 
  reports, 
  products = [], 
  sales = [], 
  onOpenSaleModal, 
  onOpenPurchaseModal, 
  onOpenExpenseModal, 
  setActiveTab 
}) {
  const isLoss = overview?.isNetLoss || (overview?.netProfit < 0);

  // Low stock products alert
  const lowStockItems = products.filter(p => p.current_stock <= (p.min_stock_alert || 5));

  // Prepare monthly P&L chart data
  const monthlyData = (reports?.monthlyPL || []).slice().reverse();
  const hasMonthlyData = monthlyData.length > 0;
  const barChartData = {
    labels: hasMonthlyData ? monthlyData.map(m => m.month) : ['Current Period'],
    datasets: [
      {
        label: 'Sales Revenue (₹)',
        data: hasMonthlyData ? monthlyData.map(m => m.sales) : [0],
        backgroundColor: 'rgba(34, 197, 94, 0.85)',
        borderRadius: 8,
      },
      {
        label: 'Cost of Goods Sold (₹)',
        data: hasMonthlyData ? monthlyData.map(m => m.cogs) : [0],
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 8,
      },
      {
        label: 'Expenses (₹)',
        data: hasMonthlyData ? monthlyData.map(m => m.expenses) : [0],
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderRadius: 8,
      },
      {
        label: 'Net Profit (₹)',
        data: hasMonthlyData ? monthlyData.map(m => m.net_profit) : [0],
        backgroundColor: 'rgba(16, 185, 129, 0.95)',
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatINR(context.raw)}`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: {
          callback: (val) => formatINR(val, { decimals: 0, showSymbol: true })
        }
      }
    }
  };

  // Doughnut chart for expense category breakdown
  const expCategories = reports?.expenseBreakdown || [];
  const hasExpenses = expCategories.length > 0 && expCategories.some(e => e.total_amount > 0);
  const doughnutData = {
    labels: hasExpenses ? expCategories.map(e => e.category) : ['No Expenses Recorded Yet'],
    datasets: [
      {
        data: hasExpenses ? expCategories.map(e => e.total_amount) : [1],
        backgroundColor: hasExpenses ? [
          '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#14b8a6', '#f43f5e', '#64748b'
        ] : ['rgba(148, 163, 184, 0.3)'],
        borderWidth: 0,
        hoverOffset: hasExpenses ? 6 : 0
      }
    ]
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Low Stock Warning Alert Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Low Stock Alert: {lowStockItems.length} product(s) need replenishment!
              </span>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {lowStockItems.map(p => `${p.name} (${p.current_stock} left)`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('purchases')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
          >
            Restock Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 11 Primary Required KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatINR(overview?.totalSales || 0)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Gross Revenue from sales</span>
            </div>
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Cost (COGS)</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatINR(overview?.totalCost || 0)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Qty Sold × Unit Purchase Cost
            </div>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-teal-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Profit</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
              {formatINR(overview?.grossProfit || 0)}
            </div>
            <div className="mt-1 text-xs text-teal-700 dark:text-teal-300 font-semibold">
              Sales − Cost of Goods Sold
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatINR(overview?.totalExpenses || 0)}
            </div>
            <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
              Operational costs & overheads
            </div>
          </div>
        </div>

        {/* Net Profit / (Loss) - Prominent Gradient */}
        <div className={`p-5 rounded-3xl border shadow-md relative overflow-hidden sm:col-span-2 ${
          isLoss 
            ? 'bg-gradient-to-br from-rose-900 to-rose-950 text-white border-rose-800' 
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                {isLoss ? 'Net Business Loss' : 'Net Business Profit'}
              </span>
              <p className="text-[11px] text-slate-300">Gross Profit − Total Business Expenses</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
              isLoss ? 'bg-rose-500/40 text-rose-200' : 'bg-emerald-500/30 text-emerald-300'
            }`}>
              Margin: {overview?.profitMargin || 0}%
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-3xl sm:text-4xl font-black font-mono">
              {formatINR(overview?.netProfit || 0)}
            </div>
          </div>
        </div>

        {/* Available Cash Balance */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all sm:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Cash Balance</span>
              <p className="text-[11px] text-slate-400">Actual Money Received − Actual Money Spent</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatINR(overview?.availableBalance || 0)}
            </div>
            <button
              onClick={() => setActiveTab('financial')}
              className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
            >
              Reconciliation <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Secondary Metric Cards */}
        {/* Total Investment */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Investment</span>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
            {formatINR(overview?.totalInvestment || 0)}
          </div>
          <span className="text-[10px] text-slate-400">Inventory Purchases + Capital</span>
        </div>

        {/* Total Products Sold */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Products Sold</span>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
            {overview?.totalProductsSold || 0} Units
          </div>
          <span className="text-[10px] text-slate-400">Across {overview?.totalOrders || 0} orders</span>
        </div>

        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
            {overview?.totalOrders || 0}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Completed invoices</span>
        </div>

        {/* Pending Payments */}
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-sm">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">Pending Payments</span>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {formatINR(overview?.pendingPayments || 0)}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Unpaid client receivables</span>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart: Revenue vs COGS vs Expenses vs Net Profit */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Monthly Financial Performance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sales Revenue vs COGS vs Operating Expenses vs Net Profit
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Full Reports <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-72">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Expense Category Breakdown Donut */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
              Expense Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Breakdown across operating categories
            </p>
            <div className="h-52 flex items-center justify-center">
              <Doughnut 
                data={doughnutData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Total Operating Expenses:</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">
                {formatINR(overview?.totalExpenses || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Hub & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Center */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight mb-2">Fast Transaction Entry</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Instant entry of sales, inventory purchases and operating costs with automated accounting ledger updates.
            </p>

            <div className="space-y-3">
              <button
                onClick={onOpenSaleModal}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-emerald-200" />
                  <span>+ Record New Sale</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenPurchaseModal}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-indigo-200" />
                  <span>+ Record Purchase / Stock</span>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenExpenseModal}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-amber-200" />
                  <span>+ Record Business Expense</span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-200 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Currency: INR (₹)</span>
            <span>Indian Numbering Active</span>
          </div>
        </div>

        {/* Recent Sales Ledger Snapshot */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Sales</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest completed customer orders</p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View All Sales <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Qty</th>
                  <th className="pb-3">Total (₹)</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No sales recorded yet. All metrics start at ₹0.00. Click "+ Record New Sale" to add your first sale.
                    </td>
                  </tr>
                ) : (
                  sales.slice(0, 5).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{s.product_name}</td>
                      <td className="py-3 text-slate-500">{s.customer_name || 'Walk-in'}</td>
                      <td className="py-3 font-mono">{s.quantity}</td>
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">{formatINR(s.total_amount)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          s.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          s.payment_status === 'Partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        }`}>
                          {s.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
