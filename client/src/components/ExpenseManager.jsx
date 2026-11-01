import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  Tag, 
  Calendar, 
  CreditCard,
  PieChart as PieIcon,
  TrendingDown
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/excelExport';
import ConfirmModal from './ConfirmModal';

const ALL_CATEGORIES = [
  'All Categories',
  'Marketing',
  'Advertising',
  'Website',
  'Subscription',
  'Software',
  'Internet',
  'Transportation',
  'Packaging',
  'Other Expenses'
];

export default function ExpenseManager({ 
  expenses = [], 
  onOpenExpenseModal, 
  onEditExpense, 
  onDeleteExpense 
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filtered expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.expense_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
      (e.payment_method && e.payment_method.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'All Categories' || e.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalAllExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Group by category for visual pills
  const categoryTotals = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const handleExportCSV = () => {
    const exportData = filteredExpenses.map(e => ({
      'Expense ID': e.id,
      'Date': e.expense_date,
      'Expense Title': e.expense_name,
      'Category': e.category,
      'Amount (INR)': e.amount,
      'Payment Method': e.payment_method,
      'Description': e.description || ''
    }));
    exportToCSV(exportData, `Expenses_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Expense Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Categorized operational expense tracking with automated net profit impact
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>+ Add New Expense</span>
          </button>
        </div>
      </div>

      {/* Total Expenses Banner Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-white" />
            Total Operating Expenses
          </span>
          <div className="text-3xl font-black font-mono mt-1">
            {formatINR(totalAllExpenses)}
          </div>
          <span className="text-xs text-amber-100 mt-1 block">
            Deducted automatically from Gross Profit to calculate Net Profit
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs text-amber-200">Filtered View Total:</span>
          <div className="text-xl font-black font-mono">
            {formatINR(totalFilteredExpenses)}
          </div>
          <span className="text-[11px] text-amber-100 font-semibold">
            {filteredExpenses.length} expense transactions
          </span>
        </div>
      </div>

      {/* Category Breakdown Scrollable Cards */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Category Breakdown
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {Object.entries(categoryTotals).map(([cat, amt]) => {
            const pct = totalAllExpenses > 0 ? ((amt / totalAllExpenses) * 100).toFixed(1) : 0;
            return (
              <div 
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'All Categories' : cat)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  categoryFilter === cat 
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20' 
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span className="truncate">{cat}</span>
                  <span className="text-amber-600 font-mono">{pct}%</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-1">
                  {formatINR(amt, { decimals: 0 })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search expense title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
          >
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Expense Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No expense entries found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(exp.expense_date)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{exp.expense_name}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      {exp.payment_method}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {exp.description || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatINR(exp.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditExpense({ ...exp, type: 'expense' })}
                          title="Edit Expense"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          title="Delete Expense"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Expense Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Expense Entry?"
        message={`Are you sure you want to delete "${deleteTarget?.expense_name}" of ${formatINR(deleteTarget?.amount || 0)}? This will restore this amount to your Net Profit and update all financial totals.`}
        confirmText="Confirm Delete"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteExpense(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
