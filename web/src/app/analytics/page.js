"use client";

import React from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { useData } from "../../context/DataContext";
import { Activity, BarChart2 } from "lucide-react";

// Neon styling parameters
const COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#F43F5E", "#F59E0B", "#EC4899", "#3B82F6"];

// Custom Glassmorphic Tooltip
const CustomTooltip = ({ active, payload, formatCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(13, 13, 23, 0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "12px 16px",
        borderRadius: "10px",
        color: "#fff",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
      }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
          {payload[0].payload.date || payload[0].name}
        </p>
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--neon-cyan)" }}>
          {formatCurrency ? formatCurrency(payload[0].value) : `$${payload[0].value.toFixed(2)}`}
        </p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { analytics, transactions, loading, formatCurrency } = useData();
  const [timeframe, setTimeframe] = React.useState("Monthly");

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", color: "var(--text-secondary)" }}>
        Fetching visual ledger balances...
      </div>
    );
  }

  // Compute multi-timeframe analytics dynamically from local ledger transactions
  const { trendData, breakdownData, summary } = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        trendData: analytics?.dailyTrends || [
          { date: "May 15", amount: 150 },
          { date: "May 18", amount: 320 },
          { date: "May 20", amount: 45 },
          { date: "May 22", amount: 180 },
          { date: "May 24", amount: 500 }
        ],
        breakdownData: analytics?.categoryBreakdown || [
          { name: "Rent", value: 1200 },
          { name: "Dining Out", value: 320 },
          { name: "Groceries", value: 180 },
          { name: "Entertainment", value: 45 }
        ],
        summary: analytics?.summary || {
          salary: 5000,
          totalExpense: 1745,
          netSavings: 3255,
          splitExpenses: { Need: 1380, Want: 365, Savings: 0 }
        }
      };
    }

    const now = new Date();
    let limitDate = new Date();
    
    if (timeframe === "Weekly") {
      limitDate.setDate(now.getDate() - 7);
    } else if (timeframe === "Monthly") {
      limitDate.setDate(now.getDate() - 30);
    } else if (timeframe === "Yearly") {
      limitDate.setDate(now.getDate() - 365);
    }

    // Filter txns within timeframe
    const filteredTxns = transactions.filter(t => {
      const tDate = new Date(t.Date);
      return tDate >= limitDate && tDate <= now;
    });

    // Compute Income & Expense
    let totalIncome = 0;
    let totalExpense = 0;
    let needSpend = 0;
    let wantSpend = 0;
    let savingsSpend = 0;

    const catMap = {};
    const trendMap = {};

    filteredTxns.forEach(t => {
      const amt = parseFloat(t.Amount) || 0;
      if (t.TransactionType === "Income") {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        if (t.BudgetType === "Need") needSpend += amt;
        else if (t.BudgetType === "Want") wantSpend += amt;
        else if (t.BudgetType === "Savings") savingsSpend += amt;

        catMap[t.Category] = (catMap[t.Category] || 0) + amt;

        let key = "";
        if (timeframe === "Yearly") {
          const d = new Date(t.Date);
          key = d.toLocaleString("default", { month: "short", year: "2-digit" });
        } else {
          const d = new Date(t.Date);
          key = d.toLocaleString("default", { month: "short", day: "numeric" });
        }
        trendMap[key] = (trendMap[key] || 0) + amt;
      }
    });

    // Format category breakdown
    const breakdown = Object.keys(catMap).map(name => ({
      name,
      value: catMap[name]
    })).sort((a, b) => b.value - a.value);

    // Format trend data
    let trend = [];
    if (timeframe === "Weekly") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleString("default", { month: "short", day: "numeric" });
        trend.push({
          date: label,
          amount: trendMap[label] || 0
        });
      }
    } else if (timeframe === "Monthly") {
      const sortedKeys = Object.keys(trendMap).sort((a, b) => new Date(a) - new Date(b));
      if (sortedKeys.length > 0) {
        trend = sortedKeys.map(k => ({ date: k, amount: trendMap[k] }));
      } else {
        for (let i = 14; i >= 0; i -= 2) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const label = d.toLocaleString("default", { month: "short", day: "numeric" });
          trend.push({ date: label, amount: 0 });
        }
      }
    } else if (timeframe === "Yearly") {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
        trend.push({
          date: label,
          amount: trendMap[label] || 0
        });
      }
    }

    return {
      trendData: trend,
      breakdownData: breakdown.length > 0 ? breakdown : [{ name: "No Expense", value: 0 }],
      summary: {
        salary: analytics?.summary?.salary || 5000,
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        splitExpenses: { Need: needSpend, Want: wantSpend, Savings: savingsSpend }
      }
    };
  }, [transactions, timeframe, analytics]);

  return (
    <div>
      {/* Header */}
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div className="header-title-sec">
          <h1>Visual Financial Analytics</h1>
          <span className="header-subtitle">
            Deep dive spending dashboards and dynamic timeframe trends.
          </span>
        </div>
        
        {/* Timeframe selector pills */}
        <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", height: "fit-content" }}>
          {["Weekly", "Monthly", "Yearly"].map(tf => {
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: isActive ? "1px solid var(--neon-purple)" : "1px solid transparent",
                  background: isActive ? "rgba(139, 92, 246, 0.2)" : "transparent",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  transition: "all 0.2s ease"
                }}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </header>

      {/* CHARTS CONTAINER GRID */}
      <section className="dashboard-grid">
        {/* Trend Area Chart (Span 2) */}
        <div className="glass-card glow-purple grid-span-2" style={{ height: "400px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ marginBottom: "20px" }}>📈 Daily Expense Trends</h3>
          <div style={{ flexGrow: 1, width: "100%", height: "90%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--neon-purple)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--neon-purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="var(--neon-purple)" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#purpleGlow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Breakdown (Pie) */}
        <div className="glass-card glow-cyan" style={{ height: "400px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ marginBottom: "10px" }}>🏷️ Category Share</h3>
          
          <div style={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Display center stat */}
            <div style={{ 
              position: "absolute", 
              textAlign: "center",
              display: "flex",
              flexDirection: "column"
            }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Spent</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 800 }}>{formatCurrency(summary.totalExpense)}</span>
            </div>
          </div>

          {/* Color Indicators */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "8px", 
            marginTop: "10px",
            maxHeight: "100px",
            overflowY: "auto"
          }}>
            {breakdownData.map((d, i) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
                <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.name}: {formatCurrency(d.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METRIC ANALYSIS CARDS */}
      <section className="dashboard-grid" style={{ marginTop: "24px" }}>
        {/* Net Savings Efficiency */}
        <div className="glass-card glow-emerald">
          <h4 style={{ color: "var(--neon-emerald)", marginBottom: "8px" }}>Savings Margin Ratio</h4>
          <div className="stat-value">{formatCurrency(summary.netSavings)}</div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "8px" }}>
            You are retaining <strong style={{ color: "var(--text-primary)" }}>{((summary.netSavings / (summary.salary || 1)) * 100).toFixed(0)}%</strong> of your monthly gross income.
          </p>
        </div>
 
        {/* Burn Rate Index */}
        <div className="glass-card glow-cyan">
          <h4 style={{ color: "var(--neon-cyan)", marginBottom: "8px" }}>Salary Utilization Index</h4>
          <div className="stat-value">{((summary.totalExpense / (summary.salary || 1)) * 100).toFixed(0)}%</div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "8px" }}>
            You have spent <strong style={{ color: "var(--text-primary)" }}>{formatCurrency(summary.totalExpense)}</strong> of your configured base salary of <strong style={{ color: "var(--text-primary)" }}>{formatCurrency(summary.salary)}</strong>.
          </p>
        </div>

        {/* System Financial Health Verdict */}
        <div className="glass-card glow-purple" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h4 style={{ color: "var(--neon-purple)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Activity size={14} /> System Health Verdict
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5" }}>
              {summary.totalExpense > summary.salary * 0.8 
                ? "⚠️ Warning: Extreme High Burn Rate! You have consumed over 80% of your earnings. Freeze credit card spend!" 
                : "✅ Healthy: Outstanding cash allocation control. Your retention speed is well optimized. SIP investments ready!"
              }
            </p>
          </div>
          <div style={{ marginTop: "12px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Calculations refreshed instantly.
          </div>
        </div>
      </section>
    </div>
  );
}
