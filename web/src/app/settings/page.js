"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData, CURRENCY_MAP } from "../../context/DataContext";
import { Settings, Save, Shield, HelpCircle, Globe } from "lucide-react";

export default function SettingsPage() {
  const { user, isSandbox, toggleSystemMode } = useAuth();
  const { appsScriptUrl, geminiApiKey, updateBackendConfig, updateBudget, exchangeRates, convertCurrency } = useData();

  // Local state copy
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");
  const [needs, setNeeds] = useState(50);
  const [wants, setWants] = useState(30);
  const [savings, setSavings] = useState(20);
  const [ruleEnabled, setRuleEnabled] = useState(true);
  const [currency, setCurrency] = useState("USD");

  const handleCurrencyChange = (newCurr) => {
    const oldCurr = currency;
    setCurrency(newCurr);
    if (salary && !isNaN(parseFloat(salary))) {
      const converted = convertCurrency(parseFloat(salary), oldCurr, newCurr);
      setSalary(parseFloat(converted.toFixed(2)));
    }
  };

  // Network keys local copy
  const [urlInput, setUrlInput] = useState("");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [configSavedMessage, setConfigSavedMessage] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.displayName);
      setSalary(user.salary);
      setNeeds(user.needsPercentage || 50);
      setWants(user.wantsPercentage || 30);
      setSavings(user.savingsPercentage || 20);
      setRuleEnabled(user.budgetRuleEnabled);
      setCurrency(user.currency || "USD");
    }
    setUrlInput(appsScriptUrl);
    setGeminiKeyInput(geminiApiKey);
  }, [user, appsScriptUrl, geminiApiKey]);

  // Compute validation
  const totalPercentage = Number(needs) + Number(wants) + Number(savings);
  const isRatioValid = totalPercentage === 100;

  // Handle profile update
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (ruleEnabled && !isRatioValid) return;

    const res = await updateBudget({
      name,
      salary: parseFloat(salary) || 5000,
      budgetRuleEnabled: ruleEnabled,
      needsPercentage: Number(needs),
      wantsPercentage: Number(wants),
      savingsPercentage: Number(savings),
      currency: currency
    });

    if (res.success) {
      setConfigSavedMessage("✅ Financial profile updated successfully! Realignment complete.");
      setTimeout(() => setConfigSavedMessage(""), 4000);
    }
  };

  // Handle endpoint/keys update
  const handleNetworkSave = (e) => {
    e.preventDefault();
    updateBackendConfig(urlInput.trim(), geminiKeyInput.trim());
    setConfigSavedMessage("🚀 System APIs updated! Swapped database nodes.");
    setTimeout(() => setConfigSavedMessage(""), 4000);
  };

  // Quick switch toggle
  const handleModeToggle = (mode) => {
    toggleSystemMode(mode);
    setConfigSavedMessage(`🔄 Switched system context to ${mode === 'production' ? 'Production live sheets' : 'Sandbox local ledger'}!`);
    setTimeout(() => {
      setConfigSavedMessage("");
      window.location.reload();
    }, 1500);
  };

  return (
    <div>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title-sec">
          <h1>System settings</h1>
          <span className="header-subtitle">
            Configure your salary profiles, 50-30-20 budget divisions, and cloud integrations.
          </span>
        </div>
        <div className="glow-pill purple">
          <Settings size={12} />
          <span>General settings active</span>
        </div>
      </header>

      {/* SUCCESS ALERTS */}
      {configSavedMessage && (
        <div className="glass-card" style={{ 
          background: "rgba(16, 185, 129, 0.08)", 
          borderColor: "var(--border-neon-emerald)",
          color: "var(--neon-emerald)",
          padding: "16px 24px",
          borderRadius: "12px",
          marginBottom: "24px",
          fontSize: "0.95rem",
          fontWeight: 600,
          boxShadow: "var(--neon-glow-emerald)"
        }}>
          {configSavedMessage}
        </div>
      )}

      {/* DASHBOARD GRID */}
      <section className="dashboard-grid">
        {/* LEFT COLUMN: PROFILE & 50-30-20 CONFIGURATION (Span 2) */}
        <div className="grid-span-2" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="glass-card glow-purple">
            <h3 style={{ marginBottom: "20px" }}>👤 User & 50-30-20 Budget Allocator</h3>
            
            <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Grid 3 Elements */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Display Profile Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input" 
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Monthly Base Income ({CURRENCY_MAP[currency]?.symbol || "$"})
                  </label>
                  <input 
                    type="number" 
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="glass-input" 
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Portfolio Base Currency</label>
                  <select 
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="glass-select"
                  >
                    {Object.keys(CURRENCY_MAP).map(code => (
                      <option key={code} value={code}>
                        {code} ({CURRENCY_MAP[code].symbol}) - {CURRENCY_MAP[code].name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 50-30-20 Rule Enabled Toggle */}
              <div style={{ 
                background: "rgba(255, 255, 255, 0.02)", 
                padding: "16px", 
                borderRadius: "10px", 
                border: "1px solid rgba(255, 255, 255, 0.04)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Enable 50-30-20 Salary-based Budgeting</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "2px" }}>
                    Splits salary automatically into Essential Needs, Lifestyle Wants, and Savings Targets.
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={ruleEnabled}
                  onChange={(e) => setRuleEnabled(e.target.checked)}
                  style={{
                    width: "44px",
                    height: "22px",
                    cursor: "pointer"
                  }}
                />
              </div>

              {/* Slider / Ratios Custom Configuration */}
              {ruleEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px" }}>
                    Customize Split Percentages
                  </h4>

                  {/* Ratio Sum warning */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    background: isRatioValid ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)",
                    border: isRatioValid ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(244,63,94,0.2)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    color: isRatioValid ? "var(--neon-emerald)" : "var(--neon-rose)"
                  }}>
                    <span>Running Ratio Sum: <strong>{totalPercentage}%</strong></span>
                    <span>
                      {isRatioValid 
                        ? "✅ Perfect! Allocator ratio equals exactly 100%." 
                        : "⚠️ Allocator ratios must sum up to exactly 100%!"
                      }
                    </span>
                  </div>

                  {/* Needs slider */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                      <span style={{ color: "var(--neon-emerald)", fontWeight: 600 }}>Needs Budget Category (Essentials, Rent)</span>
                      <strong>{needs}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="80" 
                      value={needs}
                      onChange={(e) => setNeeds(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--neon-emerald)", cursor: "pointer" }}
                    />
                  </div>

                  {/* Wants slider */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                      <span style={{ color: "var(--neon-cyan)", fontWeight: 600 }}>Wants Budget Category (Shopping, Dining)</span>
                      <strong>{wants}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="80" 
                      value={wants}
                      onChange={(e) => setWants(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--neon-cyan)", cursor: "pointer" }}
                    />
                  </div>

                  {/* Savings slider */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                      <span style={{ color: "var(--neon-purple)", fontWeight: 600 }}>Savings Target Category (Mutual Funds, SIP)</span>
                      <strong>{savings}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="80" 
                      value={savings}
                      onChange={(e) => setSavings(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--neon-purple)", cursor: "pointer" }}
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="glass-button" 
                disabled={ruleEnabled && !isRatioValid}
                style={{ alignSelf: "flex-end", opacity: (ruleEnabled && !isRatioValid) ? 0.5 : 1 }}
              >
                <Save size={16} /> Save Allocations & Profile
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: ENDPOINT CREDENTIALS & MODE SWITCH */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Active Ledger Mode selector */}
          <div className="glass-card glow-cyan">
            <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={16} style={{ color: "var(--neon-cyan)" }} /> Ledger Environment
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "20px" }}>
              Toggle between offline simulated sandbox mode and live writing databases.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button 
                onClick={() => handleModeToggle("sandbox")}
                className={`glass-button ${isSandbox ? "" : "secondary"}`}
                style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.85rem" }}
              >
                ⚡ Simulated Sandbox Mode {isSandbox && " (Active)"}
              </button>
              
              <button 
                onClick={() => handleModeToggle("production")}
                className={`glass-button ${!isSandbox ? "" : "secondary"}`}
                style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.85rem" }}
              >
                ☁️ Live Google Sheets API Mode {!isSandbox && " (Active)"}
              </button>
            </div>
          </div>

          {/* Real-time Exchange Rates Widget */}
          <div className="glass-card glow-purple">
            <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Globe size={16} style={{ color: "var(--neon-purple)" }} /> Exchange Rates Network
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "16px" }}>
              Active live ledger rates relative to 1 {currency} base portfolio currency.
            </p>
            
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "10px",
              maxHeight: "260px",
              overflowY: "auto",
              paddingRight: "4px"
            }}>
              {Object.keys(CURRENCY_MAP).filter(c => c !== currency).map(c => {
                const rate = exchangeRates[c] / exchangeRates[currency];
                return (
                  <div key={c} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.02)",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    fontSize: "0.85rem"
                  }}>
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                      {CURRENCY_MAP[currency].symbol}1 {currency}
                    </span>
                    <span style={{ color: "var(--neon-cyan)", fontWeight: 700 }}>
                      {CURRENCY_MAP[c].symbol}{rate.toFixed(4)} {c}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cloud API configurations */}
          <div className="glass-card glow-purple">
            <h3 style={{ marginBottom: "16px" }}>⚙️ Cloud Integration APIs</h3>
            
            <form onSubmit={handleNetworkSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Apps Script Endpoint URL */}
              <div>
                <label style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontSize: "0.8rem", 
                  color: "var(--text-secondary)", 
                  marginBottom: "6px" 
                }}>
                  <span>Apps Script Web API URL</span>
                  <HelpCircle size={12} style={{ opacity: 0.6 }} />
                </label>
                <input 
                  type="url" 
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="glass-input" 
                />
              </div>

              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                💡 Note: Connecting this credential swaps your dashboard ledger immediately into secure Google Sheet rows.
              </span>

              <button type="submit" className="glass-button" style={{ width: "100%", marginTop: "8px" }}>
                <Save size={16} /> Save Node Keys
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
