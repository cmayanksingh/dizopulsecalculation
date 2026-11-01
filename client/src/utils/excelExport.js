import * as XLSX from 'xlsx';

/**
 * Export full multi-sheet financial workbook to Excel (.xlsx)
 */
export function exportFinancialWorkbook({ overview, sales = [], purchases = [], expenses = [], products = [] }) {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const summaryData = [
    ['APEX ENTERPRISE - BUSINESS FINANCIAL STATEMENT'],
    ['Generated On', new Date().toLocaleString()],
    [],
    ['Key Performance Metric', 'Amount (INR / Units)'],
    ['Total Sales (Revenue)', overview?.totalSales || 0],
    ['Cost of Goods Sold (COGS)', overview?.totalCost || 0],
    ['Gross Profit', overview?.grossProfit || 0],
    ['Total Business Expenses', overview?.totalExpenses || 0],
    ['Net Profit', overview?.netProfit || 0],
    ['Profit Margin (%)', `${overview?.profitMargin || 0}%`],
    ['Total Investment (Purchases + Capital)', overview?.totalInvestment || 0],
    ['Total Products Sold (Units)', overview?.totalProductsSold || 0],
    ['Total Orders Completed', overview?.totalOrders || 0],
    ['Total Pending Payments (Receivables)', overview?.pendingPayments || 0],
    ['Total Cash Received (Actual Inflows)', overview?.totalMoneyReceived || 0],
    ['Total Money Spent (Purchases + Expenses)', overview?.totalMoneySpent || 0],
    ['Current Available Cash Balance', overview?.availableBalance || 0],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Financial Summary');

  // 2. Sales Sheet
  const salesHeaders = [
    'Sale ID', 'Date', 'Product Name', 'Customer Name', 'Quantity', 
    'Selling Price', 'Total Amount', 'Unit Cost', 'COGS', 'Gross Profit',
    'Payment Status', 'Amount Received', 'Pending Amount', 'Payment Method', 'Status', 'Notes'
  ];
  const salesRows = sales.map(s => [
    s.id, s.sale_date, s.product_name, s.customer_name || 'Walk-in', s.quantity,
    s.selling_price_per_unit, s.total_amount, s.unit_cost_at_sale, s.cogs, s.gross_profit,
    s.payment_status, s.amount_received, s.pending_amount, s.payment_method, s.status, s.notes || ''
  ]);
  const wsSales = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesRows]);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales');

  // 3. Purchases Sheet
  const purchasesHeaders = [
    'Purchase ID', 'Date', 'Product Name', 'Quantity', 'Cost Per Unit',
    'Total Cost', 'Supplier Name', 'Payment Status', 'Amount Paid', 'Payment Method', 'Notes'
  ];
  const purchasesRows = purchases.map(p => [
    p.id, p.purchase_date, p.product_name, p.quantity, p.cost_per_unit,
    p.total_cost, p.supplier_name || 'Supplier', p.payment_status, p.amount_paid, p.payment_method, p.notes || ''
  ]);
  const wsPurchases = XLSX.utils.aoa_to_sheet([purchasesHeaders, ...purchasesRows]);
  XLSX.utils.book_append_sheet(wb, wsPurchases, 'Purchases');

  // 4. Expenses Sheet
  const expensesHeaders = ['Expense ID', 'Date', 'Expense Name', 'Category', 'Amount', 'Payment Method', 'Description'];
  const expensesRows = expenses.map(e => [
    e.id, e.expense_date, e.expense_name, e.category, e.amount, e.payment_method, e.description || ''
  ]);
  const wsExpenses = XLSX.utils.aoa_to_sheet([expensesHeaders, ...expensesRows]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // 5. Products & Inventory Performance
  const prodHeaders = ['Product Name', 'Category', 'Current Stock', 'Avg Unit Cost', 'Default Selling Price', 'Units Sold', 'Total Revenue'];
  const prodRows = products.map(p => [
    p.name, p.category, p.current_stock, p.avg_cost_per_unit, p.default_selling_price, p.total_sold || 0, p.total_revenue || 0
  ]);
  const wsProd = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
  XLSX.utils.book_append_sheet(wb, wsProd, 'Products & Inventory');

  // Generate and download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Business_Accounting_Report_${dateStr}.xlsx`);
}

/**
 * Universal CSV Export helper
 */
export function exportToCSV(rows, filename = 'export.csv') {
  if (!rows || !rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
