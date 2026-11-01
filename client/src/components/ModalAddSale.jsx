import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, IndianRupee, Calendar, User, CreditCard, FileText, Package } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function ModalAddSale({ isOpen, onClose, onSaleAdded, products = [] }) {
  const [productId, setProductId] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected product metadata
  const selectedProduct = products.find(p => String(p.id) === String(productId));

  // When product changes, prefill default selling price if available
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.default_selling_price > 0 && !unitPrice) {
        setUnitPrice(selectedProduct.default_selling_price);
      }
    }
  }, [productId, selectedProduct]);

  // Total calculation: Qty * Selling Price
  const totalAmount = Number((parseFloat(quantity || 0) * parseFloat(unitPrice || 0)).toFixed(2));

  // Effective amount received based on payment status
  const effectiveReceived = paymentStatus === 'Paid' 
    ? totalAmount 
    : paymentStatus === 'Unpaid' 
      ? 0 
      : Math.min(totalAmount, parseFloat(amountReceived || 0));

  const pendingAmount = Math.max(0, totalAmount - effectiveReceived);

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
      setError('Quantity must be greater than 0');
      return;
    }
    if (unitPrice === '' || parseFloat(unitPrice) < 0) {
      setError('Please provide a valid selling price per unit');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        product_id: productId !== 'custom' && productId ? parseInt(productId) : null,
        product_name: finalProductName,
        customer_name: customerName.trim() || 'Walk-in Customer',
        quantity: parseFloat(quantity),
        selling_price_per_unit: parseFloat(unitPrice),
        sale_date: saleDate,
        payment_status: paymentStatus,
        amount_received: effectiveReceived,
        payment_method: paymentMethod,
        notes: notes.trim()
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record sale');
      }

      onSaleAdded(data);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record New Sale</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Automatic revenue, COGS and profit calculation</p>
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

          {/* Product Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Select or Enter Product *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  const p = products.find(x => String(x.id) === e.target.value);
                  if (p && p.default_selling_price) {
                    setUnitPrice(p.default_selling_price);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">-- Choose Existing Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.current_stock})
                  </option>
                ))}
                <option value="custom">+ New / Custom Product</option>
              </select>

              {(productId === 'custom' || !productId) && (
                <input
                  type="text"
                  placeholder="Enter custom product name"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
              )}
            </div>

            {selectedProduct && (
              <div className="mt-2 flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-500" />
                  Available Stock: <strong className={selectedProduct.current_stock <= (selectedProduct.min_stock_alert || 5) ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{selectedProduct.current_stock} units</strong>
                </span>
                <span>Unit Cost: {formatINR(selectedProduct.avg_cost_per_unit)}</span>
              </div>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Customer Name (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Ramesh Patel, Rahul Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Quantity & Selling Price per Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="e.g. 1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Selling Price per Unit (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 1499.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Automatic Total Calculation Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Formula: Quantity × Selling Price
              </span>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {quantity || 0} × {formatINR(unitPrice || 0)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Selling Amount</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatINR(totalAmount)}
              </div>
            </div>
          </div>

          {/* Sale Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Sale Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Status & Amount Received */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Payment Status *
              </label>
              <div className="inline-flex rounded-xl p-1 bg-slate-200 dark:bg-slate-700">
                {['Paid', 'Partial', 'Unpaid'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setPaymentStatus(status);
                      if (status === 'Paid') setAmountReceived(totalAmount);
                      else if (status === 'Unpaid') setAmountReceived(0);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      paymentStatus === status
                        ? status === 'Paid'
                          ? 'bg-emerald-600 text-white shadow'
                          : status === 'Partial'
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-rose-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {paymentStatus === 'Partial' && (
              <div className="pt-2 grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Amount Received Now (₹)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={totalAmount}
                    placeholder="e.g. 500"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Pending Balance (Receivable)
                  </span>
                  <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-sm font-mono font-bold">
                    {formatINR(pendingAmount)}
                  </div>
                </div>
              </div>
            )}

            {paymentStatus === 'Unpaid' && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Note: ₹{formatINR(totalAmount, { showSymbol: false })} will be recorded as Pending Payment. It will NOT be counted as Cash Received until paid.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Sale Notes / Order ID
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Invoice #1042, GST invoice, delivered via BlueDart"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2"
            >
              {loading ? 'Recording...' : 'Record Sale & Calculate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
