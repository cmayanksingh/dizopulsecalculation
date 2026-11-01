# Simple Business Accounting Dashboard

A clean, fast, and simple accounting dashboard focused on everyday product profit and bank balance management.

---

## 🌟 Features & Exact Formulas

### 1. Product Entry
- **Product Name**
- **Sell Price (₹)**
- **Cost Price (₹)**
- **Quantity**
- **Payment Bank Dropdown**:
  - `Vivek Bank`
  - `Mayank Bank`
- **Total Profit (Automatic)**:
  $$\text{Total Profit} = (\text{Sell Price} - \text{Cost Price}) \times \text{Quantity}$$
- **Total Sales**: $\text{Sell Price} \times \text{Quantity}$
- **Total Cost**: $\text{Cost Price} \times \text{Quantity}$

### 2. Extra Expenses
- **Expense Name**
- **Amount (₹)**
- **Paid From Bank Dropdown** (`Vivek Bank` / `Mayank Bank`)

### 3. Payment Bank Tracking
Live balances for each bank:
- **Vivek Bank Balance**: $\text{Sales Received in Vivek Bank} - \text{Expenses Paid from Vivek Bank}$
- **Mayank Bank Balance**: $\text{Sales Received in Mayank Bank} - \text{Expenses Paid from Mayank Bank}$
- **Total Cash in Banks**: $\text{Vivek Bank Balance} + \text{Mayank Bank Balance}$

### 4. Total Summary (Below)
- **Total Sales**: Sum of all sales
- **Total Cost**: Sum of all costs
- **Total Profit**: $\text{Total Sales} - \text{Total Cost}$
- **Extra Expenses**: Total of extra expenses
- **Final Profit**: $\text{Total Profit} - \text{Extra Expenses}$

---

## 🚀 How to Run

The application runs at:
👉 **`http://localhost:5000`**

To start the server:
```bash
npm start
```
