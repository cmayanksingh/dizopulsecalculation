import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  PlusCircle, 
  Trash2, 
  Sun, 
  Moon, 
  Download, 
  RotateCcw, 
  Building2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  ShoppingBag, 
  Layers,
  Calendar,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Firebase Firestore SDK
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  writeBatch,
  getDocs,
  setDoc
} from 'firebase/firestore';

// Indian Rupee Formatter
function formatINR(val, options = {}) {
  const { decimals = 2 } = options;
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0.00';
  const isNegative = num < 0;
  const absVal = Math.abs(num);
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${isNegative ? '- ' : ''}₹${formatted}`;
}

// Format Month-Year string ('2026-11' -> 'November 2026')
function formatMonthYear(mStr) {
  if (!mStr || mStr === 'all') return 'All Months (Lifetime)';
  const [y, m] = mStr.split('-');
  if (!y || !m) return mStr;
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('apex_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });

  // Selected Month filter: 'all' or 'YYYY-MM' (defaults to current month)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Live Firebase Data states
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [firebaseError, setFirebaseError] = useState('');

  // Form: Product Entry
  const [prodName, setProdName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [prodBank, setProdBank] = useState('Vivek Bank');
  const [prodDate, setProdDate] = useState(new Date().toISOString().split('T')[0]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState('');

  // Form: Extra Expenses
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expBank, setExpBank] = useState('Vivek Bank');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expLoading, setExpLoading] = useState(false);
  const [expError, setExpError] = useState('');

  // Notifications
  const [message, setMessage] = useState('');

  // Security Password Protection for Delete & Reset actions
  const [securityAction, setSecurityAction] = useState(null); // { type: 'RESET' | 'DELETE_PRODUCT' | 'DELETE_EXPENSE', id?: string, title: string, subtitle: string }
  const [securityPasswordInput, setSecurityPasswordInput] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [showSecurityPassword, setShowSecurityPassword] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  const requestSecurityConfirm = (type, id = null, title = '', subtitle = '') => {
    setSecurityAction({ type, id, title, subtitle });
    setSecurityPasswordInput('');
    setSecurityError('');
    setShowSecurityPassword(false);
  };

  // Authentication & Security (Password Protection)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('apex_auth_unlocked') === 'true' || 
           localStorage.getItem('apex_auth_unlocked') === 'true';
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Master Password (default '1234', synced with Firebase Cloud doc 'system/auth')
  const [masterPassword, setMasterPassword] = useState(() => {
    return localStorage.getItem('apex_master_password') || '1234';
  });

  // Change Password Modal State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('apex_dark_mode', darkMode);
  }, [darkMode]);

  // Sync Master Password from Cloud Firestore
  useEffect(() => {
    try {
      const authDocRef = doc(db, 'system', 'auth');
      const unsubscribeAuth = onSnapshot(authDocRef, (snap) => {
        if (snap.exists() && snap.data()?.password) {
          const cloudPass = String(snap.data().password);
          setMasterPassword(cloudPass);
          localStorage.setItem('apex_master_password', cloudPass);
        }
      }, (err) => {
        // Silently continue if rules/network not ready
      });
      return () => unsubscribeAuth();
    } catch (e) {
      console.warn('Auth snapshot listener error:', e);
    }
  }, []);

  // =========================================================================
  // REAL-TIME FIREBASE FIRESTORE LISTENERS
  // =========================================================================
  useEffect(() => {
    let unsubscribeProducts = () => {};
    let unsubscribeExpenses = () => {};

    try {
      // 1. Listen to 'products' collection in Firestore
      const prodsCol = collection(db, 'products');
      unsubscribeProducts = onSnapshot(prodsCol, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort descending by date and creation
        list.sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || '') || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setProducts(list);
        setFirebaseConnected(true);
        setFirebaseError('');
      }, (err) => {
        console.error('Firestore Products Error:', err);
        setFirebaseError(err.message);
      });

      // 2. Listen to 'expenses' collection in Firestore
      const expsCol = collection(db, 'expenses');
      unsubscribeExpenses = onSnapshot(expsCol, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        list.sort((a, b) => (b.expense_date || '').localeCompare(a.expense_date || '') || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setExpenses(list);
        setFirebaseConnected(true);
      }, (err) => {
        console.error('Firestore Expenses Error:', err);
        setFirebaseError(err.message);
      });
    } catch (err) {
      console.error('Firebase Setup Error:', err);
      setFirebaseError(err.message);
    }

    return () => {
      unsubscribeProducts();
      unsubscribeExpenses();
    };
  }, []);

  // =========================================================================
  // AUTOMATIC REAL-TIME FINANCIAL CALCULATIONS
  // =========================================================================
  const calculations = useMemo(() => {
    // 1. Lifetime Totals
    const totalSales = products.reduce((acc, p) => acc + (parseFloat(p.total_sales) || 0), 0);
    const totalCost = products.reduce((acc, p) => acc + (parseFloat(p.total_cost) || 0), 0);
    const totalProfit = products.reduce((acc, p) => acc + (parseFloat(p.total_profit) || 0), 0);
    const extraExpenses = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
    const finalProfit = totalProfit - extraExpenses;

    // 2. Lifetime Bank Totals (Only Profit is added to Bank, not total sales)
    const vivekIn = products.filter(p => p.bank === 'Vivek Bank').reduce((acc, p) => acc + (parseFloat(p.total_profit) || 0), 0);
    const vivekOut = expenses.filter(e => e.bank === 'Vivek Bank').reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
    const vivekBalance = vivekIn - vivekOut;

    const mayankIn = products.filter(p => p.bank === 'Mayank Bank').reduce((acc, p) => acc + (parseFloat(p.total_profit) || 0), 0);
    const mayankOut = expenses.filter(e => e.bank === 'Mayank Bank').reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
    const mayankBalance = mayankIn - mayankOut;

    const totalCash = vivekBalance + mayankBalance;

    // 3. Extract all unique active months
    const monthsSet = new Set();
    monthsSet.add(currentMonthStr);
    products.forEach(p => { if (p.entry_date) monthsSet.add(p.entry_date.slice(0, 7)); });
    expenses.forEach(e => { if (e.expense_date) monthsSet.add(e.expense_date.slice(0, 7)); });
    const availableMonths = Array.from(monthsSet).sort().reverse();

    // 4. Monthly Breakdown List for all active months
    const allMonthsBreakdown = availableMonths.map(mStr => {
      const mProds = products.filter(p => p.entry_date && p.entry_date.startsWith(mStr));
      const mExps = expenses.filter(e => e.expense_date && e.expense_date.startsWith(mStr));

      const mSales = mProds.reduce((acc, p) => acc + (parseFloat(p.total_sales) || 0), 0);
      const mCost = mProds.reduce((acc, p) => acc + (parseFloat(p.total_cost) || 0), 0);
      const mProfit = mProds.reduce((acc, p) => acc + (parseFloat(p.total_profit) || 0), 0);
      const mExtraExps = mExps.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
      const mFinalProfit = mProfit - mExtraExps;

      // Only Profit added to Bank in monthly records
      const vRec = mProds.filter(p => p.bank === 'Vivek Bank').reduce((acc, p) => acc + (parseFloat(p.total_profit) || 0), 0);
      const vSp = mExps.filter(e => e.bank === 'Vivek Bank').reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

      const mRec = mProds.filter(p => p.bank === 'Mayank Bank').reduce((acc, p) => acc + (parseFloat(p.total_profit) || 0), 0);
      const mSp = mExps.filter(e => e.bank === 'Mayank Bank').reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

      return {
        month: mStr,
        totalSales: mSales,
        totalCost: mCost,
        totalProfit: mProfit,
        extraExpenses: mExtraExps,
        finalProfit: mFinalProfit,
        vivek: {
          moneyReceived: vRec,
          moneySpent: vSp,
          monthlyNet: vRec - vSp,
          currentBalance: vivekBalance
        },
        mayank: {
          moneyReceived: mRec,
          moneySpent: mSp,
          monthlyNet: mRec - mSp,
          currentBalance: mayankBalance
        }
      };
    });

    // 5. Active View Metrics (either selected month or lifetime)
    let activeMetrics = null;
    if (selectedMonth && selectedMonth !== 'all') {
      const match = allMonthsBreakdown.find(b => b.month === selectedMonth);
      if (match) {
        activeMetrics = match;
      } else {
        activeMetrics = {
          month: selectedMonth,
          totalSales: 0,
          totalCost: 0,
          totalProfit: 0,
          extraExpenses: 0,
          finalProfit: 0,
          vivek: { moneyReceived: 0, moneySpent: 0, monthlyNet: 0, currentBalance: vivekBalance },
          mayank: { moneyReceived: 0, moneySpent: 0, monthlyNet: 0, currentBalance: mayankBalance }
        };
      }
    } else {
      activeMetrics = {
        month: 'all',
        totalSales,
        totalCost,
        totalProfit,
        extraExpenses,
        finalProfit,
        vivek: {
          moneyReceived: vivekIn,
          moneySpent: vivekOut,
          monthlyNet: vivekBalance,
          currentBalance: vivekBalance
        },
        mayank: {
          moneyReceived: mayankIn,
          moneySpent: mayankOut,
          monthlyNet: mayankBalance,
          currentBalance: mayankBalance
        }
      };
    }

    // Filtered lists for current view
    const filteredProducts = selectedMonth && selectedMonth !== 'all'
      ? products.filter(p => p.entry_date && p.entry_date.startsWith(selectedMonth))
      : products;

    const filteredExpenses = selectedMonth && selectedMonth !== 'all'
      ? expenses.filter(e => e.expense_date && e.expense_date.startsWith(selectedMonth))
      : expenses;

    return {
      totalSales,
      totalCost,
      totalProfit,
      extraExpenses,
      finalProfit,
      vivekBalance,
      mayankBalance,
      totalCash,
      availableMonths,
      allMonthsBreakdown,
      activeMetrics,
      filteredProducts,
      filteredExpenses
    };
  }, [products, expenses, selectedMonth, currentMonthStr]);

  // Live Calculations for Product Entry form
  const parsedSellPrice = parseFloat(sellPrice) || 0;
  const parsedCostPrice = parseFloat(costPrice) || 0;
  const parsedQuantity = parseFloat(quantity) || 0;

  // Exact Formula: (Sell Price - Cost Price) * Quantity
  const liveTotalProfit = Number(((parsedSellPrice - parsedCostPrice) * parsedQuantity).toFixed(2));

  // =========================================================================
  // ACTIONS: ADD PRODUCT, ADD EXPENSE, DELETE, CLEAR
  // =========================================================================

  // Add Product to Firestore
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setProdError('');

    if (!prodName.trim()) {
      setProdError('Please enter a product name');
      return;
    }
    if (parsedQuantity <= 0) {
      setProdError('Quantity must be at least 1');
      return;
    }

    try {
      setProdLoading(true);

      const totalSales = Number((parsedSellPrice * parsedQuantity).toFixed(2));
      const totalCost = Number((parsedCostPrice * parsedQuantity).toFixed(2));
      const totalProfit = Number(((parsedSellPrice - parsedCostPrice) * parsedQuantity).toFixed(2));

      await addDoc(collection(db, 'products'), {
        product_name: prodName.trim(),
        sell_price: parsedSellPrice,
        cost_price: parsedCostPrice,
        quantity: parsedQuantity,
        total_sales: totalSales,
        total_cost: totalCost,
        total_profit: totalProfit,
        bank: prodBank,
        entry_date: prodDate || new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });

      // Reset form
      setProdName('');
      setSellPrice('');
      setCostPrice('');
      setQuantity('1');

      // Celebration
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#22c55e', '#16a34a', '#3b82f6']
      });

      setMessage('Product saved to Firebase Cloud!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setProdError(err.message);
    } finally {
      setProdLoading(false);
    }
  };

  // Delete Product from Firestore
  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  // Add Expense to Firestore
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpError('');

    if (!expName.trim()) {
      setExpError('Please enter an expense name');
      return;
    }
    const amt = parseFloat(expAmount) || 0;
    if (amt <= 0) {
      setExpError('Expense amount must be greater than 0');
      return;
    }

    try {
      setExpLoading(true);

      await addDoc(collection(db, 'expenses'), {
        expense_name: expName.trim(),
        amount: amt,
        bank: expBank,
        expense_date: expDate || new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });

      setExpName('');
      setExpAmount('');

      setMessage('Expense saved to Firebase Cloud!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setExpError(err.message);
    } finally {
      setExpLoading(false);
    }
  };

  // Confirm Security Action with Login Password (Required for Reset or Delete)
  const handleConfirmSecurityAction = async (e) => {
    if (e) e.preventDefault();
    setSecurityError('');

    if (!securityPasswordInput) {
      setSecurityError('Please enter your login password to confirm');
      return;
    }

    if (securityPasswordInput !== masterPassword) {
      setSecurityError('Incorrect password! Action not authorized.');
      return;
    }

    try {
      setSecurityLoading(true);

      if (securityAction.type === 'RESET') {
        const batch = writeBatch(db);
        const prodsSnapshot = await getDocs(collection(db, 'products'));
        prodsSnapshot.docs.forEach(d => batch.delete(d.ref));
        const expsSnapshot = await getDocs(collection(db, 'expenses'));
        expsSnapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();

        setMessage('All records cleared! Everything reset to ₹0.');
        setTimeout(() => setMessage(''), 3000);
      } else if (securityAction.type === 'DELETE_PRODUCT') {
        await deleteDoc(doc(db, 'products', securityAction.id));
        setMessage('Product entry deleted successfully.');
        setTimeout(() => setMessage(''), 3000);
      } else if (securityAction.type === 'DELETE_EXPENSE') {
        await deleteDoc(doc(db, 'expenses', securityAction.id));
        setMessage('Expense entry deleted successfully.');
        setTimeout(() => setMessage(''), 3000);
      }

      setSecurityAction(null);
      setSecurityPasswordInput('');
      setSecurityError('');
    } catch (err) {
      console.error('Security action error:', err);
      setSecurityError(err.message || 'Action failed');
    } finally {
      setSecurityLoading(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryRows = [
      ['BUSINESS FINANCIAL & MONTHLY SUMMARY (FIREBASE CLOUD)'],
      ['Generated On', new Date().toLocaleString()],
      ['Active View', formatMonthYear(selectedMonth)],
      [],
      ['Financial Metric', 'Amount (INR)'],
      ['Total Sales', calculations.activeMetrics.totalSales || 0],
      ['Total Cost', calculations.activeMetrics.totalCost || 0],
      ['Total Profit', calculations.activeMetrics.totalProfit || 0],
      ['Extra Expenses', calculations.activeMetrics.extraExpenses || 0],
      ['Final Net Profit', calculations.activeMetrics.finalProfit || 0],
      [],
      ['Bank Account Balances'],
      ['Vivek Bank Money Received', calculations.activeMetrics.vivek?.moneyReceived || 0],
      ['Vivek Bank Money Spent', calculations.activeMetrics.vivek?.moneySpent || 0],
      ['Vivek Bank Current Balance', calculations.vivekBalance],
      ['Mayank Bank Money Received', calculations.activeMetrics.mayank?.moneyReceived || 0],
      ['Mayank Bank Money Spent', calculations.activeMetrics.mayank?.moneySpent || 0],
      ['Mayank Bank Current Balance', calculations.mayankBalance],
      ['Total Cash in Banks', calculations.totalCash]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Monthly History Sheet
    const monthlyHistoryRows = calculations.allMonthsBreakdown.map(m => ({
      'Month': formatMonthYear(m.month),
      'Total Sales (INR)': m.totalSales,
      'Total Cost (INR)': m.totalCost,
      'Total Profit (INR)': m.totalProfit,
      'Extra Expenses (INR)': m.extraExpenses,
      'Final Net Profit (INR)': m.finalProfit,
      'Vivek Received': m.vivek.moneyReceived,
      'Vivek Spent': m.vivek.moneySpent,
      'Vivek Net': m.vivek.monthlyNet,
      'Mayank Received': m.mayank.moneyReceived,
      'Mayank Spent': m.mayank.moneySpent,
      'Mayank Net': m.mayank.monthlyNet
    }));
    const wsMonthly = XLSX.utils.json_to_sheet(monthlyHistoryRows);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly History');

    // Products Sheet
    const prodRows = products.map(p => ({
      'Product Name': p.product_name,
      'Bank': p.bank,
      'Quantity': p.quantity,
      'Cost Price (INR)': p.cost_price,
      'Sell Price (INR)': p.sell_price,
      'Total Sales (INR)': p.total_sales,
      'Total Cost (INR)': p.total_cost,
      'Total Profit (INR)': p.total_profit,
      'Date': p.entry_date
    }));
    const wsProd = XLSX.utils.json_to_sheet(prodRows);
    XLSX.utils.book_append_sheet(wb, wsProd, 'Products');

    // Expenses Sheet
    const expRows = expenses.map(e => ({
      'Expense Name': e.expense_name,
      'Amount (INR)': e.amount,
      'Paid From Bank': e.bank,
      'Date': e.expense_date
    }));
    const wsExp = XLSX.utils.json_to_sheet(expRows);
    XLSX.utils.book_append_sheet(wb, wsExp, 'Extra Expenses');

    XLSX.writeFile(wb, `Business_Firebase_Account_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // =========================================================================
  // AUTHENTICATION HANDLERS
  // =========================================================================
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    if (!loginPasswordInput) {
      setLoginError('Please enter your password');
      return;
    }

    if (loginPasswordInput === masterPassword) {
      setIsAuthenticated(true);
      if (rememberMe) {
        localStorage.setItem('apex_auth_unlocked', 'true');
      } else {
        sessionStorage.setItem('apex_auth_unlocked', 'true');
      }
      setLoginPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Incorrect password! Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('apex_auth_unlocked');
    localStorage.removeItem('apex_auth_unlocked');
    setLoginPasswordInput('');
    setLoginError('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePassError('');
    setChangePassSuccess('');

    if (currentPassInput !== masterPassword) {
      setChangePassError('Current password is incorrect');
      return;
    }
    if (!newPassInput || newPassInput.length < 4) {
      setChangePassError('New password must be at least 4 characters');
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setChangePassError('New passwords do not match');
      return;
    }

    try {
      // 1. Sync to Firebase Cloud doc 'system/auth'
      await setDoc(doc(db, 'system', 'auth'), {
        password: newPassInput,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setMasterPassword(newPassInput);
      localStorage.setItem('apex_master_password', newPassInput);
      setChangePassSuccess('Password updated successfully on cloud & all devices!');

      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');
        setChangePassSuccess('');
      }, 1500);
    } catch (err) {
      console.warn('Cloud password update warning:', err);
      // Fallback update locally
      setMasterPassword(newPassInput);
      localStorage.setItem('apex_master_password', newPassInput);
      setChangePassSuccess('Password updated locally!');

      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');
        setChangePassSuccess('');
      }, 1500);
    }
  };

  // =========================================================================
  // LOCK SCREEN VIEW (IF NOT AUTHENTICATED)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white'
      }`}>
        {/* Ambient background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl"></div>
        </div>

        {/* Top-right Light/Dark Toggle */}
        <div className="absolute top-5 right-5 z-10">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors backdrop-blur-md border border-white/10"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-200" />}
          </button>
        </div>

        {/* Lock Card */}
        <div className={`relative w-full max-w-md rounded-3xl p-8 sm:p-10 border shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          isShaking ? 'animate-bounce' : ''
        } ${
          darkMode 
            ? 'bg-slate-900/95 border-slate-800 shadow-emerald-950/40 text-slate-100' 
            : 'bg-slate-900/90 border-slate-700/80 shadow-black/50 text-white'
        }`}>
          {/* Lock Icon Badge */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-emerald-400">
                <Lock className="w-9 h-9" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Personal Business Accounting</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Enter Password
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              This business dashboard is private. Please enter your password to unlock the account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Master Password</span>
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  autoFocus
                  value={loginPasswordInput}
                  onChange={(e) => {
                    setLoginPasswordInput(e.target.value);
                    setLoginError('');
                  }}
                  placeholder="Enter password..."
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                  tabIndex={-1}
                >
                  {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-slate-500">
                Default PIN: <strong className="text-emerald-400 font-mono font-bold">1234</strong>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Dashboard</span>
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protected with Firebase Cloud (dizo-calculation)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans p-3 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Bar */}
        <header className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-emerald-600/20">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Business Accounting Dashboard
                </h1>
                {/* Firebase Live Cloud Status Pill */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  firebaseConnected 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                }`}>
                  <Cloud className="w-3 h-3" />
                  {firebaseConnected ? 'Firebase Cloud Live' : 'Connecting Cloud...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected to project: <strong className="font-mono text-slate-700 dark:text-slate-300">dizo-calculation</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
            {/* Download Excel */}
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel</span>
            </button>

            {/* Change Password */}
            <button
              onClick={() => {
                setIsChangePasswordOpen(true);
                setChangePassError('');
                setChangePassSuccess('');
                setCurrentPassInput('');
                setNewPassInput('');
                setConfirmPassInput('');
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Change Master Password"
            >
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Password</span>
            </button>

            {/* Lock / Logout */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lock Dashboard"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Lock</span>
            </button>

            {/* Reset to ₹0 (Requires Password) */}
            <button
              onClick={() => requestSecurityConfirm(
                'RESET',
                null,
                'Reset Cloud Database to ₹0',
                'Are you sure you want to permanently delete all entered products and expenses? Enter your master login password to authorize this action.'
              )}
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              Reset to ₹0
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Light / Dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Firebase Error Banner if Firestore Database isn't enabled yet */}
        {firebaseError && (
          <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Firebase Action Needed: Enable Firestore Database</span>
            </div>
            <p className="leading-relaxed">
              Agar aapne Firebase Console me abhi tak **Firestore Database** enable nahi kiya hai, toh Firebase Console me jakar:
              <br />
              👉 <strong>Databases and storage → Firestore Database → Create database → Start in test mode → Enable</strong> par click kar lijiye.
            </p>
          </div>
        )}

        {/* Success Message Banner */}
        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MONTH & YEAR SELECTOR TOOLBAR */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Select Month & Year
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatMonthYear(selectedMonth)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedMonth !== 'all' ? 'Monthly Filter Active' : 'Lifetime Total'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">🌟 All Months (Lifetime Total)</option>
              {calculations.availableMonths.map((mStr) => (
                <option key={mStr} value={mStr}>
                  📅 {formatMonthYear(mStr)}
                </option>
              ))}
            </select>

            {/* Quick Button for Current Month */}
            {selectedMonth !== currentMonthStr && (
              <button
                onClick={() => setSelectedMonth(currentMonthStr)}
                className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors whitespace-nowrap"
              >
                Current Month
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. MONTHLY INCOME & EXPENSE SUMMARY */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Monthly Income & Expense Summary
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Financial performance for {formatMonthYear(selectedMonth)} (Stored on Google Cloud)
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-mono">
              {formatMonthYear(selectedMonth)}
            </span>
          </div>

          {/* 5 Required Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Sales */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Sales
              </span>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {formatINR(calculations.activeMetrics.totalSales || 0)}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                Gross sales revenue
              </span>
            </div>

            {/* Total Cost */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Cost
              </span>
              <div className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 font-mono mt-1">
                {formatINR(calculations.activeMetrics.totalCost || 0)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Product acquisition cost
              </span>
            </div>

            {/* Total Profit */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Total Profit
              </span>
              <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatINR(calculations.activeMetrics.totalProfit || 0)}
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                Sales − Cost
              </span>
            </div>

            {/* Extra Expenses */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                Extra Expenses
              </span>
              <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {formatINR(calculations.activeMetrics.extraExpenses || 0)}
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
                Operational overheads
              </span>
            </div>

            {/* Final Net Profit */}
            <div className={`p-4 rounded-2xl border col-span-2 lg:col-span-1 shadow-sm ${
              (calculations.activeMetrics.finalProfit || 0) >= 0
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600'
                : 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-600'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100 block">
                Final Net Profit
              </span>
              <div className="text-lg sm:text-xl font-black font-mono mt-1">
                {formatINR(calculations.activeMetrics.finalProfit || 0)}
              </div>
              <span className="text-[10px] text-emerald-100 font-semibold block mt-0.5">
                Total Profit − Expenses
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MONTHLY BANK BALANCE (Vivek Bank & Mayank Bank) */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Monthly Bank Balance & Transactions
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Money received, money spent, and current balances for {formatMonthYear(selectedMonth)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vivek Bank Monthly Record */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Vivek Bank
                    </h3>
                    <span className="text-[11px] text-slate-400">Cloud Synced Account</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Balance</span>
                  <span className="text-sm sm:text-base font-black font-mono text-indigo-600 dark:text-indigo-400">
                    {formatINR(calculations.vivekBalance)}
                  </span>
                </div>
              </div>

              {/* Monthly Flow Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Profit Received</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 mt-1 block">
                    +{formatINR(calculations.activeMetrics.vivek?.moneyReceived || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Product profit added</span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Money Spent</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-rose-600 mt-1 block">
                    -{formatINR(calculations.activeMetrics.vivek?.moneySpent || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Expenses paid</span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Net</span>
                  <span className={`text-xs sm:text-sm font-black font-mono mt-1 block ${(calculations.activeMetrics.vivek?.monthlyNet || 0) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                    {formatINR(calculations.activeMetrics.vivek?.monthlyNet || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Received − Spent</span>
                </div>
              </div>
            </div>

            {/* Mayank Bank Monthly Record */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Mayank Bank
                    </h3>
                    <span className="text-[11px] text-slate-400">Cloud Synced Account</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Balance</span>
                  <span className="text-sm sm:text-base font-black font-mono text-blue-600 dark:text-blue-400">
                    {formatINR(calculations.mayankBalance)}
                  </span>
                </div>
              </div>

              {/* Monthly Flow Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Profit Received</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 mt-1 block">
                    +{formatINR(calculations.activeMetrics.mayank?.moneyReceived || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Product profit added</span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Money Spent</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-rose-600 mt-1 block">
                    -{formatINR(calculations.activeMetrics.mayank?.moneySpent || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Expenses paid</span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Net</span>
                  <span className={`text-xs sm:text-sm font-black font-mono mt-1 block ${(calculations.activeMetrics.mayank?.monthlyNet || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
                    {formatINR(calculations.activeMetrics.mayank?.monthlyNet || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Received − Spent</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ALL-MONTHS HISTORICAL AUDIT TABLE */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Monthly Financial History Table
              </h3>
              <p className="text-xs text-slate-400">
                Click any month to inspect its complete records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Month</th>
                  <th className="py-3 px-3 text-right">Total Sales</th>
                  <th className="py-3 px-3 text-right">Total Cost</th>
                  <th className="py-3 px-3 text-right">Total Profit</th>
                  <th className="py-3 px-3 text-right">Extra Expenses</th>
                  <th className="py-3 px-3 text-right">Final Net Profit</th>
                  <th className="py-3 px-3 text-center">Vivek (In/Out)</th>
                  <th className="py-3 px-3 text-center">Mayank (In/Out)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {calculations.allMonthsBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No monthly records entered yet. All metrics start at ₹0.00.
                    </td>
                  </tr>
                ) : (
                  calculations.allMonthsBreakdown.map((m) => {
                    const isSelected = selectedMonth === m.month;
                    return (
                      <tr 
                        key={m.month}
                        onClick={() => setSelectedMonth(m.month)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 font-bold' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {formatMonthYear(m.month)}
                          </span>
                          {isSelected && (
                            <span className="ml-1.5 text-[10px] font-bold text-emerald-600">● Selected</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-800 dark:text-slate-200">{formatINR(m.totalSales)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">{formatINR(m.totalCost)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">{formatINR(m.totalProfit)}</td>
                        <td className="py-3 px-3 text-right font-mono text-amber-600">{formatINR(m.extraExpenses)}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                          <span className={m.finalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                            {formatINR(m.finalProfit)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                          <span className="text-emerald-600">+{formatINR(m.vivek.moneyReceived, { decimals: 0 })}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-rose-600">-{formatINR(m.vivek.moneySpent, { decimals: 0 })}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                          <span className="text-emerald-600">+{formatINR(m.mayank.moneyReceived, { decimals: 0 })}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-rose-600">-{formatINR(m.mayank.moneySpent, { decimals: 0 })}</span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMonth(m.month);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN ENTRY SECTION: 1. Product Entry & 2. Extra Expenses */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ---------------- 1. PRODUCT ENTRY (Left, 7 Cols) ---------------- */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Product Entry
                  </h2>
                  <p className="text-xs text-slate-400">
                    Formula: (Sell Price − Cost Price) × Quantity
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {calculations.filteredProducts.length} Products in View
              </span>
            </div>

            {/* Product Entry Form */}
            <form onSubmit={handleAddProduct} className="space-y-4">
              {prodError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold">
                  {prodError}
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cotton T-Shirt, Water Bottle, Earbuds..."
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Sell Price, Cost Price & Quantity */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Sell Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="0.00"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Cost Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="0.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Payment Bank & Date Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Payment Bank *
                  </label>
                  <select
                    value={prodBank}
                    onChange={(e) => setProdBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Vivek Bank">Vivek Bank</option>
                    <option value="Mayank Bank">Mayank Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Entry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={prodDate}
                    onChange={(e) => setProdDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Automatic Total Profit Calculation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Formula: (Sell Price − Cost Price) × Quantity
                  </span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ({formatINR(parsedSellPrice)} − {formatINR(parsedCostPrice)}) × {parsedQuantity}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Profit</span>
                  <div className={`text-xl font-black font-mono ${liveTotalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatINR(liveTotalProfit)}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={prodLoading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{prodLoading ? 'Saving to Firebase...' : 'Add Product Entry (Cloud Save)'}</span>
              </button>
            </form>

            {/* Product Entries Table */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Products in {formatMonthYear(selectedMonth)}
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Bank</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Cost</th>
                      <th className="py-2.5 px-3 text-right">Sell</th>
                      <th className="py-2.5 px-3 text-right">Profit</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {calculations.filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No products recorded for {formatMonthYear(selectedMonth)}.
                        </td>
                      </tr>
                    ) : (
                      calculations.filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 text-[11px]">{p.entry_date}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{p.product_name}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              p.bank === 'Vivek Bank' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              {p.bank}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{p.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatINR(p.cost_price)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">{formatINR(p.sell_price)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatINR(p.total_profit)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => requestSecurityConfirm(
                                'DELETE_PRODUCT',
                                p.id,
                                `Delete Product: ${p.product_name}`,
                                `Are you sure you want to delete this product sale entry (${p.product_name} • Profit ${formatINR(p.total_profit)})? Enter your login password to authorize deletion.`
                              )}
                              title="Delete Product"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ---------------- 2. EXTRA EXPENSES (Right, 5 Cols) ---------------- */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Extra Expenses
                    </h2>
                    <p className="text-xs text-slate-400">
                      Record operational business expenses
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600 font-mono">
                  {formatINR(calculations.activeMetrics.extraExpenses || 0)}
                </span>
              </div>

              {/* Extra Expense Form */}
              <form onSubmit={handleAddExpense} className="space-y-3">
                {expError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold">
                    {expError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Expense Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Packing Box, Delivery, Tea..."
                    value={expName}
                    onChange={(e) => setExpName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Paid From Bank *
                  </label>
                  <select
                    value={expBank}
                    onChange={(e) => setExpBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Vivek Bank">Vivek Bank</option>
                    <option value="Mayank Bank">Mayank Bank</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={expLoading}
                  className="w-full py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-md shadow-amber-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{expLoading ? 'Saving...' : 'Add Extra Expense (Cloud Save)'}</span>
                </button>
              </form>

              {/* Extra Expenses List */}
              <div className="pt-2">
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Expense Name</th>
                        <th className="py-2 px-3">Paid From</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {calculations.filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                            No extra expenses in {formatMonthYear(selectedMonth)}.
                          </td>
                        </tr>
                      ) : (
                        calculations.filteredExpenses.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 whitespace-nowrap text-slate-400 text-[11px]">{e.expense_date}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{e.expense_name}</td>
                            <td className="py-2 px-3 whitespace-nowrap text-[11px] text-slate-500">{e.bank}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">{formatINR(e.amount)}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => requestSecurityConfirm(
                                  'DELETE_EXPENSE',
                                  e.id,
                                  `Delete Expense: ${e.expense_name}`,
                                  `Are you sure you want to delete this expense entry (${e.expense_name} • ${formatINR(e.amount)})? Enter your login password to authorize deletion.`
                                )}
                                title="Delete Expense"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Security Password Confirmation Modal (Delete / Reset Protection) */}
      {securityAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {securityAction.title}
                  </h3>
                  <p className="text-xs text-rose-500 font-semibold">
                    Master Password Required
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSecurityAction(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {securityAction.subtitle}
            </p>

            <form onSubmit={handleConfirmSecurityAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Enter Login Password to Confirm
                </label>
                <div className="relative">
                  <input
                    type={showSecurityPassword ? 'text' : 'password'}
                    autoFocus
                    value={securityPasswordInput}
                    onChange={(e) => {
                      setSecurityPasswordInput(e.target.value);
                      setSecurityError('');
                    }}
                    placeholder="Enter your login password..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityPassword(!showSecurityPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showSecurityPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {securityError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{securityError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSecurityAction(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
                >
                  {securityLoading ? 'Verifying...' : 'Authorize & Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Change Master Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Syncs securely across all devices</p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  New Password (Min 4 chars)
                </label>
                <input
                  type="password"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  placeholder="Confirm new password..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              {changePassError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{changePassError}</span>
                </div>
              )}

              {changePassSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{changePassSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
