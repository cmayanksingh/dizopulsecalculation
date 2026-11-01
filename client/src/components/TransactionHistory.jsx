import React, { useState } from 'react';
import { 
  ReceiptText, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  ArrowUpDown, 
  ArrowDownRight, 
  ArrowUpRight,
  Calendar,
  Layers
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/excelExport';
import ConfirmModal from './ConfirmModal';
import ModalViewDetails from './ModalViewDetails';

export default function TransactionHistory({ 
  transactions = [], 
  products = [], 
  onEditTransaction, 
  onDeleteTransaction 
}) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewDetailsTarget, setViewDetailsTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter logic
  let filtered = transactions.filter(t => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesProduct = productFilter === 'all' || t.title === productFilter;
    const matchesDate = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.counterparty && t.counterparty.toLowerCase().includes(search.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(search.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));

    return matchesType && matchesProduct && matchesDate && matchesSearch;
  });

  // Sort logic
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'amount') {
      cmp = a.amount - b.amount;
    } else if (sortField === 'date') {
      cmp = a.date.localeCompare(b.date) || a.id - b.id;
    } else if (sortField === 'title') {
      cmp = (a.title || '').localeCompare(b.title || '');
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const handleExportCSV = () => {
    const exportData = filtered.map(t => ({
      'Transaction ID': t.id,
      'Type': t.type.toUpperCase(),
      'Date': t.date,
      'Title / Description': t.title,
      'Counterparty': t.counterparty || '',
      'Category': t.category,
      'Gross Amount (INR)': t.amount,
      'Cash In (INR)': t.cash_in,
      'Cash Out (INR)': t.cash_out,
      'Payment Status': t.payment_status,
      'Payment Method': t.payment_method,
      'Notes': t.notes || ''
    }));
    exportToCSV(exportData, `Master_Transactions_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-indigo-600" />
            <span>Master Transaction Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Unified chronological audit trail of all sales, inventory purchases, and business expenses
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Master CSV</span>
        </button>
      </div>

      {/* Filter and Query Controls */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        {/* Row 1: Search & Type Pills */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, customer, supplier, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Type:</span>
            {[
              { id: 'all', label: 'All Entries' },
              { id: 'sale', label: 'Sales' },
              { id: 'purchase', label: 'Purchases' },
              { id: 'expense', label: 'Expenses' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  typeFilter === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Product and Date Range Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Filter Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs"
            >
              <option value="all">-- All Products --</option>
              {products.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-rose-500 font-bold hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Type</th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('title')}
                >
                  <div className="flex items-center gap-1">
                    <span>Item / Transaction Title</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Counterparty / Category</th>
                <th 
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Status / Method</th>
                <th className="py-3.5 px-4 text-right">Cash In / Out</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No transactions match your search or date filter.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isSale = t.type === 'sale';
                  const isPurchase = t.type === 'purchase';
                  const isExpense = t.type === 'expense';

                  return (
                    <tr key={`${t.type}-${t.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(t.date)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isSale ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          isPurchase ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          {t.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {t.title}
                          {t.status === 'Refunded' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700">
                              REFUNDED
                            </span>
                          )}
                        </div>
                        {t.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{t.notes}</div>}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <div className="font-semibold text-xs">{t.counterparty || '—'}</div>
                        <div className="text-[10px] text-slate-400">{t.category}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatINR(t.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          t.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          t.payment_status === 'Partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {t.payment_status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.payment_method}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs whitespace-nowrap">
                        {t.cash_in > 0 && (
                          <div className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            +{formatINR(t.cash_in)}
                          </div>
                        )}
                        {t.cash_out > 0 && (
                          <div className="text-rose-600 font-bold flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            -{formatINR(t.cash_out)}
                          </div>
                        )}
                        {t.cash_in === 0 && t.cash_out === 0 && (
                          <div className="text-slate-400">₹0.00 (Due)</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewDetailsTarget(t)}
                            title="View Full Audit Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEditTransaction(t)}
                            title="Edit Transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(t)}
                            title="Delete Transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      <ModalViewDetails
        isOpen={!!viewDetailsTarget}
        transaction={viewDetailsTarget}
        onClose={() => setViewDetailsTarget(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.type?.toUpperCase()} #${deleteTarget?.id}?`}
        message={`Are you sure you want to permanently delete this ${deleteTarget?.type} record of ${formatINR(deleteTarget?.amount || 0)}? All related inventory stocks and financial totals will automatically recalculate.`}
        confirmText="Confirm Delete"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteTransaction(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
