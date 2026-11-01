import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  IndianRupee,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/excelExport';
import ConfirmModal from './ConfirmModal';

export default function SalesManager({ 
  sales = [], 
  products = [], 
  onOpenSaleModal, 
  onEditSale, 
  onDeleteSale, 
  onRefundSale, 
  onMarkPaid 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);

  // Filtered sales
  const filteredSales = sales.filter(s => {
    const matchesSearch = 
      (s.product_name && s.product_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'refunded' ? s.status === 'Refunded' :
      s.payment_status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate quick metrics for this view
  const totalSalesAmount = filteredSales
    .filter(s => s.status !== 'Refunded')
    .reduce((acc, s) => acc + s.total_amount, 0);

  const totalReceived = filteredSales
    .filter(s => s.status !== 'Refunded')
    .reduce((acc, s) => acc + s.amount_received, 0);

  const totalPending = filteredSales
    .filter(s => s.status !== 'Refunded')
    .reduce((acc, s) => acc + s.pending_amount, 0);

  const totalGrossProfit = filteredSales
    .filter(s => s.status !== 'Refunded')
    .reduce((acc, s) => acc + s.gross_profit, 0);

  const handleExportCSV = () => {
    const exportData = filteredSales.map(s => ({
      'Sale ID': s.id,
      'Date': s.sale_date,
      'Product': s.product_name,
      'Customer': s.customer_name || 'Walk-in',
      'Quantity': s.quantity,
      'Unit Price (INR)': s.selling_price_per_unit,
      'Total Amount (INR)': s.total_amount,
      'Unit Cost (INR)': s.unit_cost_at_sale,
      'COGS (INR)': s.cogs,
      'Gross Profit (INR)': s.gross_profit,
      'Payment Status': s.payment_status,
      'Amount Received (INR)': s.amount_received,
      'Pending Amount (INR)': s.pending_amount,
      'Payment Method': s.payment_method,
      'Status': s.status,
      'Notes': s.notes || ''
    }));
    exportToCSV(exportData, `Sales_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Sales Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track customer orders, auto-calculate revenue, COGS, pending payments and gross profit
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
            onClick={onOpenSaleModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>+ Add New Sale</span>
          </button>
        </div>
      </div>

      {/* Mini KPI Bar for Sales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Filtered Sales</span>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {formatINR(totalSalesAmount)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Profit</span>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {formatINR(totalGrossProfit)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Cash Received</span>
          <div className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">
            {formatINR(totalReceived)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">Pending Payments</span>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
            {formatINR(totalPending)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search product, customer, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Filter Status:</span>
          {['all', 'paid', 'partial', 'unpaid', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-right">Qty × Price</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Gross Profit</th>
                <th className="py-3.5 px-4 text-center">Payment Status</th>
                <th className="py-3.5 px-4 text-right">Received / Pending</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No sales found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr 
                    key={s.id} 
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                      s.status === 'Refunded' ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(s.sale_date)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {s.product_name}
                        {s.status === 'Refunded' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                            REFUNDED
                          </span>
                        )}
                      </div>
                      {s.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{s.notes}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {s.customer_name || 'Walk-in Customer'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-xs whitespace-nowrap">
                      {s.quantity} × {formatINR(s.selling_price_per_unit)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatINR(s.total_amount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {s.status === 'Refunded' ? '₹0.00' : formatINR(s.gross_profit)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        s.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                        s.payment_status === 'Partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                      }`}>
                        {s.payment_status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{s.payment_method}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-xs whitespace-nowrap">
                      <div className="text-emerald-600 font-bold">{formatINR(s.amount_received)}</div>
                      {s.pending_amount > 0 && (
                        <div className="text-amber-600 text-[11px]">Due: {formatINR(s.pending_amount)}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {s.pending_amount > 0 && s.status !== 'Refunded' && (
                          <button
                            onClick={() => onMarkPaid(s)}
                            title="Mark Full Payment Received"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {s.status !== 'Refunded' && (
                          <button
                            onClick={() => setRefundTarget(s)}
                            title="Process Refund / Return (Restores Stock)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onEditSale({ ...s, type: 'sale' })}
                          title="Edit Sale"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(s)}
                          title="Delete Sale"
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Sale Record?"
        message={`Are you sure you want to permanently delete sale #${deleteTarget?.id} (${deleteTarget?.product_name})? This will automatically restore ${deleteTarget?.quantity} units back to product inventory and recalculate all financial statements.`}
        confirmText="Confirm Delete"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteSale(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Refund Confirmation Modal */}
      <ConfirmModal
        isOpen={!!refundTarget}
        isDanger={false}
        title="Process Refund / Return?"
        message={`Confirm return/refund for order #${refundTarget?.id} (${refundTarget?.product_name})? This will mark the order as Refunded, restore ${refundTarget?.quantity} items back into stock, and eliminate COGS & revenue for this order.`}
        confirmText="Confirm Refund"
        onConfirm={() => {
          if (refundTarget) {
            onRefundSale(refundTarget.id);
            setRefundTarget(null);
          }
        }}
        onCancel={() => setRefundTarget(null)}
      />
    </div>
  );
}
