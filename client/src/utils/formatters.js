/**
 * Format numbers in Indian Rupee currency (₹)
 * Example: 1250000 -> ₹12,50,000.00
 */
export function formatINR(val, options = {}) {
  const { decimals = 2, showSymbol = true } = options;
  const num = parseFloat(val);
  if (isNaN(num)) return showSymbol ? '₹0.00' : '0.00';

  const isNegative = num < 0;
  const absVal = Math.abs(num);

  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const prefix = isNegative ? '- ' : '';
  const symbol = showSymbol ? '₹' : '';
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Compact Indian currency representation (Lakhs & Crores)
 * Example: 2500000 -> ₹25.0 Lakhs
 */
export function formatCompactINR(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0';
  const isNegative = num < 0;
  const abs = Math.abs(num);

  let str = '';
  if (abs >= 10000000) {
    str = `₹${(abs / 10000000).toFixed(2)} Cr`;
  } else if (abs >= 100000) {
    str = `₹${(abs / 100000).toFixed(2)} L`;
  } else if (abs >= 1000) {
    str = `₹${(abs / 1000).toFixed(1)} K`;
  } else {
    str = `₹${abs.toFixed(0)}`;
  }

  return isNegative ? `-${str}` : str;
}

/**
 * Format Date to readable Indian/Global standard (e.g., 01 Nov 2026)
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format percentage
 */
export function formatPercent(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return '0.0%';
  return `${num.toFixed(1)}%`;
}
