import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatINR } from './formatters';

export function generateFinancialPDF({ overview, monthlyPL = [], productReport = [], expenseBreakdown = [], businessName = 'Apex Enterprise Solutions' }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName.toUpperCase(), 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('OFFICIAL BUSINESS FINANCIAL STATEMENT & AUDIT REPORT', 14, 25);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 25, { align: 'right' });

  // 1. Executive Summary Table / Key Metrics
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Executive Financial Summary', 14, 48);

  const summaryRows = [
    ['Total Sales (Gross Revenue)', formatINR(overview?.totalSales || 0), 'Available Cash Balance', formatINR(overview?.availableBalance || 0)],
    ['Cost of Goods Sold (COGS)', formatINR(overview?.totalCost || 0), 'Money Received (Cash In)', formatINR(overview?.totalMoneyReceived || 0)],
    ['Gross Profit', formatINR(overview?.grossProfit || 0), 'Pending Receivables', formatINR(overview?.pendingPayments || 0)],
    ['Total Operating Expenses', formatINR(overview?.totalExpenses || 0), 'Total Money Spent (Cash Out)', formatINR(overview?.totalMoneySpent || 0)],
    ['Net Profit / (Loss)', formatINR(overview?.netProfit || 0), 'Profit Margin', `${overview?.profitMargin || 0}%`],
    ['Total Orders Completed', `${overview?.totalOrders || 0}`, 'Total Products Sold (Units)', `${overview?.totalProductsSold || 0}`]
  ];

  doc.autoTable({
    startY: 52,
    head: [['Financial KPI', 'Value (INR)', 'Cash Position KPI', 'Value (INR)']],
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [51, 65, 85] },
      1: { fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { fontStyle: 'bold', textColor: [51, 65, 85] },
      3: { fontStyle: 'bold', textColor: [15, 23, 42] }
    }
  });

  // 2. Monthly Profit & Loss Statement
  let currentY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Monthly Profit & Loss Statement (P&L)', 14, currentY);

  const plRows = (monthlyPL || []).map(m => [
    m.month,
    formatINR(m.sales),
    formatINR(m.cogs),
    formatINR(m.gross_profit),
    formatINR(m.expenses),
    formatINR(m.net_profit),
    m.sales > 0 ? `${((m.net_profit / m.sales) * 100).toFixed(1)}%` : '0%'
  ]);

  doc.autoTable({
    startY: currentY + 4,
    head: [['Month', 'Revenue', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit', 'Margin']],
    body: plRows.length ? plRows : [['No data available', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
  });

  // 3. Product Profitability Table
  currentY = doc.lastAutoTable.finalY + 10;
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Top Products Performance & Margin Analysis', 14, currentY);

  const prodRows = (productReport || []).slice(0, 8).map(p => [
    p.name,
    p.category,
    p.current_stock,
    p.units_sold,
    formatINR(p.total_revenue),
    formatINR(p.total_gross_profit),
    `${p.gross_margin_percent}%`
  ]);

  doc.autoTable({
    startY: currentY + 4,
    head: [['Product Name', 'Category', 'Stock', 'Sold', 'Revenue', 'Gross Profit', 'Margin']],
    body: prodRows.length ? prodRows : [['No products sold yet', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // Footer notes & page numbering
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Apex Accounting Engine • Strictly Confidential • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Financial_Report_${dateStr}.pdf`);
}
