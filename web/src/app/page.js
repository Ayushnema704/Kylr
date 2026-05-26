"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Trash2, 
  Sparkles,
  Home, 
  ShoppingBag, 
  Zap, 
  Utensils, 
  CreditCard, 
  Tv, 
  Tag, 
  TrendingUp
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData, CURRENCY_MAP } from "../context/DataContext";

// Dynamic Category Icon Resolver
const IconMap = {
  Home, 
  ShoppingBag, 
  Zap, 
  Utensils, 
  CreditCard, 
  Tv, 
  Tag, 
  TrendingUp, 
  DollarSign
};

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    transactions, 
    categories, 
    accounts, 
    analytics, 
    addTransaction, 
    deleteTransaction,
    parseNaturalLanguageExpense,
    exchangeRates,
    convertCurrency,
    formatCurrency
  } = useData();

  // Core Add Transaction form states
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [transactionType, setTransactionType] = useState("Expense");
  const [budgetType, setBudgetType] = useState("Want");
  const [date, setDate] = useState("");
  const [inputCurrency, setInputCurrency] = useState("");

  // Sync date input and form defaults safely without resetting user selections
  useEffect(() => {
    if (!date) {
      setDate(new Date().toISOString().split("T")[0]);
    }
    if (categories.length > 0 && !category) {
      setCategory(categories[0].CategoryName);
    }
    if (accounts.length > 0 && !account) {
      setAccount(accounts[0].AccountName);
    }
    if (user?.currency && !inputCurrency) {
      setInputCurrency(user.currency);
    }
  }, [categories, accounts, user?.currency, date, category, account, inputCurrency]);

  // Add standard transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    const res = await addTransaction({
      amount: parseFloat(amount),
      note: note || "Transaction",
      category,
      account,
      transactionType,
      budgetType,
      date,
      inputCurrency
    });

    if (res.success) {
      setAmount("");
      setNote("");
    }
  };

  // Sync correct budgetType mapping when category is changed manually
  const handleCategoryChange = (catName) => {
    setCategory(catName);
    const matched = categories.find(c => c.CategoryName === catName);
    if (matched) {
      setBudgetType(matched.BudgetType);
    }
  };

  // Financial safety percentage
  const getProgressColor = (percent) => {
    if (percent > 90) return "var(--neon-rose)";
    if (percent > 70) return "var(--neon-amber)";
    return "var(--neon-purple)";
  };

  const dashboardAnalytics = analytics || {
    summary: {
      salary: user?.salary || 5000,
      rules: { Needs: 50, Wants: 30, Savings: 20 },
      totalIncome: 5000,
      totalExpense: 1745,
      netSavings: 3255,
      splitExpenses: { Need: 1380, Want: 365, Savings: 0 }
    }
  };

  const summary = dashboardAnalytics.summary;

  return (
    <div>
      {/* Visual Header */}
      <header className="dashboard-header">
        <div className="header-title-sec">
          <h1>Financial Dashboard</h1>
          <span className="header-subtitle">
            Welcome back, {user?.displayName || "Aura Investor"}. Money simplified.
          </span>
        </div>
        <div className="glow-pill purple">
          <Sparkles size={12} />
          <span>Intelligent Finance Layer Active</span>
        </div>
      </header>

      {/* STAT CARDS ROW */}
      <section className="dashboard-grid">
        {/* Net Flow */}
        <div className="glass-card glow-purple">
          <div className="stat-label">
            <TrendingUp size={16} style={{ color: "var(--neon-purple)" }} />
            <span>Net Financial Flow</span>
          </div>
          <div className="stat-value">
            {formatCurrency(summary.netSavings)}
          </div>
          <div className="stat-change up">
            <ArrowUpRight size={14} />
            <span>{((summary.netSavings / (summary.salary || 1)) * 100).toFixed(0)}% of monthly base</span>
          </div>
        </div>
 
        {/* Total Spent */}
        <div className="glass-card glow-cyan">
          <div className="stat-label">
            <ArrowDownLeft size={16} style={{ color: "var(--neon-rose)" }} />
            <span>Monthly Expenses</span>
          </div>
          <div className="stat-value" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(summary.totalExpense)}
          </div>
          <div className="stat-change down">
            <span>{((summary.totalExpense / (summary.salary || 1)) * 100).toFixed(0)}% salary utilization</span>
          </div>
        </div>
 
        {/* Current Salary Base */}
        <div className="glass-card glow-emerald">
          <div className="stat-label">
            <DollarSign size={16} style={{ color: "var(--neon-emerald)" }} />
            <span>Monthly Base Income</span>
          </div>
          <div className="stat-value" style={{ color: "var(--neon-emerald)" }}>
            {formatCurrency(summary.salary)}
          </div>
          <div className="stat-change up">
            <span>Configured target in Settings</span>
          </div>
        </div>
      </section>

      {/* MAIN TWO COLUMN VIEW */}
      <section className="dashboard-grid">
        {/* LEFT COLUMN: 50-30-20 RULE & NLP QUICK ADD */}
        <div className="grid-span-2" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* 50-30-20 Budget Progress Panel */}
          <div className="glass-card glow-purple">
            <h3 style={{ marginBottom: "8px", fontFamily: "var(--font-display)" }}>50-30-20 Budget Health Tracker</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
              Ratios split automatically from your base income: 
              Need ({formatCurrency(summary.salary * summary.rules.Needs / 100)}) | 
              Want ({formatCurrency(summary.salary * summary.rules.Wants / 100)}) | 
              Savings ({formatCurrency(summary.salary * summary.rules.Savings / 100)})
            </p>
 
            <div className="budget-meter-container">
              {/* NEEDS */}
              <div className="budget-meter-row">
                <div className="budget-meter-info">
                  <span className="budget-meter-title" style={{ color: "var(--neon-emerald)" }}>
                    <Home size={14} /> Needs ({summary.rules.Needs}%)
                  </span>
                  <span>
                    {formatCurrency(summary.splitExpenses.Need)} / {formatCurrency(summary.salary * summary.rules.Needs / 100)}
                  </span>
                </div>
                <div className="budget-meter-bar-outer">
                  <div 
                    className="budget-meter-bar-inner" 
                    style={{ 
                      width: `${Math.min((summary.splitExpenses.Need / (summary.salary * summary.rules.Needs / 100)) * 100, 100)}%`,
                      background: "var(--neon-emerald)" 
                    }}
                  />
                </div>
              </div>
 
              {/* WANTS */}
              <div className="budget-meter-row">
                <div className="budget-meter-info">
                  <span className="budget-meter-title" style={{ color: "var(--neon-cyan)" }}>
                    <ShoppingBag size={14} /> Wants ({summary.rules.Wants}%)
                  </span>
                  <span>
                    {formatCurrency(summary.splitExpenses.Want)} / {formatCurrency(summary.salary * summary.rules.Wants / 100)}
                  </span>
                </div>
                <div className="budget-meter-bar-outer">
                  <div 
                    className="budget-meter-bar-inner" 
                    style={{ 
                      width: `${Math.min((summary.splitExpenses.Want / (summary.salary * summary.rules.Wants / 100)) * 100, 100)}%`,
                      background: getProgressColor((summary.splitExpenses.Want / (summary.salary * summary.rules.Wants / 100)) * 100)
                    }}
                  />
                </div>
              </div>
 
              {/* SAVINGS */}
              <div className="budget-meter-row">
                <div className="budget-meter-info">
                  <span className="budget-meter-title" style={{ color: "var(--neon-purple)" }}>
                    <TrendingUp size={14} /> Savings ({summary.rules.Savings}%)
                  </span>
                  <span>
                    {formatCurrency(summary.splitExpenses.Savings)} / {formatCurrency(summary.salary * summary.rules.Savings / 100)}
                  </span>
                </div>
                <div className="budget-meter-bar-outer">
                  <div 
                    className="budget-meter-bar-inner" 
                    style={{ 
                      width: `${Math.min((summary.splitExpenses.Savings / (summary.salary * summary.rules.Savings / 100)) * 100, 100)}%`,
                      background: "var(--neon-purple)" 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MANUAL ENTRY PANEL */}
        <div className="glass-card glow-emerald">
          <h3 style={{ marginBottom: "16px" }}>📝 Manual Entry Ledger</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Amount & Input Currency */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="glass-input" 
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Currency</label>
                <select 
                  className="glass-select"
                  value={inputCurrency}
                  onChange={(e) => setInputCurrency(e.target.value)}
                >
                  {Object.keys(CURRENCY_MAP).map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Real-time conversion preview */}
            {amount && !isNaN(parseFloat(amount)) && inputCurrency !== (user?.currency || "USD") && (
              <div style={{
                background: "rgba(139, 92, 246, 0.08)",
                border: "1px dashed var(--border-neon-purple)",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                color: "var(--neon-purple)",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between"
              }}>
                <span>Portfolio Equivalent:</span>
                <span>
                  {CURRENCY_MAP[inputCurrency]?.symbol}{parseFloat(amount).toFixed(2)} {inputCurrency} ≈ {formatCurrency(convertCurrency(parseFloat(amount), inputCurrency, user?.currency || "USD"))}
                </span>
              </div>
            )}

            {/* Note */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Description</label>
              <input 
                type="text" 
                placeholder="e.g. Swiggy delivery"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="glass-input" 
              />
            </div>

            {/* Grid 2 Elements */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Type */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Flow Type</label>
                <select 
                  className="glass-select"
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </div>

              {/* Account selection */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Funding Source</label>
                <select 
                  className="glass-select"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  {accounts.map(acc => (
                    <option key={acc.AccountID} value={acc.AccountName}>{acc.AccountName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Category */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Category</label>
                <select 
                  className="glass-select"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.CategoryID} value={cat.CategoryName}>{cat.CategoryName}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Date</label>
                <input 
                  type="date" 
                  className="glass-input" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Interactive Budget Tag selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                Budget Tag Allocation
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setBudgetType("Need")}
                  style={{
                    padding: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    background: budgetType === "Need" ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    border: budgetType === "Need" ? "1px solid var(--neon-emerald)" : "1px solid rgba(255,255,255,0.06)",
                    color: budgetType === "Need" ? "var(--neon-emerald)" : "var(--text-secondary)",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    transition: "all 0.2s ease"
                  }}
                >
                  Needs
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetType("Want")}
                  style={{
                    padding: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    background: budgetType === "Want" ? "rgba(6, 182, 212, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    border: budgetType === "Want" ? "1px solid var(--neon-cyan)" : "1px solid rgba(255,255,255,0.06)",
                    color: budgetType === "Want" ? "var(--neon-cyan)" : "var(--text-secondary)",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    transition: "all 0.2s ease"
                  }}
                >
                  Wants
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetType("Savings")}
                  style={{
                    padding: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    background: budgetType === "Savings" ? "rgba(139, 92, 246, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    border: budgetType === "Savings" ? "1px solid var(--neon-purple)" : "1px solid rgba(255,255,255,0.06)",
                    color: budgetType === "Savings" ? "var(--neon-purple)" : "var(--text-secondary)",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    transition: "all 0.2s ease"
                  }}
                >
                  Savings
                </button>
              </div>
            </div>

            <button type="submit" className="glass-button" style={{ width: "100%" }}>
              <Plus size={16} /> Add Transaction Record
            </button>
          </form>
        </div>
      </section>

      {/* RECENT TRANSACTIONS TABLE */}
      <section className="glass-card glow-purple grid-span-3" style={{ marginTop: "32px" }}>
        <h3 style={{ marginBottom: "20px" }}>🕒 Recent Transaction Activity Ledger</h3>

        <div className="txn-table-container">
          {transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              No transactions posted yet. Use the manual entry or NLP AI console above to add your first expense!
            </div>
          ) : (
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Budget Category</th>
                  <th>Account Source</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const matchingCategory = categories.find(c => c.CategoryName === txn.Category);
                  const iconName = matchingCategory ? matchingCategory.Icon : "Tag";
                  const IconComp = IconMap[iconName] || Tag;
                  const catColor = matchingCategory ? matchingCategory.Color : "var(--neon-cyan)";
                  
                  return (
                    <tr key={txn.TransactionID}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div 
                            className="txn-icon" 
                            style={{ 
                              background: `rgba(${parseInt(catColor.slice(1,3), 16) || 139}, ${parseInt(catColor.slice(3,5), 16) || 92}, ${parseInt(catColor.slice(5,7), 16) || 246}, 0.15)`,
                              color: catColor
                            }}
                          >
                            <IconComp size={16} />
                          </div>
                          <span style={{ fontWeight: 600 }}>{txn.Note || "General Spend"}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          color: catColor,
                          fontSize: "0.85rem",
                          fontWeight: 500
                        }}>
                          {txn.Category}
                        </span>
                      </td>
                      <td>
                        <span className={`glow-pill ${txn.BudgetType === "Need" ? "emerald" : txn.BudgetType === "Want" ? "cyan" : "purple"}`}>
                          {txn.BudgetType === "Need" ? "Needs" : txn.BudgetType === "Want" ? "Wants" : "Savings"}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                          💳 {txn.Account}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {txn.Date.split('T')[0]}
                        </span>
                      </td>
                      <td>
                        <span className={`txn-amount ${txn.TransactionType === "Income" ? "income" : "expense"}`}>
                          {txn.TransactionType === "Income" ? "+" : "-"}{formatCurrency(txn.Amount)}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => deleteTransaction(txn.TransactionID)}
                          style={{ 
                            background: "transparent", 
                            border: "none", 
                            color: "rgba(244, 63, 94, 0.4)", 
                            cursor: "pointer", 
                            transition: "color 0.2s ease" 
                          }}
                          onMouseEnter={(e) => e.target.style.color = "var(--neon-rose)"}
                          onMouseLeave={(e) => e.target.style.color = "rgba(244, 63, 94, 0.4)"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
