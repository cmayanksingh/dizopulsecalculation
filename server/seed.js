const { db } = require('./db');

function seedDatabase(force = false) {
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount > 0 && !force) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  if (force) {
    db.exec(`
      DELETE FROM capital_investments;
      DELETE FROM expenses;
      DELETE FROM sales;
      DELETE FROM purchases;
      DELETE FROM products;
    `);
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (name, category, sku, current_stock, avg_cost_per_unit, default_selling_price, min_stock_alert)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPurchase = db.prepare(`
    INSERT INTO purchases (product_id, product_name, quantity, cost_per_unit, total_cost, supplier_name, purchase_date, payment_status, amount_paid, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSale = db.prepare(`
    INSERT INTO sales (product_id, product_name, customer_name, quantity, selling_price_per_unit, total_amount, unit_cost_at_sale, cogs, gross_profit, sale_date, payment_status, amount_received, pending_amount, payment_method, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertExpense = db.prepare(`
    INSERT INTO expenses (expense_name, category, amount, expense_date, payment_method, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertCapital = db.prepare(`
    INSERT INTO capital_investments (source, amount, investment_date, notes)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    // 1. Initial Capital Investment
    insertCapital.run('Founder Initial Capital', 500000, '2026-10-01', 'Initial working capital injection');

    // 2. Products
    const productsData = [
      { name: 'Wireless Noise-Canceling Earbuds Pro', category: 'Electronics', sku: 'EL-EAR-001', stock: 45, cost: 1850, price: 3499, minStock: 10 },
      { name: 'Ergonomic Memory Foam Desk Chair Mat', category: 'Office Supplies', sku: 'OF-MAT-002', stock: 30, cost: 720, price: 1599, minStock: 8 },
      { name: 'Organic Cotton Crewneck T-Shirt (Pack of 3)', category: 'Apparel', sku: 'AP-TSH-003', stock: 65, cost: 450, price: 1199, minStock: 15 },
      { name: 'Insulated Stainless Steel Smart Flask (1L)', category: 'Home & Kitchen', sku: 'HK-FLK-004', stock: 40, cost: 580, price: 1350, minStock: 12 },
      { name: 'Mechanical RGB Gaming Keyboard', category: 'Electronics', sku: 'EL-KBD-005', stock: 22, cost: 2400, price: 4799, minStock: 5 },
      { name: 'Premium Biodegradable Shipping Boxes (100pc)', category: 'Packaging', sku: 'PK-BOX-006', stock: 80, cost: 350, price: 850, minStock: 20 },
    ];

    const prodMap = {};
    for (const p of productsData) {
      const res = insertProduct.run(p.name, p.category, p.sku, p.stock, p.cost, p.price, p.minStock);
      prodMap[p.name] = { id: res.lastInsertRowid, ...p };
    }

    // 3. Purchases (Initial Stock batches)
    const purchasesData = [
      { prod: 'Wireless Noise-Canceling Earbuds Pro', qty: 60, cost: 1850, supplier: 'Shenzhen Audio Tech Ltd / Mumbai Import', date: '2026-10-02', status: 'Paid', method: 'Bank Transfer' },
      { prod: 'Ergonomic Memory Foam Desk Chair Mat', qty: 45, cost: 720, supplier: 'Comfort Ergonomics Pune', date: '2026-10-03', status: 'Paid', method: 'Bank Transfer' },
      { prod: 'Organic Cotton Crewneck T-Shirt (Pack of 3)', qty: 100, cost: 450, supplier: 'Tirupur Knitwear Hub', date: '2026-10-04', status: 'Paid', method: 'UPI' },
      { prod: 'Insulated Stainless Steel Smart Flask (1L)', qty: 60, cost: 580, supplier: 'Gujarat Steel Impex', date: '2026-10-05', status: 'Paid', method: 'Bank Transfer' },
      { prod: 'Mechanical RGB Gaming Keyboard', qty: 30, cost: 2400, supplier: 'Apex Tech Wholesalers Bengaluru', date: '2026-10-06', status: 'Paid', method: 'Bank Transfer' },
      { prod: 'Premium Biodegradable Shipping Boxes (100pc)', qty: 120, cost: 350, supplier: 'EcoPack India Ltd', date: '2026-10-07', status: 'Paid', method: 'UPI' },
    ];

    for (const pur of purchasesData) {
      const p = prodMap[pur.prod];
      const totalCost = pur.qty * pur.cost;
      insertPurchase.run(p.id, pur.prod, pur.qty, pur.cost, totalCost, pur.supplier, pur.date, pur.status, totalCost, pur.method, 'Initial batch inventory order');
    }

    // 4. Sales across October and November 2026
    const salesData = [
      { prod: 'Wireless Noise-Canceling Earbuds Pro', customer: 'Aarav Mehta', qty: 3, price: 3499, date: '2026-10-10', status: 'Paid', received: 10497, method: 'UPI', notes: 'Online order #1001' },
      { prod: 'Ergonomic Memory Foam Desk Chair Mat', customer: 'Pooja Verma', qty: 2, price: 1599, date: '2026-10-12', status: 'Paid', received: 3198, method: 'Credit Card', notes: 'Corporate purchase' },
      { prod: 'Organic Cotton Crewneck T-Shirt (Pack of 3)', customer: 'Rohan Deshmukh', qty: 5, price: 1199, date: '2026-10-15', status: 'Paid', received: 5995, method: 'UPI', notes: 'Gift hamper order' },
      { prod: 'Insulated Stainless Steel Smart Flask (1L)', customer: 'Neha Kapoor', qty: 4, price: 1350, date: '2026-10-18', status: 'Paid', received: 5400, method: 'UPI', notes: 'Direct website sale' },
      { prod: 'Mechanical RGB Gaming Keyboard', customer: 'Kunal Singhania', qty: 2, price: 4799, date: '2026-10-20', status: 'Partial', received: 5000, method: 'Bank Transfer', notes: 'Advance received; balance on delivery' },
      { prod: 'Wireless Noise-Canceling Earbuds Pro', customer: 'Vikramaditya Rao', qty: 4, price: 3499, date: '2026-10-22', status: 'Paid', received: 13996, method: 'UPI', notes: 'Festival promo' },
      { prod: 'Premium Biodegradable Shipping Boxes (100pc)', customer: 'GreenDrop Logistics', qty: 20, price: 850, date: '2026-10-24', status: 'Unpaid', received: 0, method: 'Bank Transfer', notes: 'B2B Net-15 invoice #INV-402' },
      { prod: 'Organic Cotton Crewneck T-Shirt (Pack of 3)', customer: 'Ananya Iyer', qty: 8, price: 1199, date: '2026-10-26', status: 'Paid', received: 9592, method: 'Cash', notes: 'In-store retail counter' },
      { prod: 'Ergonomic Memory Foam Desk Chair Mat', customer: 'TechNest Coworking', qty: 10, price: 1550, date: '2026-10-28', status: 'Paid', received: 15500, method: 'Bank Transfer', notes: 'Bulk purchase discount' },
      { prod: 'Insulated Stainless Steel Smart Flask (1L)', customer: 'Aditi Nair', qty: 6, price: 1350, date: '2026-10-29', status: 'Paid', received: 8100, method: 'UPI', notes: 'Express dispatched' },
      { prod: 'Wireless Noise-Canceling Earbuds Pro', customer: 'Sanjay Chawla', qty: 5, price: 3499, date: '2026-10-30', status: 'Paid', received: 17495, method: 'Credit Card', notes: 'Pre-diwali bulk order' },
      { prod: 'Mechanical RGB Gaming Keyboard', customer: 'Elite Esports Hub', qty: 4, price: 4799, date: '2026-10-31', status: 'Partial', received: 10000, method: 'Bank Transfer', notes: 'Installment 1 of 2' },
      { prod: 'Organic Cotton Crewneck T-Shirt (Pack of 3)', customer: 'Ritu Sen', qty: 12, price: 1150, date: '2026-11-01', status: 'Paid', received: 13800, method: 'UPI', notes: 'Event crew apparel' },
      { prod: 'Insulated Stainless Steel Smart Flask (1L)', customer: 'Manish Joshi', qty: 3, price: 1350, date: '2026-11-01', status: 'Paid', received: 4050, method: 'Cash', notes: 'Walk-in customer' },
    ];

    for (const s of salesData) {
      const p = prodMap[s.prod];
      const totalAmount = s.qty * s.price;
      const unitCost = p.cost;
      const cogs = s.qty * unitCost;
      const grossProfit = totalAmount - cogs;
      const pending = Math.max(0, totalAmount - s.received);

      insertSale.run(
        p.id,
        s.prod,
        s.customer,
        s.qty,
        s.price,
        totalAmount,
        unitCost,
        cogs,
        grossProfit,
        s.date,
        s.status,
        s.received,
        pending,
        s.method,
        s.notes,
        'Completed'
      );
    }

    // 5. Business Expenses across specified categories
    const expensesData = [
      { name: 'Google Ads & Meta Campaign', category: 'Advertising', amount: 14500, date: '2026-10-08', method: 'Credit Card', desc: 'October customer acquisition drive' },
      { name: 'Influencer Marketing Reel Promo', category: 'Marketing', amount: 12000, date: '2026-10-14', method: 'UPI', desc: 'Lifestyle & tech unboxing campaign' },
      { name: 'Shopify & AWS Cloud Hosting', category: 'Website', amount: 6200, date: '2026-10-15', method: 'Credit Card', desc: 'Monthly ecommerce server & CDN hosting' },
      { name: 'Zoho One Business Suite', category: 'Software', amount: 4800, date: '2026-10-16', method: 'Credit Card', desc: 'Monthly software subscription' },
      { name: 'Canva Pro & Figma Design Suite', category: 'Subscription', amount: 2400, date: '2026-10-18', method: 'UPI', desc: 'Creative asset subscription' },
      { name: 'Airtel Fiber High-Speed Internet', category: 'Internet', amount: 1899, date: '2026-10-20', method: 'UPI', desc: 'Office broadband 300 Mbps' },
      { name: 'BlueDart Courier & City Logistics', category: 'Transportation', amount: 7650, date: '2026-10-23', method: 'Bank Transfer', desc: 'Domestic client shipping charges' },
      { name: 'Bubble Wrap & Tape Logistics', category: 'Packaging', amount: 3200, date: '2026-10-25', method: 'Cash', desc: 'Heavy duty bubble wrap rolls and branded tape' },
      { name: 'Office Refreshments & Stationery', category: 'Other Expenses', amount: 2150, date: '2026-10-27', method: 'Cash', desc: 'Printer paper, tea, coffee supplies' },
      { name: 'November Meta Ads Campaign', category: 'Advertising', amount: 8000, date: '2026-11-01', method: 'Credit Card', desc: 'Early November retargeting campaign' },
      { name: 'Delhivery Express Dispatches', category: 'Transportation', amount: 4200, date: '2026-11-01', method: 'UPI', desc: 'Bulk shipment transport' },
    ];

    for (const exp of expensesData) {
      insertExpense.run(exp.name, exp.category, exp.amount, exp.date, exp.method, exp.desc);
    }
  });

  tx();
  console.log('Database successfully seeded with realistic business data!');
}

module.exports = { seedDatabase };
