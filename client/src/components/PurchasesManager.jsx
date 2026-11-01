import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  Package, 
  AlertTriangle,
  Building2,
  TrendingDown,
  Layers
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/excelExport';
import ConfirmModal from './ConfirmModal';

export default function PurchasesManager({ 
  purchases = [], 
  products = [], 
  onOpenPurchaseModal, 
  onEditPurchase, 
  onDeletePurchase 
}) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'purchases'
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filtered products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // Filtered purchases
  const filteredPurchases = purchases.filter(p =>
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier_name && p.supplier_name.toLowerCase().includes(search.toLowerCase())) ||
    (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const totalInventoryValue = products.reduce((acc, p) => acc + (p.current_stock * p.avg_cost_per_unit), 0);
  const totalStockUnits = products.reduce((acc, p) => acc + p.current_stock, 0);
  const totalPurchasesCost = purchases.reduce((acc, p) => acc + p.total_cost, 0);

  const handleExportCSV = () => {
    if (activeTab === 'inventory') {
      const exportData = filteredProducts.map(p => ({
        'Product ID': p.id,
        'Product Name': p.name,
        'Category': p.category,
        'SKU': p.sku || '',
        'Current Stock': p.current_stock,
        'Avg Cost Per Unit (INR)': p.avg_cost_per_unit,
        'Default Selling Price (INR)': p.default_selling_price,
        'Total Valuation (INR)': Number((p.current_stock * p.avg_cost_per_unit).toFixed(2))
      }));
      exportToCSV(exportData, `Inventory_Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      const exportData = filteredPurchases.map(p => ({
        'Purchase ID': p.id,
        'Date': p.purchase_date,
        'Product Name': p.product_name,
        'Supplier': p.supplier_name,
        'Quantity': p.quantity,
        'Cost Per Unit (INR)': p.cost_per_unit,
        'Total Cost (INR)': p.total_cost,
        'Payment Status': p.payment_status,
        'Amount Paid (INR)': p.amount_paid,
        'Payment Method': p.payment_method,
        'Notes': p.notes || ''
      }));
      exportToCSV(exportData, `Purchases_Report_${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Product Cost & Purchases Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track inventory batches, supplier costs, stock valuations & weighted average unit cost
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
            onClick={onOpenPurchaseModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>+ Add New Purchase</span>
          </button>
        </div>
      </div>

      {/* Mini KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Current Inventory Valuation</span>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {formatINR(totalInventoryValue)}
          </div>
          <span className="text-[10px] text-slate-500">Asset value sitting in warehouse</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Stock in Hand</span>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
            {totalStockUnits} Units
          </div>
          <span className="text-[10px] text-slate-500">Across {products.length} product SKUs</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Cumulative Purchases Cost</span>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {formatINR(totalPurchasesCost)}
          </div>
          <span className="text-[10px] text-slate-500">Historical raw stock acquisition</span>
        </div>
      </div>

      {/* View Switcher & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inventory'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Inventory Stock & Unit Costs ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'purchases'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Purchase Orders History ({purchases.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'inventory' ? 'Search inventory...' : 'Search supplier or orders...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Inventory Stock Status & Unit Costing Table */}
      {activeTab === 'inventory' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Product Name & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Current Stock</th>
                  <th className="py-3.5 px-4 text-right">Avg Cost / Unit</th>
                  <th className="py-3.5 px-4 text-right">Default Selling Price</th>
                  <th className="py-3.5 px-4 text-right">Total Inventory Value</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredProducts.map((p) => {
                  const isLow = p.current_stock <= (p.min_stock_alert || 5);
                  const val = p.current_stock * p.avg_cost_per_unit;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                        {p.sku && <div className="text-[11px] font-mono text-slate-400">SKU: {p.sku}</div>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}>
                          {p.current_stock} units
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                        {formatINR(p.avg_cost_per_unit)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {formatINR(p.default_selling_price)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {formatINR(val)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                            Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Purchases History Table */}
      {activeTab === 'purchases' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Supplier / Vendor</th>
                  <th className="py-3.5 px-4 text-right">Qty × Unit Cost</th>
                  <th className="py-3.5 px-4 text-right">Total Cost</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(pur.purchase_date)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{pur.product_name}</div>
                        {pur.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{pur.notes}</div>}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {pur.supplier_name || 'Standard Supplier'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs whitespace-nowrap">
                        {pur.quantity} × {formatINR(pur.cost_per_unit)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatINR(pur.total_cost)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          pur.payment_status === 'Paid' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' :
                          pur.payment_status === 'Partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        }`}>
                          {pur.payment_status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{pur.payment_method}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs text-rose-600 font-bold whitespace-nowrap">
                        {formatINR(pur.amount_paid)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditPurchase({ ...pur, type: 'purchase' })}
                            title="Edit Purchase"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(pur)}
                            title="Delete Purchase"
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
      )}

      {/* Delete Purchase Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Purchase Record?"
        message={`Deleting purchase order #${deleteTarget?.id} (${deleteTarget?.product_name}) will deduct ${deleteTarget?.quantity} units from inventory and recalculate all business accounts.`}
        confirmText="Confirm Delete"
        onConfirm={() => {
          if (deleteTarget) {
            onDeletePurchase(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
