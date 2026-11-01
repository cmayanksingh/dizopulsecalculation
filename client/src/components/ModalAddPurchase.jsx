import React, { useState } from 'react';
import { X, Truck, Calendar, Building2, CreditCard, FileText } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function ModalAddPurchase({ isOpen, onClose, onPurchaseAdded, products = [] }) {
  const [productId, setProductId] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [costPerUnit, setCostPerUnit] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedProduct = products.find(p => String(p.id) === String(productId));

  // Auto total calculation: Qty * Cost per Unit
  const totalCost = Number((parseFloat(quantity || 0) * parseFloat(costPerUnit || 0)).toFixed(2));

  // Effective amount paid
  const effectivePaid = paymentStatus === 'Paid'
    ? totalCost
    : paymentStatus === 'Unpaid'
      ? 0
      : Math.min(totalCost, parseFloat(amountPaid || 0));

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalProductName = productId === 'custom' || !productId
      ? customProductName.trim()
      : selectedProduct?.name;

    if (!finalProductName) {
      setError('Please select or enter a product name');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Quantity purchased must be greater than 0');
      return;
    }
    if (costPerUnit === '' || parseFloat(costPerUnit) < 0) {
      setError('Please enter a valid cost per unit');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        product_id: productId !== 'custom' && productId ? parseInt(productId) : null,
        product_name: finalProductName,
        quantity: parseFloat(quantity),
        cost_per_unit: parseFloat(costPerUnit),
        supplier_name: supplierName.trim() || 'Supplier / Wholesaler',
        purchase_date: purchaseDate,
        payment_status: paymentStatus,
        amount_paid: effectivePaid,
        payment_method: paymentMethod,
        notes: notes.trim()
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record purchase');
      }

      onPurchaseAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Product Purchase</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Inventory addition & unit cost calculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Product */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Product Name *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  const p = products.find(x => String(x.id) === e.target.value);
                  if (p && p.avg_cost_per_unit > 0 && !costPerUnit) {
                    setCostPerUnit(p.avg_cost_per_unit);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">-- Choose Existing Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current Stock: {p.current_stock})
                  </option>
                ))}
                <option value="custom">+ New Product Batch</option>
              </select>

              {(productId === 'custom' || !productId) && (
                <input
                  type="text"
                  placeholder="Enter product title to stock"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              )}
            </div>
          </div>

          {/* Supplier Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Supplier / Vendor Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Mumbai Wholesalers, Tirupur Garments Hub"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Quantity & Cost per Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Quantity Purchased *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cost per Unit (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 450.00"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Automatic Total Calculation Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                Formula: Quantity × Cost per Unit
              </span>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {quantity || 0} × {formatINR(costPerUnit || 0)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Purchase Cost</span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {formatINR(totalCost)}
              </div>
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Purchase Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Payment Status to Supplier
              </label>
              <div className="inline-flex rounded-xl p-1 bg-slate-200 dark:bg-slate-700">
                {['Paid', 'Partial', 'Unpaid'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setPaymentStatus(status);
                      if (status === 'Paid') setAmountPaid(totalCost);
                      else if (status === 'Unpaid') setAmountPaid(0);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      paymentStatus === status
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {paymentStatus === 'Partial' && (
              <div className="pt-2">
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Amount Paid to Supplier Now (₹)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalCost}
                  placeholder="e.g. 10000"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Purchase Order Notes / Invoice No.
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Batch #B-902, Vendor Bill #INV-88"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
            >
              {loading ? 'Adding Stock...' : 'Save Purchase & Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
