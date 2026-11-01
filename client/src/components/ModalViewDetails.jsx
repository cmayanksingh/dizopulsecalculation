import React from 'react';
import { X, CheckCircle, Clock, AlertCircle, Printer, ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';

export default function ModalViewDetails({ isOpen, onClose, transaction }) {
  if (!isOpen || !transaction) return null;

  const isSale = transaction.type === 'sale';
  const isPurchase = transaction.type === 'purchase';
  const isExpense = transaction.type === 'expense';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isSale ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                isPurchase ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400' :
                'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
              }`}>
                {transaction.type}
              </span>
              <span className="text-xs text-slate-400">ID #{transaction.id}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {transaction.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Main Amount Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Transaction Total</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {formatINR(transaction.amount)}
              </div>
            </div>
            <div className={`p-3 rounded-2xl ${
              transaction.cash_in > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
              transaction.cash_out > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
              'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {transaction.cash_in > 0 ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(transaction.date)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Counterparty</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{transaction.counterparty || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Payment Method</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{transaction.payment_method || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Payment Status</span>
              <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded-lg ${
                transaction.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                transaction.payment_status === 'Partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
              }`}>
                {transaction.payment_status}
              </span>
            </div>
          </div>

          {/* Profit & Unit Calculation if Sale */}
          {isSale && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2 text-xs">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Financial Formula Audit:
              </span>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Quantity Sold:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{transaction.quantity} units</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Selling Price / Unit:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatINR(transaction.unit_price)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Gross Profit (Sales - COGS):</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(transaction.gross_profit || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 border-t border-emerald-200/60 dark:border-emerald-800/60 pt-2">
                <span>Cash Actually Received:</span>
                <span className="font-mono font-bold text-emerald-600">{formatINR(transaction.cash_in || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Pending Receivable:</span>
                <span className="font-mono font-bold text-amber-600">{formatINR(Math.max(0, transaction.amount - (transaction.cash_in || 0)))}</span>
              </div>
            </div>
          )}

          {/* Purchase Details */}
          {isPurchase && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-2 text-xs">
              <span className="font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">
                Purchase Formula:
              </span>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Quantity Restocked:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{transaction.quantity} units</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Cost / Unit:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatINR(transaction.unit_price)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 border-t border-indigo-200/60 dark:border-indigo-800/60 pt-2">
                <span>Cash Paid to Supplier:</span>
                <span className="font-mono font-bold text-rose-600">{formatINR(transaction.cash_out || 0)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {transaction.notes && (
            <div>
              <span className="text-xs text-slate-400 block font-medium mb-1">Notes & Details</span>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                {transaction.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Audit-Verified Entry</span>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Voucher
          </button>
        </div>
      </div>
    </div>
  );
}
