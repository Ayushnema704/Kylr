"use client";

import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { Plus, Trash2, Wallet, CreditCard as CreditCardIcon, Landmark, Sparkles } from "lucide-react";

export default function Accounts() {
  const { user } = useAuth();
  const { accounts, addAccount, deleteAccount, loading, formatCurrency } = useData();
  const activeCurrency = user?.currency || "USD";

  // Form states
  const [accountType, setAccountType] = useState("Bank Account");
  const [accountName, setAccountName] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [bankName, setBankName] = useState("");
  const [cardLast4Digits, setCardLast4Digits] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  // Custom Fintech Card Theme states & Palette
  const CARD_PALETTE = [
    "#F43F5E", // Rose
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#8B5CF6", // Purple
    "#3B82F6", // Blue
    "#06B6D4", // Cyan
    "#6B7280"  // Gray
  ];
  const [selectedColor, setSelectedColor] = useState(CARD_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    setSubmitting(true);
    const res = await addAccount({
      accountType,
      accountName,
      currentBalance: parseFloat(currentBalance) || 0,
      creditLimit: parseFloat(creditLimit) || 0,
      bankName: bankName.trim() || "Generic",
      cardLast4Digits: cardLast4Digits || "0000",
      color: selectedColor,
      buyPrice: parseFloat(buyPrice) || 0,
      quantity: parseFloat(quantity) || 0
    });
    setSubmitting(false);

    if (res.success) {
      setAccountName("");
      setBankName("");
      setCurrentBalance("");
      setCreditLimit("");
      setCardLast4Digits("");
      setBuyPrice("");
      setQuantity("");
      setSelectedColor(CARD_PALETTE[0]);
    }
  };

  const getCardStyleClass = (bank) => {
    const b = bank.toLowerCase();
    if (b.includes("hdfc")) return "fin-card hdfc";
    if (b.includes("icici") || b.includes("amazon")) return "fin-card icici";
    if (b.includes("paytm") || b.includes("phonepe")) return "fin-card paytm";
    return "fin-card generic";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", color: "var(--text-secondary)" }}>
        Syncing banking vaults...
      </div>
    );
  }

  // Aggregate totals
  const totalAssets = accounts
    .filter(a => a.AccountType !== "Credit Card")
    .reduce((sum, a) => {
      const bal = parseFloat(a.CurrentBalance) || 0;
      const qty = parseFloat(a.Quantity || a.quantity) || 0;
      const isInvestment = a.AccountType === "Investment (Mutual Fund)" || a.AccountType === "Investment (Stocks)";
      return sum + (isInvestment ? (bal * qty) : bal);
    }, 0);

  const totalLiabilities = accounts
    .filter(a => a.AccountType === "Credit Card")
    .reduce((sum, a) => sum + Math.abs(parseFloat(a.CurrentBalance)), 0);

  return (
    <div>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title-sec">
          <h1>Financial Accounts Vault</h1>
          <span className="header-subtitle">
            Manage your bank accounts, active credit cards, and digital wallets in one premium dashboard.
          </span>
        </div>
        <div className="glow-pill purple">
          <Landmark size={12} />
          <span>Accounts Vault Sync Active</span>
        </div>
      </header>

      {/* PORTFOLIO BALANCE CARDS */}
      <section className="dashboard-grid" style={{ marginBottom: "32px" }}>
        <div className="glass-card glow-emerald">
          <div className="stat-label">
            <Landmark size={16} style={{ color: "var(--neon-emerald)" }} />
            <span>Total Liquid Networth Assets</span>
          </div>
          <div className="stat-value" style={{ color: "var(--neon-emerald)" }}>
            {formatCurrency(totalAssets)}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Cash holdings, salary buffers, and active wallets
          </span>
        </div>
 
        <div className="glass-card glow-cyan">
          <div className="stat-label">
            <CreditCardIcon size={16} style={{ color: "var(--neon-rose)" }} />
            <span>Credit Cards Outstanding Liability</span>
          </div>
          <div className="stat-value" style={{ color: "var(--neon-rose)" }}>
            {formatCurrency(totalLiabilities)}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Accrued expenses, postpaid limits, and credit balances
          </span>
        </div>
 
        <div className="glass-card glow-purple">
          <div className="stat-label">
            <Wallet size={16} style={{ color: "var(--neon-purple)" }} />
            <span>Liquid Cash Net Ratio</span>
          </div>
          <div className="stat-value">
            {formatCurrency(totalAssets - totalLiabilities)}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Net liquidity after fully clearing card statements
          </span>
        </div>
      </section>

      {/* TWO COLUMN INTERACTIVE BODY */}
      <section className="dashboard-grid">
        {/* Left Column: Visual Banking Cards grid (Span 2) */}
        <div className="grid-span-2" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h3 style={{ marginBottom: "4px" }}>💳 Active Cards & Vault Ledger</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Visual card formats styled dynamically based on your bank selections.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {accounts.map(acc => {
              const isInvestment = acc.AccountType === "Investment (Mutual Fund)" || acc.AccountType === "Investment (Stocks)";
              const qtyVal = parseFloat(acc.Quantity || acc.quantity) || 0;
              const buyPriceVal = parseFloat(acc.BuyPrice || acc.buyPrice) || 0;
              const currentPriceVal = parseFloat(acc.CurrentBalance) || 0;
              const totalInvestedVal = qtyVal * buyPriceVal;
              const totalCurrentVal = qtyVal * currentPriceVal;
              const gainLossAmount = totalCurrentVal - totalInvestedVal;
              const gainLossPercent = totalInvestedVal > 0 ? (gainLossAmount / totalInvestedVal) * 100 : 0;
              const isProfit = gainLossAmount >= 0;

              return (
                <div 
                  key={acc.AccountID} 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "12px", 
                    position: "relative" 
                  }}
                >
                  {/* Custom Visual Credit Card */}
                  <div 
                    className={getCardStyleClass(acc.BankName || acc.AccountName)}
                    style={{
                      background: acc.Color || acc.color || undefined,
                      boxShadow: (acc.Color || acc.color) ? `0 10px 25px ${(acc.Color || acc.color)}4D` : undefined
                    }}
                  >
                    {isInvestment && qtyVal > 0 && buyPriceVal > 0 && (
                      <div 
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          background: isProfit ? "rgba(16, 185, 129, 0.18)" : "rgba(244, 63, 94, 0.18)",
                          border: isProfit ? "1px solid var(--neon-emerald)" : "1px solid var(--neon-rose)",
                          color: isProfit ? "var(--neon-emerald)" : "var(--neon-rose)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          boxShadow: isProfit ? "0 0 10px rgba(16, 185, 129, 0.2)" : "0 0 10px rgba(244, 63, 94, 0.2)",
                          zIndex: 3
                        }}
                      >
                        {isProfit ? "▲" : "▼"} {isProfit ? "+" : ""}{gainLossPercent.toFixed(2)}%
                      </div>
                    )}
                    <div className="card-top">
                      <div className="card-chip" />
                      <span className="card-brand">
                        {acc.AccountType === "Credit Card" 
                          ? "POSTPAID" 
                          : isInvestment 
                            ? (acc.AccountType === "Investment (Mutual Fund)" ? "MUTUAL FUND" : "STOCK PORTFOLIO") 
                            : "LIQUID"
                        }
                      </span>
                    </div>
                    
                    <div className="card-middle">
                      {isInvestment ? (
                        <span className="card-number" style={{ fontSize: "0.85rem", letterSpacing: "normal", fontFamily: "inherit", textTransform: "uppercase" }}>
                          QTY: {qtyVal} | BUY PRICE: {formatCurrency(buyPriceVal)}
                        </span>
                      ) : (
                        <span className="card-number">
                          •••• •••• •••• {acc.CardLast4Digits || "9820"}
                        </span>
                      )}
                    </div>

                    <div className="card-bottom">
                      <div>
                        <span className="card-holder">
                          {acc.AccountName}
                        </span>
                      </div>
                      <div className="card-balance-sec">
                        <span className="card-bal-label">
                          {isInvestment ? "Current Value" : "Balance"}
                        </span>
                        <div className="card-balance">
                          {isInvestment 
                            ? formatCurrency(totalCurrentVal) 
                            : formatCurrency(acc.CurrentBalance)
                          }
                        </div>
                      </div>
                    </div>
                  </div>
   
                  {/* Additional details underneath card */}
                  <div className="glass-card" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      🏦 <strong>Institution:</strong> {acc.BankName || "General Wallet"} 
                      {acc.AccountType === "Credit Card" && ` | limit: ${formatCurrency(acc.CreditLimit)}`}
                      {isInvestment && ` | Buy Price: ${formatCurrency(buyPriceVal)}`}
                    </div>
                    <button 
                      onClick={() => deleteAccount(acc.AccountID)}
                      style={{ 
                        background: "transparent", 
                        border: "none", 
                        color: "rgba(244, 63, 94, 0.4)", 
                        cursor: "pointer", 
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      onMouseEnter={(e) => e.target.style.color = "var(--neon-rose)"}
                      onMouseLeave={(e) => e.target.style.color = "rgba(244, 63, 94, 0.4)"}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Register a New Asset/Liabilities Account */}
        <div className="glass-card glow-emerald">
          <h3 style={{ marginBottom: "16px" }}>⚡ Add Vault Asset</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Account Type */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Account Type</label>
              <select 
                className="glass-select"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <option value="Bank Account">Bank Account (Savings / Salary)</option>
                <option value="Credit Card">Credit Card (Postpaid Limit)</option>
                <option value="Wallet">Digital Wallet (Paytm, Cash)</option>
                <option value="Investment (Mutual Fund)">Investment (Mutual Fund Holding)</option>
                <option value="Investment (Stocks)">Investment (Stock Holding)</option>
              </select>
            </div>

            {/* Display Name */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Account Display Name</label>
              <input 
                type="text" 
                placeholder="e.g. HDFC Salary Account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="glass-input" 
                required
              />
            </div>

            {/* Balances */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                {accountType === "Credit Card" 
                  ? `Current Owed Balance (${activeCurrency})` 
                  : (accountType.startsWith("Investment"))
                    ? `Current Price per unit (${activeCurrency})`
                    : `Opening Liquid Balance (${activeCurrency})`
                }
              </label>
              <input 
                type="number" 
                step="0.0001"
                placeholder="0.00"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="glass-input" 
                required
              />
            </div>
 
            {/* Credit Card Specific Fields */}
            {accountType === "Credit Card" && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Maximum Credit Limit ({activeCurrency})</label>
                <input 
                  type="number" 
                  placeholder="5000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="glass-input" 
                />
              </div>
            )}

            {/* Investment Specific Fields */}
            {accountType.startsWith("Investment") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Avg Buy Price ({activeCurrency})</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    placeholder="150.00"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="glass-input" 
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Number of Units</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    placeholder="10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="glass-input" 
                    required
                  />
                </div>
              </div>
            )}

            {/* Grid 2 Elements */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Institution/Bank text field */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Institution / Bank</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chase Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="glass-input" 
                  required
                />
              </div>

              {/* Last 4 Digits */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Last 4 Digits</label>
                <input 
                  type="text" 
                  maxLength="4"
                  placeholder="4920"
                  value={cardLast4Digits}
                  onChange={(e) => setCardLast4Digits(e.target.value)}
                  className="glass-input" 
                />
              </div>
            </div>

            {/* Custom Card Color Swatches */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Personalize Card Theme</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {CARD_PALETTE.map(col => {
                  const isActive = selectedColor === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: col,
                        border: isActive ? "2px solid #fff" : "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: isActive ? `0 0 10px ${col}` : "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        transform: isActive ? "scale(1.12)" : "scale(1)"
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <button 
              type="submit" 
              className="glass-button" 
              style={{ width: "100%", opacity: submitting ? 0.6 : 1 }}
              disabled={submitting}
            >
              <Plus size={16} /> {submitting ? "Syncing banking vaults..." : "Register Financial Vault"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
