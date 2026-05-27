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
  const [destinationAccount, setDestinationAccount] = useState("");
  const [transactionType, setTransactionType] = useState("Expense");
  const [budgetType, setBudgetType] = useState("Want");
  const [date, setDate] = useState("");
  const [inputCurrency, setInputCurrency] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Timeframe and specific date filtering states
  const [timeframe, setTimeframe] = useState("Month"); // "All", "Today", "Week", "Month", "Year", "Custom"
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("All");

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
    if (accounts.length > 1 && !destinationAccount) {
      setDestinationAccount(accounts[1].AccountName);
    }
    if (user?.currency && !inputCurrency) {
      setInputCurrency(user.currency);
    }
  }, [categories, accounts, user?.currency, date, category, account, destinationAccount, inputCurrency]);

  // Prevent transferring to the exact same account
  useEffect(() => {
    if (account && destinationAccount && account === destinationAccount && accounts.length > 1) {
      const alt = accounts.find(acc => acc.AccountName !== account);
      if (alt) {
        setDestinationAccount(alt.AccountName);
      }
    }
  }, [account, destinationAccount, accounts]);

  // Add standard transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || submitting) return;

    setSubmitting(true);
    try {
      const res = await addTransaction({
        amount: parseFloat(amount),
        note: note || "Transaction",
        category: transactionType === "Transfer" ? "Transfer" : category,
        account,
        destinationAccount: transactionType === "Transfer" ? destinationAccount : "",
        transactionType,
        budgetType: transactionType === "Transfer" ? "Savings" : budgetType,
        date,
        inputCurrency
      });

      if (res.success) {
        setAmount("");
        setNote("");
        // Reset selectors and allocations back to their correct defaults *after* successful sync
        if (categories.length > 0) {
          setCategory(categories[0].CategoryName);
          setBudgetType(categories[0].BudgetType);
        }
        if (accounts.length > 0) {
          setAccount(accounts[0].AccountName);
        }
        if (accounts.length > 1) {
          setDestinationAccount(accounts[1].AccountName);
        }
        setTransactionType("Expense");
        setDate(new Date().toISOString().split("T")[0]);
        if (user?.currency) {
          setInputCurrency(user.currency);
        }
      }
    } catch (err) {
      console.error("Failed to add transaction:", err);
    } finally {
      setSubmitting(false);
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

  // Filter transactions based on selected timeframe & account
  const filteredTransactions = transactions.filter(txn => {
    if (!txn.Date) return false;
    const txnDateStr = txn.Date.split("T")[0]; // YYYY-MM-DD
    const todayStr = new Date().toISOString().split("T")[0];
    
    let matchesTimeframe = true;
    if (timeframe === "Today") {
      matchesTimeframe = (txnDateStr === todayStr);
    } else if (timeframe === "Week") {
      const today = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      const tDate = new Date(txnDateStr);
      matchesTimeframe = (tDate >= oneWeekAgo && tDate <= today);
    } else if (timeframe === "Month") {
      const today = new Date();
      const tDate = new Date(txnDateStr);
      matchesTimeframe = (tDate.getFullYear() === today.getFullYear() && tDate.getMonth() === today.getMonth());
    } else if (timeframe === "Year") {
      const today = new Date();
      const tDate = new Date(txnDateStr);
      matchesTimeframe = (tDate.getFullYear() === today.getFullYear());
    } else if (timeframe === "Custom") {
      if (customStartDate && new Date(txnDateStr) < new Date(customStartDate)) matchesTimeframe = false;
      if (customEndDate && new Date(txnDateStr) > new Date(customEndDate)) matchesTimeframe = false;
    }

    if (!matchesTimeframe) return false;

    // Apply account filter
    if (selectedAccount !== "All") {
      return txn.Account === selectedAccount;
    }

    return true;
  });

  // Compute target timescale multiplier to adapt base targets dynamically
  const timeScale = (() => {
    if (timeframe === "Today") return 1 / 30;
    if (timeframe === "Week") return 7 / 30;
    if (timeframe === "Month") return 1;
    if (timeframe === "Year") return 12;
    if (timeframe === "All" && filteredTransactions.length > 0) {
      const dates = filteredTransactions.map(t => new Date(t.Date).getTime()).filter(t => !isNaN(t));
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const diffYears = maxDate.getFullYear() - minDate.getFullYear();
        const diffMonths = maxDate.getMonth() - minDate.getMonth();
        return Math.max(1, diffYears * 12 + diffMonths + 1);
      }
    }
    if (timeframe === "Custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      return Math.max(1 / 30, diffDays / 30);
    }
    return 1;
  })();

  // Dynamically calculate summary metrics based on filtered transactions and timeScale
  const getDynamicSummary = () => {
    const baseSalary = user?.salary || 5000;
    const rules = analytics?.summary?.rules || { Needs: 50, Wants: 30, Savings: 20 };
    
    let totalIncome = 0;
    let totalExpense = 0;
    let needSpend = 0;
    let wantSpend = 0;
    let savingsSpend = 0;
    let cashIn = 0;
    let cashOut = 0;
    
    filteredTransactions.forEach(t => {
      const amt = parseFloat(t.Amount) || 0;
      
      // Track actual cash flow in/out for the filtered account/timeframe
      if (t.TransactionType === "Income" || t.TransactionType === "Transfer In") {
        cashIn += amt;
      }
      if (t.TransactionType === "Expense" || t.TransactionType === "Transfer Out") {
        cashOut += amt;
      }

      if (t.TransactionType === "Income") {
        totalIncome += amt;
      } else if (t.TransactionType === "Expense") {
        totalExpense += amt;
        if (t.BudgetType === "Need") needSpend += amt;
        else if (t.BudgetType === "Want") wantSpend += amt;
        else if (t.BudgetType === "Savings") savingsSpend += amt;
      }
    });

    return {
      salary: baseSalary * timeScale,
      rules,
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      splitExpenses: {
        Need: needSpend,
        Want: wantSpend,
        Savings: savingsSpend
      },
      cashIn,
      cashOut,
      accountNetFlow: cashIn - cashOut
    };
  };

  const summary = getDynamicSummary();

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

      {/* Dynamic Date & Account Filtering Bar */}
      <section className="glass-card glow-purple" style={{ marginBottom: "24px", padding: "16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
          {/* Timeframe selector */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Timeframe:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", padding: "4px", borderRadius: "20px" }}>
              {[
                { label: "Today", value: "Today" },
                { label: "This Week", value: "Week" },
                { label: "This Month", value: "Month" },
                { label: "This Year", value: "Year" },
                { label: "All Time", value: "All" },
                { label: "Custom Range", value: "Custom" }
              ].map(pill => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setTimeframe(pill.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    transition: "all 0.25s ease",
                    background: timeframe === pill.value ? "var(--neon-purple)" : "transparent",
                    color: timeframe === pill.value ? "#ffffff" : "var(--text-secondary)",
                    boxShadow: timeframe === pill.value ? "0 0 10px rgba(139, 92, 246, 0.3)" : "none"
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Account Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Account:
            </span>
            <select
              className="glass-select"
              style={{ width: "180px", height: "32px", fontSize: "0.75rem", padding: "0 10px", cursor: "pointer" }}
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="All">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.AccountID} value={acc.AccountName}>
                  {acc.AccountName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom date range inputs */}
        {timeframe === "Custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Start:</span>
              <input
                type="date"
                className="glass-input"
                style={{ padding: "6px 10px", fontSize: "0.75rem", width: "130px", height: "32px" }}
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>End:</span>
              <input
                type="date"
                className="glass-input"
                style={{ padding: "6px 10px", fontSize: "0.75rem", width: "130px", height: "32px" }}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </section>

      {/* STAT CARDS ROW */}
      <section className="dashboard-grid">
        {/* Net Flow */}
        <div className="glass-card glow-purple">
          <div className="stat-label">
            <TrendingUp size={16} style={{ color: "var(--neon-purple)" }} />
            <span>
              {selectedAccount !== "All"
                ? `${selectedAccount} Net Flow`
                : timeframe === "Today" ? "Daily Flow" : timeframe === "Week" ? "Weekly Flow" : timeframe === "Month" ? "Monthly Flow" : timeframe === "Year" ? "Yearly Flow" : timeframe === "All" ? "All Time Flow" : "Period Flow"
              }
            </span>
          </div>
          <div className="stat-value">
            {formatCurrency(selectedAccount !== "All" ? summary.accountNetFlow : summary.netSavings)}
          </div>
          <div className="stat-change up">
            <ArrowUpRight size={14} />
            <span>
              {selectedAccount !== "All"
                ? "Total cash in minus cash out"
                : `${((summary.netSavings / (summary.salary || 1)) * 100).toFixed(0)}% of period base`
              }
            </span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="glass-card glow-cyan">
          <div className="stat-label">
            <ArrowDownLeft size={16} style={{ color: "var(--neon-rose)" }} />
            <span>
              {selectedAccount !== "All"
                ? `${selectedAccount} Cash Out`
                : timeframe === "Today" ? "Daily Expenses" : timeframe === "Week" ? "Weekly Expenses" : timeframe === "Month" ? "Monthly Expenses" : timeframe === "Year" ? "Yearly Expenses" : timeframe === "All" ? "All Time Expenses" : "Period Expenses"
              }
            </span>
          </div>
          <div className="stat-value" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(selectedAccount !== "All" ? summary.cashOut : summary.totalExpense)}
          </div>
          <div className="stat-change down">
            <span>
              {selectedAccount !== "All"
                ? "Expenses and outward transfers"
                : `${((summary.totalExpense / (summary.salary || 1)) * 100).toFixed(0)}% utilization`
              }
            </span>
          </div>
        </div>

        {/* Current Salary Base */}
        <div className="glass-card glow-emerald">
          <div className="stat-label">
            <DollarSign size={16} style={{ color: "var(--neon-emerald)" }} />
            <span>
              {selectedAccount !== "All"
                ? `${selectedAccount} Cash In`
                : timeframe === "Today" ? "Daily Base Target" : timeframe === "Week" ? "Weekly Base Target" : timeframe === "Month" ? "Monthly Base Target" : timeframe === "Year" ? "Yearly Base Target" : timeframe === "All" ? "All Time Base Target" : "Period Base Target"
              }
            </span>
          </div>
          <div className="stat-value" style={{ color: "var(--neon-emerald)" }}>
            {formatCurrency(selectedAccount !== "All" ? summary.cashIn : summary.salary)}
          </div>
          <div className="stat-change up">
            <span>
              {selectedAccount !== "All"
                ? "Incomes and inward transfers"
                : timeframe === "Month" ? "Configured target in Settings" : `Scaled from monthly base (${formatCurrency(user?.salary || 5000)})`
              }
            </span>
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
                  disabled={submitting}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Currency</label>
                <select 
                  className="glass-select"
                  value={inputCurrency}
                  onChange={(e) => setInputCurrency(e.target.value)}
                  disabled={submitting}
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
                disabled={submitting}
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
                  disabled={submitting}
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>

              {/* Account selection */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  {transactionType === "Transfer" ? "Source Account" : "Funding Source"}
                </label>
                <select 
                  className="glass-select"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  disabled={submitting}
                >
                  {accounts.map(acc => (
                    <option key={acc.AccountID} value={acc.AccountName}>{acc.AccountName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional selectors depending on Flow Type */}
            {transactionType === "Transfer" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Destination Account */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Destination Account</label>
                  <select
                    className="glass-select"
                    value={destinationAccount}
                    onChange={(e) => setDestinationAccount(e.target.value)}
                    disabled={submitting}
                  >
                    {accounts.filter(acc => acc.AccountName !== account).map(acc => (
                      <option key={acc.AccountID} value={acc.AccountName}>{acc.AccountName}</option>
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
                    disabled={submitting}
                  />
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Category */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Category</label>
                    <select 
                      className="glass-select"
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      disabled={submitting}
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
                      disabled={submitting}
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
                      disabled={submitting}
                      style={{
                        padding: "10px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.6 : 1,
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
                      disabled={submitting}
                      style={{
                        padding: "10px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.6 : 1,
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
                      disabled={submitting}
                      style={{
                        padding: "10px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.6 : 1,
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
              </>
            )}

            <button 
              type="submit" 
              className="glass-button" 
              style={{ width: "100%", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
              disabled={submitting}
            >
              {submitting ? (
                <span>🔄 Syncing transaction...</span>
              ) : (
                <>
                  <Plus size={16} /> Add Transaction Record
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* RECENT TRANSACTIONS TABLE */}
      <section className="glass-card glow-purple grid-span-3" style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
          <h3 style={{ margin: 0 }}>🕒 Recent Transaction Activity Ledger</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            Showing {filteredTransactions.length} of {transactions.length} total entries
          </span>
        </div>

        <div className="txn-table-container">
          {transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              No transactions posted yet. Use the manual entry or NLP AI console above to add your first expense!
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              No transactions match the selected filters. Try selecting a different filter option!
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
                {filteredTransactions.map((txn) => {
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
