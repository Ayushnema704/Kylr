"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Trash2, 
  Plus, 
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  CheckSquare,
  Square,
  RotateCcw
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";

export default function RemindersPage() {
  const { user } = useAuth();
  const { 
    reminders, 
    accounts, 
    categories, 
    addReminder, 
    deleteReminder, 
    checkOffReminder, 
    formatCurrency 
  } = useData();

  // New Reminder form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("Expense");
  const [frequency, setFrequency] = useState("Monthly");
  const [account, setAccount] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [category, setCategory] = useState("");
  const [budgetType, setBudgetType] = useState("Want");
  const [startDate, setStartDate] = useState("");
  const [deductionDay, setDeductionDay] = useState("1");
  const [isAutopay, setIsAutopay] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Month configurations
  const [activeTab, setActiveTab] = useState("Current"); // "Current" or "Upcoming"
  
  const today = new Date();
  
  const formatMonthYearStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };
  
  const formatMonthLabel = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const currentMonthStr = formatMonthYearStr(today);
  const currentMonthLabel = formatMonthLabel(today);

  const upcomingMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const upcomingMonthStr = formatMonthYearStr(upcomingMonthDate);
  const upcomingMonthLabel = formatMonthLabel(upcomingMonthDate);

  // Sync form defaults
  useEffect(() => {
    if (!startDate) {
      setStartDate(new Date().toISOString().split("T")[0]);
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
  }, [categories, accounts, startDate, category, account, destinationAccount]);

  // Handle category budgetTag sync
  const handleCategoryChange = (catName) => {
    setCategory(catName);
    const matched = categories.find(c => c.CategoryName === catName);
    if (matched) {
      setBudgetType(matched.BudgetType);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || isNaN(parseFloat(amount)) || submitting) return;

    setSubmitting(true);
    try {
      const res = await addReminder({
        title,
        amount: parseFloat(amount),
        transactionType,
        frequency,
        account,
        destinationAccount: transactionType === "Transfer" ? destinationAccount : "",
        category: transactionType === "Transfer" ? "Transfer" : category,
        budgetType: transactionType === "Transfer" ? "Savings" : budgetType,
        startDate,
        deductionDay: parseInt(deductionDay) || 1,
        isAutopay
      });

      if (res.success) {
        setTitle("");
        setAmount("");
        setDeductionDay("1");
        setIsAutopay(false);
      }
    } catch (err) {
      console.error("Failed to add reminder:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOff = async (remId, monthStr) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await checkOffReminder(remId, monthStr);
    } catch (err) {
      console.error("Failed to check off reminder:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (remId) => {
    if (confirm("Are you sure you want to delete this recurring schedule? This will not affect transactions already posted.")) {
      try {
        await deleteReminder(remId);
      } catch (err) {
        console.error("Failed to delete reminder:", err);
      }
    }
  };

  // Calculate totals
  const getPeriodDeductionsTotal = (monthStr) => {
    let expected = 0;
    let posted = 0;

    reminders.forEach(r => {
      const start = new Date(r.StartDate);
      const limit = new Date(monthStr + "-31");
      if (start > limit) return; // reminder hasn't started yet

      const amt = parseFloat(r.Amount) || 0;
      const checkedMonths = r.CheckedOffMonths ? String(r.CheckedOffMonths).split(",") : [];
      const isChecked = checkedMonths.includes(monthStr);

      expected += amt;
      if (isChecked) {
        posted += amt;
      }
    });

    return { expected, posted };
  };

  const currentTotals = getPeriodDeductionsTotal(currentMonthStr);
  const upcomingTotals = getPeriodDeductionsTotal(upcomingMonthStr);

  return (
    <div style={{ fontFamily: "var(--font-sans, system-ui)", color: "#fff" }}>
      {/* Visual Header */}
      <header className="dashboard-header" style={{ marginBottom: "24px" }}>
        <div className="header-title-sec">
          <h1>Autopays & Reminders</h1>
          <span className="header-subtitle">
            Schedule recurring deductions, simulate future months, and check off monthly logs to the ledger.
          </span>
        </div>
        <div className="glow-pill purple">
          <Bell size={12} style={{ animation: "pulse-glow 1.5s infinite" }} />
          <span>Scheduled Deductions Console</span>
        </div>
      </header>

      {/* THREE COLUMN GRID */}
      <section className="dashboard-grid" style={{ gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: CREATION FORM */}
        <div className="glass-card glow-purple" style={{ padding: "24px", position: "relative" }}>
          <h3 style={{ margin: "0 0 16px 0", fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} style={{ color: "var(--neon-purple)" }} /> Add Deduction Rule
          </h3>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Deduction Title</label>
              <input 
                type="text" 
                placeholder="e.g. Netflix Premium, House Rent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input" 
                required
                disabled={submitting}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Frequency</label>
                <select 
                  className="glass-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Deduction Day</label>
                <input 
                  type="number" 
                  min="1"
                  max="31"
                  placeholder="Day of Month"
                  value={deductionDay}
                  onChange={(e) => setDeductionDay(e.target.value)}
                  className="glass-input" 
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Flow Type</label>
                <select 
                  className="glass-select"
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Expense">Expense</option>
                  <option value="Transfer">Self Transfer</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  {transactionType === "Transfer" ? "Source Account" : "Funding Account"}
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
              
              {transactionType === "Transfer" ? (
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
              ) : (
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
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Start Date</label>
                <input 
                  type="date" 
                  className="glass-input" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                <input 
                  type="checkbox" 
                  checked={isAutopay}
                  onChange={(e) => setIsAutopay(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--neon-purple)" }}
                  disabled={submitting}
                />
                <span>Set as Automatic Autopay deduction</span>
              </label>
              <p style={{ margin: "4px 0 0 24px", color: "var(--text-muted)", fontSize: "0.7rem" }}>
                Autopays show as direct deductions but still support check-off validation logs.
              </p>
            </div>

            <button 
              type="submit" 
              className="glass-button" 
              style={{ width: "100%", marginTop: "12px", cursor: submitting ? "not-allowed" : "pointer" }}
              disabled={submitting}
            >
              {submitting ? "🔄 Syncing rule..." : "📅 Add Deduction Schedule"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: MONTHLY TABS AND SCHEDULES GRID */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* TAB CONTROL BAR */}
          <div className="glass-card" style={{ padding: "8px", display: "flex", gap: "8px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px" }}>
            <button
              onClick={() => setActiveTab("Current")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.85rem",
                transition: "all 0.3s ease",
                background: activeTab === "Current" ? "var(--neon-purple)" : "transparent",
                color: activeTab === "Current" ? "#fff" : "var(--text-secondary)",
                boxShadow: activeTab === "Current" ? "0 0 15px rgba(139, 92, 246, 0.35)" : "none"
              }}
            >
              📅 Current Month ({currentMonthLabel})
            </button>
            <button
              onClick={() => setActiveTab("Upcoming")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.85rem",
                transition: "all 0.3s ease",
                background: activeTab === "Upcoming" ? "var(--neon-purple)" : "transparent",
                color: activeTab === "Upcoming" ? "#fff" : "var(--text-secondary)",
                boxShadow: activeTab === "Upcoming" ? "0 0 15px rgba(139, 92, 246, 0.35)" : "none"
              }}
            >
              🚀 Upcoming Month ({upcomingMonthLabel})
            </button>
          </div>

          {/* MONTH STATS BRIEF */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="glass-card glow-purple" style={{ padding: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Expected Deductions
              </span>
              <h3 style={{ margin: "4px 0 0 0", fontSize: "1.4rem", color: "#fff" }}>
                {formatCurrency(activeTab === "Current" ? currentTotals.expected : upcomingTotals.expected)}
              </h3>
            </div>
            <div className="glass-card glow-emerald" style={{ padding: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Successfully Logged / Posted
              </span>
              <h3 style={{ margin: "4px 0 0 0", fontSize: "1.4rem", color: "var(--neon-emerald)" }}>
                {formatCurrency(activeTab === "Current" ? currentTotals.posted : upcomingTotals.posted)}
              </h3>
            </div>
          </div>

          {/* REMINDERS LIST */}
          <div className="glass-card glow-purple" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 20px 0", fontFamily: "var(--font-display)" }}>
              Deductions Tracker for {activeTab === "Current" ? currentMonthLabel : upcomingMonthLabel}
            </h3>

            {reminders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                No recurring rules defined yet. Use the creation console to schedule your first Autopay!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {reminders.map(r => {
                  const targetMonthStr = activeTab === "Current" ? currentMonthStr : upcomingMonthStr;
                  
                  // Filter out reminders starting in the future
                  const reminderStartDate = new Date(r.StartDate);
                  const periodLimitDate = new Date(targetMonthStr + "-31");
                  if (reminderStartDate > periodLimitDate) return null;

                  const checkedMonths = r.CheckedOffMonths ? String(r.CheckedOffMonths).split(",") : [];
                  const isChecked = checkedMonths.includes(targetMonthStr);
                  
                  const isTransfer = r.TransactionType === "Transfer";

                  return (
                    <div 
                      key={r.ReminderID} 
                      className="glass-card" 
                      style={{ 
                        padding: "16px", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        border: isChecked ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(255,255,255,0.06)",
                        background: isChecked ? "rgba(16, 185, 129, 0.03)" : "rgba(255,255,255,0.02)",
                        transition: "all 0.3s ease"
                      }}
                    >
                      {/* LEFT: SCHED DETAILS */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {/* Interactive Checkbox */}
                        <button
                          onClick={() => !isChecked && handleCheckOff(r.ReminderID, targetMonthStr)}
                          disabled={isChecked || submitting}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            cursor: isChecked ? "default" : (submitting ? "not-allowed" : "pointer"),
                            color: isChecked ? "var(--neon-emerald)" : "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease"
                          }}
                        >
                          {isChecked ? (
                            <CheckSquare size={22} style={{ filter: "drop-shadow(0 0 5px rgba(16, 185, 129, 0.4))" }} />
                          ) : (
                            <Square size={22} />
                          )}
                        </button>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: isChecked ? "var(--text-muted)" : "var(--text-primary)", textDecoration: isChecked ? "line-through" : "none" }}>
                              {r.Title}
                            </span>
                            {r.IsAutopay === true || r.IsAutopay === "true" ? (
                              <span style={{
                                fontSize: "0.65rem",
                                background: "rgba(139, 92, 246, 0.15)",
                                color: "var(--neon-purple)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: 700,
                                textTransform: "uppercase"
                              }}>
                                Autopay
                              </span>
                            ) : null}
                          </div>

                          <div style={{ flexDirection: "row", marginTop: "4px", fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                            <span>🔄 {r.Frequency}</span>
                            <span>📅 Day {r.DeductionDay}</span>
                            <span>
                              {isTransfer ? `💳 ${r.Account} ➜ ${r.DestinationAccount}` : `💳 ${r.Account} (${r.Category})`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: ACTIONS AND EXPECTED AMOUNT */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ 
                            fontSize: "1.1rem", 
                            fontWeight: 800, 
                            color: isChecked ? "var(--neon-emerald)" : "var(--neon-rose)" 
                          }}>
                            {isChecked ? "+" : "-"}{formatCurrency(r.Amount)}
                          </span>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                            {isChecked ? "Posted" : "Expected"}
                          </div>
                        </div>

                        {/* Delete rule button */}
                        <button 
                          onClick={() => handleDelete(r.ReminderID)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(244, 63, 94, 0.35)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            padding: "4px"
                          }}
                          onMouseEnter={(e) => e.target.style.color = "var(--neon-rose)"}
                          onMouseLeave={(e) => e.target.style.color = "rgba(244, 63, 94, 0.35)"}
                          title="Delete Recurring Rule"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
