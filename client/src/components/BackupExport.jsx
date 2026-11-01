import React, { useState } from 'react';
import { 
  DownloadCloud, 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  Database, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { exportFinancialWorkbook, exportToCSV } from '../utils/excelExport';
import { generateFinancialPDF } from '../utils/pdfExport';
import ConfirmModal from './ConfirmModal';

export default function BackupExport({ 
  overview, 
  sales = [], 
  purchases = [], 
  expenses = [], 
  products = [], 
  reports = {},
  onDataRestored 
}) {
  const [restoring, setRestoring] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // 1. Download Master Excel Workbook
  const handleDownloadExcel = () => {
    try {
      exportFinancialWorkbook({
        overview,
        sales,
        purchases,
        expenses,
        products
      });
      setSuccessMsg('Excel Financial Workbook generated and downloaded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setErrorMsg('Failed to generate Excel file: ' + e.message);
    }
  };

  // 2. Download Formal PDF Financial Report
  const handleDownloadPDF = () => {
    try {
      generateFinancialPDF({
        overview,
        monthlyPL: reports.monthlyPL || [],
        productReport: reports.productProfitReport || [],
        expenseBreakdown: reports.expenseBreakdown || [],
        businessName: 'Apex Enterprise Solutions'
      });
      setSuccessMsg('PDF Financial Statement generated and downloaded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setErrorMsg('Failed to generate PDF report: ' + e.message);
    }
  };

  // 3. Export CSV of All Transactions
  const handleDownloadCSV = () => {
    const combinedData = [
      ...sales.map(s => ({ Type: 'Sale', ID: s.id, Date: s.sale_date, Title: s.product_name, Amount: s.total_amount, Status: s.payment_status })),
      ...purchases.map(p => ({ Type: 'Purchase', ID: p.id, Date: p.purchase_date, Title: p.product_name, Amount: p.total_cost, Status: p.payment_status })),
      ...expenses.map(e => ({ Type: 'Expense', ID: e.id, Date: e.expense_date, Title: e.expense_name, Amount: e.amount, Status: 'Paid' }))
    ];
    exportToCSV(combinedData, `All_Business_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    setSuccessMsg('CSV transaction file downloaded successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // 4. Download Full JSON Database Backup
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Apex_Business_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg('Full JSON database backup downloaded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Failed to download backup: ' + err.message);
    }
  };

  // 5. Restore Backup from JSON File
  const handleFileRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setRestoring(true);
        setErrorMsg('');
        const parsed = JSON.parse(evt.target.result);

        const res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to restore backup');

        setSuccessMsg('Business data successfully restored from backup file!');
        setTimeout(() => setSuccessMsg(''), 4000);
        onDataRestored();
      } catch (err) {
        setErrorMsg('Restore error: ' + err.message);
      } finally {
        setRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  // 6. Clear All Data to ₹0
  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/clear-all', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to clear database');
      setSuccessMsg('All records cleared! Database is completely clean starting at ₹0.00.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsResetConfirmOpen(false);
      onDataRestored();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <DownloadCloud className="w-5 h-5 text-emerald-600" />
          <span>Export, Backup & Data Integrity</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Permanent data safety, multi-format export and one-click cloud snapshot restoration
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Export Section Cards */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
          1. Export Financial Reports
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Excel Export */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 w-fit mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Download Excel Workbook (.xlsx)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Full multi-tab spreadsheet including Financial Summary, Sales Ledger, Purchases, Expenses, and Product Profit Margins.
              </p>
            </div>
            <button
              onClick={handleDownloadExcel}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>

          {/* PDF Report Export */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 w-fit mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Generate PDF Statement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Clean, printable official business financial statement with Executive Summary, Monthly P&L table, and Top Product margins.
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="mt-6 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF Statement</span>
            </button>
          </div>

          {/* CSV Transactions Export */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 w-fit mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Export Transactions (CSV)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Raw comma-separated values compatible with Tally, QuickBooks, Zoho Books, Google Sheets, or any external accounting software.
              </p>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
          2. Complete Database Backup & Restore
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backup */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Backup All Business Data
                  </h3>
                  <span className="text-xs text-slate-400">Complete SQLite database export</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Downloads an encrypted-structure JSON archive containing all products, inventory purchase records, customer sales, operating expenses, and settings.
              </p>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="mt-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Download Full Backup Archive (.json)</span>
            </button>
          </div>

          {/* Restore */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Restore Previous Backup
                  </h3>
                  <span className="text-xs text-slate-400">Upload JSON archive file</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Restores complete business state from a previously exported backup file. All calculations and inventory balances are verified automatically.
              </p>
            </div>

            <div className="mt-6">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileRestore}
                  disabled={restoring}
                  className="hidden"
                />
                <div className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 transition-all">
                  <UploadCloud className="w-4 h-4" />
                  <span>{restoring ? 'Restoring Archive...' : 'Select Backup File to Restore'}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone / Clear Data */}
      <div className="p-6 rounded-3xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset Account to Zero</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Wipe all products, sales, purchases and expenses to reset all dashboard metrics to ₹0.
          </p>
        </div>
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
        >
          Wipe All Data to ₹0
        </button>
      </div>

      {/* Reset Confirmation */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Wipe Entire Business Database to ₹0?"
        message="This action will permanently delete all sales, purchases, products, and expenses, returning all statistics to ₹0.00."
        confirmText="Confirm Wipe"
        onConfirm={handleClearAll}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
