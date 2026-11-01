const express = require('express');
const router = express.Router();
const { db, backupDir } = require('./db');
const { seedDatabase } = require('./seed');
const fs = require('fs');
const path = require('path');

// Helper to sanitize numbers
const num = (v, fallback = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
};

// ----------------------------------------------------
// SIMPLE BUSINESS DASHBOARD APIS (Streamlined & Simple)
// ----------------------------------------------------
router.get('/simple/summary', (req, res) => {
  try {
    const { month } = req.query; // optional 'YYYY-MM'

    // Lifetime / All-Time Totals
    const lifetimeTotals = db.prepare(`
      SELECT 
        COALESCE(SUM(total_sales), 0) AS totalSales,
        COALESCE(SUM(total_cost), 0) AS totalCost,
        COALESCE(SUM(total_profit), 0) AS totalProfit,
        COALESCE(SUM(quantity), 0) AS totalQuantitySold,
        COUNT(id) AS totalEntries
      FROM product_entries
    `).get();

    const lifetimeExpenses = db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) AS extraExpenses,
        COUNT(id) AS totalExpensesCount
      FROM extra_expenses
    `).get();

    // Lifetime Bank tracking for Vivek Bank
    const vivekLifetimeIn = db.prepare(`
      SELECT COALESCE(SUM(total_sales), 0) AS total
      FROM product_entries
      WHERE bank = 'Vivek Bank'
    `).get().total;

    const vivekLifetimeOut = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM extra_expenses
      WHERE bank = 'Vivek Bank'
    `).get().total;

    const vivekLifetimeBalance = vivekLifetimeIn - vivekLifetimeOut;

    // Lifetime Bank tracking for Mayank Bank
    const mayankLifetimeIn = db.prepare(`
      SELECT COALESCE(SUM(total_sales), 0) AS total
      FROM product_entries
      WHERE bank = 'Mayank Bank'
    `).get().total;

    const mayankLifetimeOut = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM extra_expenses
      WHERE bank = 'Mayank Bank'
    `).get().total;

    const mayankLifetimeBalance = mayankLifetimeIn - mayankLifetimeOut;

    const lifetimeFinalProfit = lifetimeTotals.totalProfit - lifetimeExpenses.extraExpenses;

    // Distinct list of all active months
    const distinctMonthsRows = db.prepare(`
      SELECT DISTINCT substr(entry_date, 1, 7) AS m FROM product_entries
      UNION
      SELECT DISTINCT substr(expense_date, 1, 7) AS m FROM extra_expenses
      ORDER BY m DESC
    `).all();

    const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. '2026-11'
    const availableMonthsSet = new Set(distinctMonthsRows.map(r => r.m).filter(Boolean));
    availableMonthsSet.add(currentMonthStr);
    const availableMonths = Array.from(availableMonthsSet).sort().reverse();

    // Monthly breakdown list for all active months
    const allMonthsBreakdown = availableMonths.map(mStr => {
      const pRow = db.prepare(`
        SELECT 
          COALESCE(SUM(total_sales), 0) AS sales,
          COALESCE(SUM(total_cost), 0) AS cost,
          COALESCE(SUM(total_profit), 0) AS profit,
          COALESCE(SUM(quantity), 0) AS qty,
          COUNT(id) AS count
        FROM product_entries
        WHERE substr(entry_date, 1, 7) = ?
      `).get(mStr);

      const eRow = db.prepare(`
        SELECT 
          COALESCE(SUM(amount), 0) AS expenses,
          COUNT(id) AS count
        FROM extra_expenses
        WHERE substr(expense_date, 1, 7) = ?
      `).get(mStr);

      const vIn = db.prepare(`
        SELECT COALESCE(SUM(total_sales), 0) AS total
        FROM product_entries
        WHERE bank = 'Vivek Bank' AND substr(entry_date, 1, 7) = ?
      `).get(mStr).total;

      const vOut = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM extra_expenses
        WHERE bank = 'Vivek Bank' AND substr(expense_date, 1, 7) = ?
      `).get(mStr).total;

      const mIn = db.prepare(`
        SELECT COALESCE(SUM(total_sales), 0) AS total
        FROM product_entries
        WHERE bank = 'Mayank Bank' AND substr(entry_date, 1, 7) = ?
      `).get(mStr).total;

      const mOut = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM extra_expenses
        WHERE bank = 'Mayank Bank' AND substr(expense_date, 1, 7) = ?
      `).get(mStr).total;

      const fProfit = pRow.profit - eRow.expenses;

      return {
        month: mStr,
        totalSales: pRow.sales,
        totalCost: pRow.cost,
        totalProfit: pRow.profit,
        extraExpenses: eRow.expenses,
        finalProfit: fProfit,
        quantitySold: pRow.qty,
        entriesCount: pRow.count,
        vivek: {
          moneyReceived: vIn,
          moneySpent: vOut,
          monthlyNet: vIn - vOut
        },
        mayank: {
          moneyReceived: mIn,
          moneySpent: mOut,
          monthlyNet: mIn - mOut
        }
      };
    });

    // If a specific month is requested (or active filter)
    const activeMonth = month || null;
    let selectedMonthSummary = null;

    if (activeMonth) {
      const match = allMonthsBreakdown.find(b => b.month === activeMonth);
      if (match) {
        selectedMonthSummary = {
          ...match,
          vivek: {
            ...match.vivek,
            currentBalance: vivekLifetimeBalance
          },
          mayank: {
            ...match.mayank,
            currentBalance: mayankLifetimeBalance
          }
        };
      } else {
        selectedMonthSummary = {
          month: activeMonth,
          totalSales: 0,
          totalCost: 0,
          totalProfit: 0,
          extraExpenses: 0,
          finalProfit: 0,
          quantitySold: 0,
          entriesCount: 0,
          vivek: {
            moneyReceived: 0,
            moneySpent: 0,
            monthlyNet: 0,
            currentBalance: vivekLifetimeBalance
          },
          mayank: {
            moneyReceived: 0,
            moneySpent: 0,
            monthlyNet: 0,
            currentBalance: mayankLifetimeBalance
          }
        };
      }
    }

    res.json({
      // Lifetime / Overall
      totalSales: lifetimeTotals.totalSales,
      totalCost: lifetimeTotals.totalCost,
      totalProfit: lifetimeTotals.totalProfit,
      extraExpenses: lifetimeExpenses.extraExpenses,
      finalProfit: lifetimeFinalProfit,
      totalQuantitySold: lifetimeTotals.totalQuantitySold,
      totalEntries: lifetimeTotals.totalEntries,
      banks: {
        vivek: {
          name: 'Vivek Bank',
          moneyIn: vivekLifetimeIn,
          moneyOut: vivekLifetimeOut,
          balance: vivekLifetimeBalance
        },
        mayank: {
          name: 'Mayank Bank',
          moneyIn: mayankLifetimeIn,
          moneyOut: mayankLifetimeOut,
          balance: mayankLifetimeBalance
        },
        totalCash: vivekLifetimeBalance + mayankLifetimeBalance
      },
      // Monthly Specifics
      availableMonths,
      selectedMonth: activeMonth,
      selectedMonthSummary,
      allMonthsBreakdown
    });
  } catch (err) {
    console.error('Error fetching simple summary:', err);
    res.status(500).json({ error: err.message });
  }
});

// Product Entries CRUD
router.get('/simple/products', (req, res) => {
  try {
    const { month } = req.query;
    let query = 'SELECT * FROM product_entries';
    const params = [];
    if (month && month !== 'all') {
      query += ' WHERE substr(entry_date, 1, 7) = ?';
      params.push(month);
    }
    query += ' ORDER BY id DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simple/products', (req, res) => {
  try {
    const { product_name, sell_price, cost_price, quantity, bank, entry_date } = req.body;

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({ error: 'Product Name is required' });
    }

    const sPrice = num(sell_price, 0);
    const cPrice = num(cost_price, 0);
    const qty = num(quantity, 1);

    if (qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // Exact required formulas:
    // Total Sales = Sell Price * Quantity
    // Total Cost = Cost Price * Quantity
    // Total Profit = (Sell Price - Cost Price) * Quantity
    const totalSales = Number((sPrice * qty).toFixed(2));
    const totalCost = Number((cPrice * qty).toFixed(2));
    const totalProfit = Number(((sPrice - cPrice) * qty).toFixed(2));
    const selectedBank = bank === 'Mayank Bank' ? 'Mayank Bank' : 'Vivek Bank';
    const dateStr = entry_date || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO product_entries (product_name, sell_price, cost_price, quantity, total_sales, total_cost, total_profit, bank, entry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      product_name.trim(),
      sPrice,
      cPrice,
      qty,
      totalSales,
      totalCost,
      totalProfit,
      selectedBank,
      dateStr
    );

    const inserted = db.prepare('SELECT * FROM product_entries WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(inserted);
  } catch (err) {
    console.error('Error adding product entry:', err);
    res.status(400).json({ error: err.message });
  }
});

router.put('/simple/products/:id', (req, res) => {
  try {
    const { product_name, sell_price, cost_price, quantity, bank, entry_date } = req.body;
    const sPrice = num(sell_price, 0);
    const cPrice = num(cost_price, 0);
    const qty = num(quantity, 1);

    const totalSales = Number((sPrice * qty).toFixed(2));
    const totalCost = Number((cPrice * qty).toFixed(2));
    const totalProfit = Number(((sPrice - cPrice) * qty).toFixed(2));
    const selectedBank = bank === 'Mayank Bank' ? 'Mayank Bank' : 'Vivek Bank';

    db.prepare(`
      UPDATE product_entries SET
        product_name = ?, sell_price = ?, cost_price = ?, quantity = ?,
        total_sales = ?, total_cost = ?, total_profit = ?, bank = ?, entry_date = ?
      WHERE id = ?
    `).run(
      product_name.trim(),
      sPrice,
      cPrice,
      qty,
      totalSales,
      totalCost,
      totalProfit,
      selectedBank,
      entry_date,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM product_entries WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/simple/products/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM product_entries WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Product entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Extra Expenses CRUD
router.get('/simple/expenses', (req, res) => {
  try {
    const { month } = req.query;
    let query = 'SELECT * FROM extra_expenses';
    const params = [];
    if (month && month !== 'all') {
      query += ' WHERE substr(expense_date, 1, 7) = ?';
      params.push(month);
    }
    query += ' ORDER BY id DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simple/expenses', (req, res) => {
  try {
    const { expense_name, amount, bank, expense_date } = req.body;
    if (!expense_name || !expense_name.trim()) {
      return res.status(400).json({ error: 'Expense Name is required' });
    }
    const amt = num(amount, 0);
    if (amt <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const selectedBank = bank === 'Mayank Bank' ? 'Mayank Bank' : 'Vivek Bank';
    const dateStr = expense_date || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO extra_expenses (expense_name, amount, bank, expense_date)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(expense_name.trim(), amt, selectedBank, dateStr);
    const inserted = db.prepare('SELECT * FROM extra_expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/simple/expenses/:id', (req, res) => {
  try {
    const { expense_name, amount, bank, expense_date } = req.body;
    const amt = num(amount, 0);
    const selectedBank = bank === 'Mayank Bank' ? 'Mayank Bank' : 'Vivek Bank';

    db.prepare(`
      UPDATE extra_expenses SET
        expense_name = ?, amount = ?, bank = ?, expense_date = ?
      WHERE id = ?
    `).run(expense_name.trim(), amt, selectedBank, expense_date, req.params.id);

    const updated = db.prepare('SELECT * FROM extra_expenses WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/simple/expenses/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM extra_expenses WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear All to ₹0
router.post('/simple/clear-all', (req, res) => {
  try {
    db.exec(`
      DELETE FROM product_entries;
      DELETE FROM extra_expenses;
    `);
    res.json({ success: true, message: 'All product entries and expenses cleared to ₹0' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 1. OVERVIEW & FINANCIAL KPI METRICS
// ----------------------------------------------------
router.get('/overview', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilterSales = '';
    let dateFilterPurchases = '';
    let dateFilterExpenses = '';
    const paramsSales = [];
    const paramsPurchases = [];
    const paramsExpenses = [];

    if (startDate && endDate) {
      dateFilterSales = ' AND sale_date BETWEEN ? AND ?';
      paramsSales.push(startDate, endDate);
      dateFilterPurchases = ' AND purchase_date BETWEEN ? AND ?';
      paramsPurchases.push(startDate, endDate);
      dateFilterExpenses = ' AND expense_date BETWEEN ? AND ?';
      paramsExpenses.push(startDate, endDate);
    }

    // 1. Sales metrics (exclude Refunded / Returned for revenue and COGS)
    const salesMetrics = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS totalSales,
        COALESCE(SUM(cogs), 0) AS totalCost,
        COALESCE(SUM(gross_profit), 0) AS grossProfit,
        COALESCE(SUM(quantity), 0) AS totalProductsSold,
        COALESCE(COUNT(id), 0) AS totalOrders,
        COALESCE(SUM(amount_received), 0) AS totalMoneyReceived,
        COALESCE(SUM(pending_amount), 0) AS pendingPayments
      FROM sales
      WHERE status = 'Completed' ${dateFilterSales}
    `).get(...paramsSales);

    // 2. Expenses
    const expenseMetrics = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS totalExpenses
      FROM expenses
      WHERE 1=1 ${dateFilterExpenses}
    `).get(...paramsExpenses);

    // 3. Purchases
    const purchaseMetrics = db.prepare(`
      SELECT 
        COALESCE(SUM(total_cost), 0) AS totalPurchaseCost,
        COALESCE(SUM(amount_paid), 0) AS totalPurchasePaid
      FROM purchases
      WHERE 1=1 ${dateFilterPurchases}
    `).get(...paramsPurchases);

    // 4. Capital Investments (Lifetime or date-filtered)
    const capitalMetrics = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS totalCapital
      FROM capital_investments
    `).get();

    // Cumulative Lifetime Cash Balance (Cash In minus Cash Out, strict cash accounting)
    const lifetimeCashIn = db.prepare(`
      SELECT 
        (SELECT COALESCE(SUM(amount_received), 0) FROM sales) +
        (SELECT COALESCE(SUM(amount), 0) FROM capital_investments) AS cashIn
    `).get().cashIn;

    const lifetimeCashOut = db.prepare(`
      SELECT 
        (SELECT COALESCE(SUM(amount_paid), 0) FROM purchases) +
        (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS cashOut
    `).get().cashOut;

    const availableBalance = lifetimeCashIn - lifetimeCashOut;

    const totalSales = salesMetrics.totalSales;
    const totalCost = salesMetrics.totalCost; // COGS for sold goods
    const grossProfit = totalSales - totalCost;
    const totalExpenses = expenseMetrics.totalExpenses;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    const totalInvestment = purchaseMetrics.totalPurchaseCost + capitalMetrics.totalCapital;

    res.json({
      totalSales,
      totalCost,
      grossProfit,
      totalExpenses,
      netProfit,
      totalLoss: netProfit < 0 ? Math.abs(netProfit) : 0,
      isNetLoss: netProfit < 0,
      profitMargin: Number(profitMargin.toFixed(2)),
      totalInvestment,
      totalProductsSold: salesMetrics.totalProductsSold,
      totalOrders: salesMetrics.totalOrders,
      pendingPayments: salesMetrics.pendingPayments,
      totalMoneyReceived: salesMetrics.totalMoneyReceived,
      totalMoneyPending: salesMetrics.pendingPayments,
      totalMoneySpent: purchaseMetrics.totalPurchasePaid + totalExpenses,
      totalPurchaseCost: purchaseMetrics.totalPurchaseCost,
      availableBalance,
      lifetimeCashIn,
      lifetimeCashOut
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. PRODUCTS / INVENTORY
// ----------------------------------------------------
router.get('/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT 
        p.*,
        COALESCE((SELECT SUM(s.quantity) FROM sales s WHERE s.product_id = p.id AND s.status = 'Completed'), 0) AS total_sold,
        COALESCE((SELECT SUM(s.total_amount) FROM sales s WHERE s.product_id = p.id AND s.status = 'Completed'), 0) AS total_revenue
      FROM products p
      ORDER BY p.name ASC
    `).all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', (req, res) => {
  try {
    const { name, category, sku, current_stock, avg_cost_per_unit, default_selling_price, min_stock_alert } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, category, sku, current_stock, avg_cost_per_unit, default_selling_price, min_stock_alert)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      category || 'General',
      sku || '',
      num(current_stock, 0),
      num(avg_cost_per_unit, 0),
      num(default_selling_price, 0),
      num(min_stock_alert, 5)
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/products/:id', (req, res) => {
  try {
    const { name, category, sku, current_stock, avg_cost_per_unit, default_selling_price, min_stock_alert } = req.body;
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, category = ?, sku = ?, current_stock = ?, avg_cost_per_unit = ?, default_selling_price = ?, min_stock_alert = ?
      WHERE id = ?
    `);

    stmt.run(
      name.trim(),
      category || 'General',
      sku || '',
      num(current_stock, 0),
      num(avg_cost_per_unit, 0),
      num(default_selling_price, 0),
      num(min_stock_alert, 5),
      req.params.id
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    const id = req.params.id;
    // Check if sales or purchases reference this product
    const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales WHERE product_id = ?').get(id).count;
    const purchaseCount = db.prepare('SELECT COUNT(*) as count FROM purchases WHERE product_id = ?').get(id).count;

    if (salesCount > 0 || purchaseCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete product: It is linked to ${salesCount} sale(s) and ${purchaseCount} purchase(s). Deactivate or keep for audit integrity.` 
      });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. SALES MANAGEMENT
// ----------------------------------------------------
router.get('/sales', (req, res) => {
  try {
    const { startDate, endDate, productId, paymentStatus, search } = req.query;
    let query = 'SELECT s.*, p.sku FROM sales s LEFT JOIN products p ON s.product_id = p.id WHERE 1=1';
    const params = [];

    if (startDate && endDate) {
      query += ' AND s.sale_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    if (productId) {
      query += ' AND s.product_id = ?';
      params.push(productId);
    }
    if (paymentStatus) {
      query += ' AND s.payment_status = ?';
      params.push(paymentStatus);
    }
    if (search) {
      query += ' AND (s.product_name LIKE ? OR s.customer_name LIKE ? OR s.notes LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY s.sale_date DESC, s.id DESC';
    const sales = db.prepare(query).all(...params);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sales', (req, res) => {
  try {
    const {
      product_id,
      product_name,
      customer_name,
      quantity,
      selling_price_per_unit,
      sale_date,
      payment_status,
      amount_received,
      payment_method,
      notes
    } = req.body;

    const qty = num(quantity);
    const price = num(selling_price_per_unit);
    if (!qty || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }
    if (price < 0) {
      return res.status(400).json({ error: 'Selling price cannot be negative' });
    }

    const totalAmount = Number((qty * price).toFixed(2));
    const statusPayment = payment_status || 'Paid';
    let received = 0;
    if (statusPayment === 'Paid') {
      received = totalAmount;
    } else if (statusPayment === 'Unpaid') {
      received = 0;
    } else {
      received = Math.min(totalAmount, num(amount_received, 0));
    }
    const pendingAmount = Number(Math.max(0, totalAmount - received).toFixed(2));

    let finalProductId = product_id ? parseInt(product_id) : null;
    let finalProductName = product_name ? product_name.trim() : '';

    const tx = db.transaction(() => {
      // Find or verify product
      let product = null;
      if (finalProductId) {
        product = db.prepare('SELECT * FROM products WHERE id = ?').get(finalProductId);
        if (product) finalProductName = product.name;
      } else if (finalProductName) {
        product = db.prepare('SELECT * FROM products WHERE LOWER(name) = LOWER(?)').get(finalProductName);
        if (product) finalProductId = product.id;
      }

      // If product doesn't exist, create it with 0 initial cost or price
      if (!product) {
        const createProd = db.prepare(`
          INSERT INTO products (name, category, avg_cost_per_unit, default_selling_price, current_stock)
          VALUES (?, 'General', 0, ?, 0)
        `).run(finalProductName || 'Custom Item', price);
        finalProductId = createProd.lastInsertRowid;
        finalProductName = finalProductName || 'Custom Item';
        product = { id: finalProductId, name: finalProductName, avg_cost_per_unit: 0, current_stock: 0 };
      }

      const unitCostAtSale = product.avg_cost_per_unit || 0;
      const cogs = Number((qty * unitCostAtSale).toFixed(2));
      const grossProfit = Number((totalAmount - cogs).toFixed(2));

      // Deduct product stock
      db.prepare('UPDATE products SET current_stock = current_stock - ? WHERE id = ?').run(qty, finalProductId);

      // Insert sale
      const insertStmt = db.prepare(`
        INSERT INTO sales (
          product_id, product_name, customer_name, quantity, selling_price_per_unit,
          total_amount, unit_cost_at_sale, cogs, gross_profit, sale_date,
          payment_status, amount_received, pending_amount, payment_method, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed')
      `);

      const result = insertStmt.run(
        finalProductId,
        finalProductName,
        customer_name || 'Walk-in Customer',
        qty,
        price,
        totalAmount,
        unitCostAtSale,
        cogs,
        grossProfit,
        sale_date || new Date().toISOString().split('T')[0],
        statusPayment,
        received,
        pendingAmount,
        payment_method || 'UPI',
        notes || ''
      );

      return db.prepare('SELECT * FROM sales WHERE id = ?').get(result.lastInsertRowid);
    });

    const newSale = tx();
    res.status(201).json(newSale);
  } catch (error) {
    console.error('Error adding sale:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/sales/:id', (req, res) => {
  try {
    const saleId = req.params.id;
    const existing = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    if (!existing) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const {
      product_id,
      product_name,
      customer_name,
      quantity,
      selling_price_per_unit,
      sale_date,
      payment_status,
      amount_received,
      payment_method,
      notes,
      status
    } = req.body;

    const qty = num(quantity, existing.quantity);
    const price = num(selling_price_per_unit, existing.selling_price_per_unit);
    const totalAmount = Number((qty * price).toFixed(2));
    const statusPayment = payment_status || existing.payment_status;

    let received = 0;
    if (statusPayment === 'Paid') {
      received = totalAmount;
    } else if (statusPayment === 'Unpaid') {
      received = 0;
    } else {
      received = Math.min(totalAmount, num(amount_received, existing.amount_received));
    }
    const pendingAmount = Number(Math.max(0, totalAmount - received).toFixed(2));

    const finalStatus = status || existing.status;

    const tx = db.transaction(() => {
      // 1. Rollback old stock impact if old sale was completed
      if (existing.status === 'Completed' && existing.product_id) {
        db.prepare('UPDATE products SET current_stock = current_stock + ? WHERE id = ?').run(existing.quantity, existing.product_id);
      }

      // 2. Determine product
      const targetProductId = product_id ? parseInt(product_id) : existing.product_id;
      let targetProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(targetProductId);
      const prodName = targetProduct ? targetProduct.name : (product_name || existing.product_name);

      const unitCost = targetProduct ? targetProduct.avg_cost_per_unit : existing.unit_cost_at_sale;
      const cogs = finalStatus === 'Refunded' ? 0 : Number((qty * unitCost).toFixed(2));
      const grossProfit = finalStatus === 'Refunded' ? 0 : Number((totalAmount - cogs).toFixed(2));

      // 3. Apply new stock impact if new status is completed
      if (finalStatus === 'Completed' && targetProductId) {
        db.prepare('UPDATE products SET current_stock = current_stock - ? WHERE id = ?').run(qty, targetProductId);
      }

      db.prepare(`
        UPDATE sales SET
          product_id = ?, product_name = ?, customer_name = ?, quantity = ?, selling_price_per_unit = ?,
          total_amount = ?, unit_cost_at_sale = ?, cogs = ?, gross_profit = ?, sale_date = ?,
          payment_status = ?, amount_received = ?, pending_amount = ?, payment_method = ?, notes = ?, status = ?
        WHERE id = ?
      `).run(
        targetProductId,
        prodName,
        customer_name || existing.customer_name,
        qty,
        price,
        totalAmount,
        unitCost,
        cogs,
        grossProfit,
        sale_date || existing.sale_date,
        statusPayment,
        received,
        pendingAmount,
        payment_method || existing.payment_method,
        notes !== undefined ? notes : existing.notes,
        finalStatus,
        saleId
      );

      return db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    });

    const updatedSale = tx();
    res.json(updatedSale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/sales/:id', (req, res) => {
  try {
    const saleId = req.params.id;
    const existing = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    if (!existing) {
      return res.status(404).json({ error: 'Sale record not found' });
    }

    const tx = db.transaction(() => {
      // Restore stock if sale was Completed
      if (existing.status === 'Completed' && existing.product_id) {
        db.prepare('UPDATE products SET current_stock = current_stock + ? WHERE id = ?').run(existing.quantity, existing.product_id);
      }
      db.prepare('DELETE FROM sales WHERE id = ?').run(saleId);
    });

    tx();
    res.json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sales/:id/refund', (req, res) => {
  try {
    const saleId = req.params.id;
    const existing = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    if (!existing) {
      return res.status(404).json({ error: 'Sale record not found' });
    }
    if (existing.status === 'Refunded') {
      return res.status(400).json({ error: 'Sale is already marked as refunded' });
    }

    const tx = db.transaction(() => {
      // Restore stock to inventory
      if (existing.product_id) {
        db.prepare('UPDATE products SET current_stock = current_stock + ? WHERE id = ?').run(existing.quantity, existing.product_id);
      }

      db.prepare(`
        UPDATE sales SET
          status = 'Refunded',
          notes = notes || ' [REFUNDED on ' || date('now') || ']'
        WHERE id = ?
      `).run(saleId);

      return db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    });

    const refunded = tx();
    res.json(refunded);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. PRODUCT COST & PURCHASES MANAGEMENT
// ----------------------------------------------------
router.get('/purchases', (req, res) => {
  try {
    const { startDate, endDate, productId, search } = req.query;
    let query = 'SELECT p.*, pr.sku, pr.category FROM purchases p LEFT JOIN products pr ON p.product_id = pr.id WHERE 1=1';
    const params = [];

    if (startDate && endDate) {
      query += ' AND p.purchase_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    if (productId) {
      query += ' AND p.product_id = ?';
      params.push(productId);
    }
    if (search) {
      query += ' AND (p.product_name LIKE ? OR p.supplier_name LIKE ? OR p.notes LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.purchase_date DESC, p.id DESC';
    const purchases = db.prepare(query).all(...params);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/purchases', (req, res) => {
  try {
    const {
      product_id,
      product_name,
      quantity,
      cost_per_unit,
      supplier_name,
      purchase_date,
      payment_status,
      amount_paid,
      payment_method,
      notes
    } = req.body;

    const qty = num(quantity);
    const cost = num(cost_per_unit);
    if (!qty || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }
    if (cost < 0) {
      return res.status(400).json({ error: 'Cost per unit cannot be negative' });
    }

    const totalCost = Number((qty * cost).toFixed(2));
    const statusPayment = payment_status || 'Paid';
    let paid = 0;
    if (statusPayment === 'Paid') {
      paid = totalCost;
    } else if (statusPayment === 'Unpaid') {
      paid = 0;
    } else {
      paid = Math.min(totalCost, num(amount_paid, 0));
    }

    let finalProductId = product_id ? parseInt(product_id) : null;
    let finalProductName = product_name ? product_name.trim() : '';

    const tx = db.transaction(() => {
      let product = null;
      if (finalProductId) {
        product = db.prepare('SELECT * FROM products WHERE id = ?').get(finalProductId);
        if (product) finalProductName = product.name;
      } else if (finalProductName) {
        product = db.prepare('SELECT * FROM products WHERE LOWER(name) = LOWER(?)').get(finalProductName);
        if (product) finalProductId = product.id;
      }

      if (!product) {
        // Create new product with this purchase as initial stock & cost
        const createProd = db.prepare(`
          INSERT INTO products (name, category, current_stock, avg_cost_per_unit, default_selling_price)
          VALUES (?, 'General', ?, ?, ?)
        `).run(finalProductName || 'New Inventory Item', qty, cost, Number((cost * 1.4).toFixed(2)));
        finalProductId = createProd.lastInsertRowid;
        finalProductName = finalProductName || 'New Inventory Item';
      } else {
        // Calculate new weighted average cost & stock
        const currentStock = Math.max(0, product.current_stock);
        const oldTotalValue = currentStock * product.avg_cost_per_unit;
        const newBatchValue = qty * cost;
        const newTotalStock = currentStock + qty;
        const newAvgCost = newTotalStock > 0 ? Number(((oldTotalValue + newBatchValue) / newTotalStock).toFixed(2)) : cost;

        db.prepare(`
          UPDATE products 
          SET current_stock = current_stock + ?, avg_cost_per_unit = ?
          WHERE id = ?
        `).run(qty, newAvgCost, finalProductId);
      }

      const insertStmt = db.prepare(`
        INSERT INTO purchases (
          product_id, product_name, quantity, cost_per_unit, total_cost,
          supplier_name, purchase_date, payment_status, amount_paid, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertStmt.run(
        finalProductId,
        finalProductName,
        qty,
        cost,
        totalCost,
        supplier_name || 'Standard Supplier',
        purchase_date || new Date().toISOString().split('T')[0],
        statusPayment,
        paid,
        payment_method || 'Bank Transfer',
        notes || ''
      );

      return db.prepare('SELECT * FROM purchases WHERE id = ?').get(result.lastInsertRowid);
    });

    const newPurchase = tx();
    res.status(201).json(newPurchase);
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/purchases/:id', (req, res) => {
  try {
    const purchaseId = req.params.id;
    const existing = db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId);
    if (!existing) {
      return res.status(404).json({ error: 'Purchase record not found' });
    }

    const {
      product_id,
      product_name,
      quantity,
      cost_per_unit,
      supplier_name,
      purchase_date,
      payment_status,
      amount_paid,
      payment_method,
      notes
    } = req.body;

    const qty = num(quantity, existing.quantity);
    const cost = num(cost_per_unit, existing.cost_per_unit);
    const totalCost = Number((qty * cost).toFixed(2));
    const statusPayment = payment_status || existing.payment_status;

    let paid = 0;
    if (statusPayment === 'Paid') {
      paid = totalCost;
    } else if (statusPayment === 'Unpaid') {
      paid = 0;
    } else {
      paid = Math.min(totalCost, num(amount_paid, existing.amount_paid));
    }

    const tx = db.transaction(() => {
      // Rollback previous stock
      if (existing.product_id) {
        db.prepare('UPDATE products SET current_stock = current_stock - ? WHERE id = ?').run(existing.quantity, existing.product_id);
      }

      const targetProductId = product_id ? parseInt(product_id) : existing.product_id;
      let targetProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(targetProductId);
      const prodName = targetProduct ? targetProduct.name : (product_name || existing.product_name);

      // Add new stock
      if (targetProductId) {
        db.prepare('UPDATE products SET current_stock = current_stock + ? WHERE id = ?').run(qty, targetProductId);
      }

      db.prepare(`
        UPDATE purchases SET
          product_id = ?, product_name = ?, quantity = ?, cost_per_unit = ?, total_cost = ?,
          supplier_name = ?, purchase_date = ?, payment_status = ?, amount_paid = ?, payment_method = ?, notes = ?
        WHERE id = ?
      `).run(
        targetProductId,
        prodName,
        qty,
        cost,
        totalCost,
        supplier_name || existing.supplier_name,
        purchase_date || existing.purchase_date,
        statusPayment,
        paid,
        payment_method || existing.payment_method,
        notes !== undefined ? notes : existing.notes,
        purchaseId
      );

      return db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId);
    });

    const updated = tx();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/purchases/:id', (req, res) => {
  try {
    const purchaseId = req.params.id;
    const existing = db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId);
    if (!existing) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const tx = db.transaction(() => {
      if (existing.product_id) {
        db.prepare('UPDATE products SET current_stock = current_stock - ? WHERE id = ?').run(existing.quantity, existing.product_id);
      }
      db.prepare('DELETE FROM purchases WHERE id = ?').run(purchaseId);
    });

    tx();
    res.json({ success: true, message: 'Purchase deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 5. EXPENSE MANAGEMENT
// ----------------------------------------------------
router.get('/expenses', (req, res) => {
  try {
    const { startDate, endDate, category, search } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (startDate && endDate) {
      query += ' AND expense_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (expense_name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY expense_date DESC, id DESC';
    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/expenses', (req, res) => {
  try {
    const { expense_name, category, amount, expense_date, payment_method, description } = req.body;
    const amt = num(amount);
    if (!expense_name || !expense_name.trim()) {
      return res.status(400).json({ error: 'Expense name is required' });
    }
    if (amt <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const stmt = db.prepare(`
      INSERT INTO expenses (expense_name, category, amount, expense_date, payment_method, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      expense_name.trim(),
      category || 'Other Expenses',
      amt,
      expense_date || new Date().toISOString().split('T')[0],
      payment_method || 'Bank Transfer',
      description || ''
    );

    const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/expenses/:id', (req, res) => {
  try {
    const { expense_name, category, amount, expense_date, payment_method, description } = req.body;
    const amt = num(amount);
    if (!expense_name || !expense_name.trim()) {
      return res.status(400).json({ error: 'Expense name is required' });
    }
    if (amt <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    db.prepare(`
      UPDATE expenses SET
        expense_name = ?, category = ?, amount = ?, expense_date = ?, payment_method = ?, description = ?
      WHERE id = ?
    `).run(
      expense_name.trim(),
      category || 'Other Expenses',
      amt,
      expense_date,
      payment_method || 'Bank Transfer',
      description || '',
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/expenses/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6. MASTER TRANSACTION HISTORY
// ----------------------------------------------------
router.get('/transactions', (req, res) => {
  try {
    const { type, startDate, endDate, search, sortBy = 'date', sortOrder = 'DESC' } = req.query;

    const sales = db.prepare(`
      SELECT 
        'sale' AS type,
        s.id,
        s.sale_date AS date,
        s.product_name AS title,
        'Sale' AS category,
        s.customer_name AS counterparty,
        s.total_amount AS amount,
        s.payment_method,
        s.payment_status,
        s.amount_received AS cash_in,
        0 AS cash_out,
        s.notes,
        s.status,
        s.quantity,
        s.selling_price_per_unit AS unit_price,
        s.gross_profit
      FROM sales s
    `).all();

    const purchases = db.prepare(`
      SELECT 
        'purchase' AS type,
        p.id,
        p.purchase_date AS date,
        p.product_name AS title,
        'Purchase / Inventory' AS category,
        p.supplier_name AS counterparty,
        p.total_cost AS amount,
        p.payment_method,
        p.payment_status,
        0 AS cash_in,
        p.amount_paid AS cash_out,
        p.notes,
        'Completed' AS status,
        p.quantity,
        p.cost_per_unit AS unit_price,
        0 AS gross_profit
      FROM purchases p
    `).all();

    const expenses = db.prepare(`
      SELECT 
        'expense' AS type,
        e.id,
        e.expense_date AS date,
        e.expense_name AS title,
        e.category AS category,
        'Operational Expense' AS counterparty,
        e.amount AS amount,
        e.payment_method,
        'Paid' AS payment_status,
        0 AS cash_in,
        e.amount AS cash_out,
        e.description AS notes,
        'Completed' AS status,
        1 AS quantity,
        e.amount AS unit_price,
        0 AS gross_profit
      FROM expenses e
    `).all();

    let combined = [...sales, ...purchases, ...expenses];

    // Filter by type
    if (type && type !== 'all') {
      combined = combined.filter(t => t.type === type);
    }

    // Filter by date
    if (startDate && endDate) {
      combined = combined.filter(t => t.date >= startDate && t.date <= endDate);
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.counterparty && t.counterparty.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Sort
    combined.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'date') {
        comparison = a.date.localeCompare(b.date) || a.id - b.id;
      } else if (sortBy === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      }
      return sortOrder.toUpperCase() === 'DESC' ? -comparison : comparison;
    });

    res.json(combined);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 7. REPORTS & ANALYTICS
// ----------------------------------------------------
router.get('/reports', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let sFilter = '';
    let pFilter = '';
    let eFilter = '';
    const sParams = [];
    const pParams = [];
    const eParams = [];

    if (startDate && endDate) {
      sFilter = ' AND sale_date BETWEEN ? AND ?';
      sParams.push(startDate, endDate);
      pFilter = ' AND purchase_date BETWEEN ? AND ?';
      pParams.push(startDate, endDate);
      eFilter = ' AND expense_date BETWEEN ? AND ?';
      eParams.push(startDate, endDate);
    }

    // 1. Daily / Monthly trend
    const salesByDate = db.prepare(`
      SELECT 
        sale_date AS date,
        COALESCE(SUM(total_amount), 0) AS sales,
        COALESCE(SUM(cogs), 0) AS cogs,
        COALESCE(SUM(gross_profit), 0) AS gross_profit,
        COUNT(id) AS order_count
      FROM sales
      WHERE status = 'Completed' ${sFilter}
      GROUP BY sale_date
      ORDER BY sale_date ASC
    `).all(...sParams);

    const expensesByDate = db.prepare(`
      SELECT 
        expense_date AS date,
        COALESCE(SUM(amount), 0) AS expenses
      FROM expenses
      WHERE 1=1 ${eFilter}
      GROUP BY expense_date
      ORDER BY expense_date ASC
    `).all(...eParams);

    // 2. Product-wise Profit Report
    const productProfitReport = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.current_stock,
        p.avg_cost_per_unit,
        COALESCE(SUM(s.quantity), 0) AS units_sold,
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(SUM(s.cogs), 0) AS total_cogs,
        COALESCE(SUM(s.gross_profit), 0) AS total_gross_profit,
        CASE 
          WHEN SUM(s.total_amount) > 0 
          THEN ROUND((SUM(s.gross_profit) * 100.0) / SUM(s.total_amount), 2)
          ELSE 0 
        END AS gross_margin_percent
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id AND s.status = 'Completed' ${sFilter.replace(/sale_date/g, 's.sale_date')}
      GROUP BY p.id
      ORDER BY total_revenue DESC
    `).all(...sParams);

    // 3. Best Selling Products (by quantity)
    const bestSelling = db.prepare(`
      SELECT 
        product_name,
        COALESCE(SUM(quantity), 0) AS total_units,
        COALESCE(SUM(total_amount), 0) AS total_sales
      FROM sales
      WHERE status = 'Completed' ${sFilter}
      GROUP BY product_name
      ORDER BY total_units DESC
      LIMIT 5
    `).all(...sParams);

    // 4. Highest Profit Products
    const highestProfit = db.prepare(`
      SELECT 
        product_name,
        COALESCE(SUM(gross_profit), 0) AS total_profit,
        COALESCE(SUM(total_amount), 0) AS total_sales
      FROM sales
      WHERE status = 'Completed' ${sFilter}
      GROUP BY product_name
      ORDER BY total_profit DESC
      LIMIT 5
    `).all(...sParams);

    // 5. Expense Breakdown by Category
    const expenseBreakdown = db.prepare(`
      SELECT 
        category,
        COALESCE(SUM(amount), 0) AS total_amount,
        COUNT(id) AS count
      FROM expenses
      WHERE 1=1 ${eFilter}
      GROUP BY category
      ORDER BY total_amount DESC
    `).all(...eParams);

    // 6. Monthly P&L breakdown
    const monthlyPL = db.prepare(`
      WITH Months AS (
        SELECT strftime('%Y-%m', sale_date) AS month FROM sales WHERE status = 'Completed'
        UNION
        SELECT strftime('%Y-%m', expense_date) AS month FROM expenses
      )
      SELECT 
        m.month,
        COALESCE((SELECT SUM(total_amount) FROM sales WHERE strftime('%Y-%m', sale_date) = m.month AND status = 'Completed'), 0) AS sales,
        COALESCE((SELECT SUM(cogs) FROM sales WHERE strftime('%Y-%m', sale_date) = m.month AND status = 'Completed'), 0) AS cogs,
        COALESCE((SELECT SUM(gross_profit) FROM sales WHERE strftime('%Y-%m', sale_date) = m.month AND status = 'Completed'), 0) AS gross_profit,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE strftime('%Y-%m', expense_date) = m.month), 0) AS expenses,
        (
          COALESCE((SELECT SUM(gross_profit) FROM sales WHERE strftime('%Y-%m', sale_date) = m.month AND status = 'Completed'), 0) -
          COALESCE((SELECT SUM(amount) FROM expenses WHERE strftime('%Y-%m', expense_date) = m.month), 0)
        ) AS net_profit
      FROM Months m
      ORDER BY m.month DESC
    `).all();

    res.json({
      salesByDate,
      expensesByDate,
      productProfitReport,
      bestSelling,
      highestProfit,
      expenseBreakdown,
      monthlyPL
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 8. BACKUP & RESTORE
// ----------------------------------------------------
router.get('/backup', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products').all();
    const purchases = db.prepare('SELECT * FROM purchases').all();
    const sales = db.prepare('SELECT * FROM sales').all();
    const expenses = db.prepare('SELECT * FROM expenses').all();
    const capital = db.prepare('SELECT * FROM capital_investments').all();
    const settings = db.prepare('SELECT * FROM business_settings').all();

    const backupData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      appName: 'Apex Business Accounting Dashboard',
      data: {
        products,
        purchases,
        sales,
        expenses,
        capital,
        settings
      }
    };

    // Also write a copy to disk in backupDir
    const backupFileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(path.join(backupDir, backupFileName), JSON.stringify(backupData, null, 2));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${backupFileName}`);
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/restore', (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !data.products || !data.sales || !data.purchases || !data.expenses) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }

    const tx = db.transaction(() => {
      // Clear current data
      db.exec(`
        DELETE FROM capital_investments;
        DELETE FROM expenses;
        DELETE FROM sales;
        DELETE FROM purchases;
        DELETE FROM products;
      `);

      // Restore products
      const insertProd = db.prepare(`
        INSERT INTO products (id, name, category, sku, current_stock, avg_cost_per_unit, default_selling_price, min_stock_alert, created_at)
        VALUES (@id, @name, @category, @sku, @current_stock, @avg_cost_per_unit, @default_selling_price, @min_stock_alert, @created_at)
      `);
      for (const p of data.products) insertProd.run(p);

      // Restore purchases
      const insertPur = db.prepare(`
        INSERT INTO purchases (id, product_id, product_name, quantity, cost_per_unit, total_cost, supplier_name, purchase_date, payment_status, amount_paid, payment_method, notes, created_at)
        VALUES (@id, @product_id, @product_name, @quantity, @cost_per_unit, @total_cost, @supplier_name, @purchase_date, @payment_status, @amount_paid, @payment_method, @notes, @created_at)
      `);
      for (const pur of data.purchases) insertPur.run(pur);

      // Restore sales
      const insertSale = db.prepare(`
        INSERT INTO sales (id, product_id, product_name, customer_name, quantity, selling_price_per_unit, total_amount, unit_cost_at_sale, cogs, gross_profit, sale_date, payment_status, amount_received, pending_amount, payment_method, notes, status, created_at)
        VALUES (@id, @product_id, @product_name, @customer_name, @quantity, @selling_price_per_unit, @total_amount, @unit_cost_at_sale, @cogs, @gross_profit, @sale_date, @payment_status, @amount_received, @pending_amount, @payment_method, @notes, @status, @created_at)
      `);
      for (const s of data.sales) insertSale.run(s);

      // Restore expenses
      const insertExp = db.prepare(`
        INSERT INTO expenses (id, expense_name, category, amount, expense_date, payment_method, description, created_at)
        VALUES (@id, @expense_name, @category, @amount, @expense_date, @payment_method, @description, @created_at)
      `);
      for (const e of data.expenses) insertExp.run(e);

      // Restore capital
      if (data.capital && Array.isArray(data.capital)) {
        const insertCap = db.prepare(`
          INSERT INTO capital_investments (id, source, amount, investment_date, notes, created_at)
          VALUES (@id, @source, @amount, @investment_date, @notes, @created_at)
        `);
        for (const c of data.capital) insertCap.run(c);
      }
    });

    tx();
    res.json({ success: true, message: 'Data successfully restored from backup!' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/clear-all', (req, res) => {
  try {
    db.exec(`
      DELETE FROM capital_investments;
      DELETE FROM expenses;
      DELETE FROM sales;
      DELETE FROM purchases;
      DELETE FROM products;
    `);
    res.json({ success: true, message: 'All transactions, products and expenses cleared. Database is completely at ₹0.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM business_settings').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings', (req, res) => {
  try {
    const upsert = db.prepare(`
      INSERT INTO business_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    const tx = db.transaction(() => {
      for (const [k, v] of Object.entries(req.body)) {
        upsert.run(k, String(v));
      }
    });
    tx();
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
