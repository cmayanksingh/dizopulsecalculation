const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
const backupDir = path.join(dataDir, 'backups');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'accounting.db');
const db = new Database(dbPath);

// Enable WAL mode & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'General',
      sku TEXT,
      current_stock REAL DEFAULT 0,
      avg_cost_per_unit REAL DEFAULT 0,
      default_selling_price REAL DEFAULT 0,
      min_stock_alert REAL DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      cost_per_unit REAL NOT NULL,
      total_cost REAL NOT NULL,
      supplier_name TEXT,
      purchase_date TEXT NOT NULL,
      payment_status TEXT DEFAULT 'Paid',
      amount_paid REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Bank Transfer',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      customer_name TEXT,
      quantity REAL NOT NULL,
      selling_price_per_unit REAL NOT NULL,
      total_amount REAL NOT NULL,
      unit_cost_at_sale REAL NOT NULL,
      cogs REAL NOT NULL,
      gross_profit REAL NOT NULL,
      sale_date TEXT NOT NULL,
      payment_status TEXT DEFAULT 'Paid',
      amount_received REAL DEFAULT 0,
      pending_amount REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'UPI',
      notes TEXT,
      status TEXT DEFAULT 'Completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'Bank Transfer',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS capital_investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      amount REAL NOT NULL,
      investment_date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      sell_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      quantity REAL NOT NULL,
      total_sales REAL NOT NULL,
      total_cost REAL NOT NULL,
      total_profit REAL NOT NULL,
      bank TEXT NOT NULL DEFAULT 'Vivek Bank',
      entry_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS extra_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_name TEXT NOT NULL,
      amount REAL NOT NULL,
      bank TEXT NOT NULL DEFAULT 'Vivek Bank',
      expense_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS business_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Default business settings
  const insertSetting = db.prepare('INSERT OR IGNORE INTO business_settings (key, value) VALUES (?, ?)');
  insertSetting.run('business_name', 'Apex Enterprise Solutions');
  insertSetting.run('owner_name', 'Chirag Sharma');
  insertSetting.run('currency_symbol', '₹');
  insertSetting.run('currency_code', 'INR');
  insertSetting.run('fiscal_year_start', '04-01');
}

initSchema();

module.exports = {
  db,
  dbPath,
  dataDir,
  backupDir,
  initSchema
};
