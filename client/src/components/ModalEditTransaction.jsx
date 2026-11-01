import React, { useState, useEffect } from 'react';
import { X, Edit3, IndianRupee, Calendar, RefreshCw } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function ModalEditTransaction({ isOpen, onClose, transaction, onUpdated, products = [] }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setFormData({ ...transaction });
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const isSale = transaction.type === 'sale';
  const isPurchase = transaction.type === 'purchase';
  const isExpense = transaction.type === 'expense';

  const handleChange = (field, val) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: val };

      // Recalculate totals if quantity or price changed
      if (isSale) {
        if (field === 'quantity' || field === 'selling_price_per_unit') {
          const q = parseFloat(field === 'quantity' ? val : prev.quantity) || 0;
          const p = parseFloat(field === 'selling_price_per_unit' ? val : prev.selling_price_per_unit) || 0;
          const total = Number((q * p).toFixed(2));
          updated.total_amount = total;
          
          if (updated.payment_status === 'Paid') {
            updated.amount_received = total;
            updated.pending_amount = 0;
          } else if (updated.payment_status === 'Unpaid') {
            updated.amount_received = 0;
            updated.pending_amount = total;
          } else {
            updated.pending_amount = Math.max(0, total - (parseFloat(updated.amount_received) || 0));
          }
        }
        if (field === 'amount_received') {
          const received = parseFloat(val) || 0;
          updated.pending_amount = Math.max(0, (updated.total_amount || 0) - received);
        }
      }

      if (isPurchase) {
        if (field === 'quantity' || field === 'cost_per_unit') {
          const q = parseFloat(field === 'quantity' ? val : prev.quantity) || 0;
          const c = parseFloat(field === 'cost_per_unit' ? val : prev.cost_per_unit) || 0;
          updated.total_cost = Number((q * c).toFixed(2));
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      let endpoint = '';
      if (isSale) endpoint = `/api/sales/${transaction.id}`;
      else if (isPurchase) endpoint = `/api/purchases/${transaction.id}`;
      else if (isExpense) endpoint = `/api/expenses/${transaction.id}`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update transaction');
      }

      onUpdated(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-700 text-white">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                Edit {transaction.type} #{transaction.id}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">All financial totals will automatically recalculate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-sm">
              {error}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.sale_date || formData.purchase_date || formData.expense_date || formData.date || ''}
              onChange={(e) => {
                if (isSale) handleChange('sale_date', e.target.value);
                else if (isPurchase) handleChange('purchase_date', e.target.value);
                else handleChange('expense_date', e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          {/* Title / Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              {isExpense ? 'Expense Title' : 'Product Name'}
            </label>
            <input
              type="text"
              required
              value={formData.product_name || formData.expense_name || formData.title || ''}
              onChange={(e) => {
                if (isExpense) handleChange('expense_name', e.target.value);
                else handleChange('product_name', e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          {/* Counterparty (Customer / Supplier / Category) */}
          {isSale && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customer_name || ''}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          )}

          {isPurchase && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                value={formData.supplier_name || ''}
                onChange={(e) => handleChange('supplier_name', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          )}

          {isExpense && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={formData.category || 'Other Expenses'}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                {['Marketing', 'Advertising', 'Website', 'Subscription', 'Software', 'Internet', 'Transportation', 'Packaging', 'Other Expenses'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quantities and Unit Prices if Sale or Purchase */}
          {(isSale || isPurchase) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={formData.quantity || ''}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {isSale ? 'Selling Price / Unit' : 'Cost / Unit'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={isSale ? (formData.selling_price_per_unit ?? '') : (formData.cost_per_unit ?? '')}
                  onChange={(e) => handleChange(isSale ? 'selling_price_per_unit' : 'cost_per_unit', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
            </div>
          )}

          {/* Amount for Expense */}
          {isExpense && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
              />
            </div>
          )}

          {/* Calculated Total Card */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Total Calculated:</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {formatINR(formData.total_amount || formData.total_cost || formData.amount || 0)}
            </span>
          </div>

          {/* Payment Status & Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Payment Status
              </label>
              <select
                value={formData.payment_status || 'Paid'}
                onChange={(e) => handleChange('payment_status', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={formData.payment_method || 'UPI'}
                onChange={(e) => handleChange('payment_method', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Received / Paid for Partial */}
          {formData.payment_status === 'Partial' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {isSale ? 'Amount Received So Far' : 'Amount Paid to Vendor'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={isSale ? (formData.amount_received || '') : (formData.amount_paid || '')}
                onChange={(e) => handleChange(isSale ? 'amount_received' : 'amount_paid', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Notes / Description
            </label>
            <input
              type="text"
              value={formData.notes || formData.description || ''}
              onChange={(e) => {
                if (isExpense) handleChange('description', e.target.value);
                else handleChange('notes', e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow transition-all"
            >
              {loading ? 'Saving...' : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
