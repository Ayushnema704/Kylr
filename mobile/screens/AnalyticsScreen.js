import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";
import { CategoryDistributionChart, DailyTrendBarChart } from "../components/CustomCharts";

export default function AnalyticsScreen({ theme }) {
  const { analytics, transactions, formatCurrency } = useData();
  const [timeframe, setTimeframe] = React.useState("Monthly");

  // Compute multi-timeframe analytics dynamically from local ledger transactions
  const { trendData, breakdownData, summary } = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        trendData: analytics?.dailyTrends || [],
        breakdownData: analytics?.categoryBreakdown || [],
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Financial Analytics Center</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Category distributions, active trends, and system alerts</Text>
        
        {/* Timeframe selector pills */}
        <View style={styles.timeframeContainer}>
          {["Weekly", "Monthly", "Yearly"].map(tf => {
            const isActive = timeframe === tf;
            return (
              <TouchableOpacity
                key={tf}
                onPress={() => setTimeframe(tf)}
                style={[
                  styles.timeframePill,
                  { 
                    backgroundColor: isActive ? "rgba(139, 92, 246, 0.2)" : "rgba(255,255,255,0.03)",
                    borderColor: isActive ? theme.accentPurple : "rgba(255,255,255,0.06)"
                  }
                ]}
              >
                <Text style={[styles.timeframeText, { color: isActive ? "#FFFFFF" : theme.textSecondary }]}>
                  {tf}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* CATEGORY DISTRIBUTION CHART */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Expenditure by Category Share</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <CategoryDistributionChart 
          data={breakdownData} 
          formatCurrency={formatCurrency} 
          theme={theme} 
        />
      </View>

      {/* DAILY TREND CHART */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Daily Transaction Activity Logs</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <DailyTrendBarChart 
          data={trendData} 
          formatCurrency={formatCurrency} 
          theme={theme} 
        />
      </View>

      {/* METRIC ANALYSIS CARDS */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 10 }]}>Metric Analysis</Text>

      {/* Savings Margin Ratio */}
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.metricHeader, { color: theme.accentEmerald }]}>Savings Margin Ratio</Text>
        <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{formatCurrency(summary.netSavings)}</Text>
        <Text style={[styles.metricDesc, { color: theme.textSecondary }]}>
          You are retaining <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>{((summary.netSavings / (summary.salary || 1)) * 100).toFixed(0)}%</Text> of your monthly gross income.
        </Text>
      </View>

      {/* Salary Utilization Index */}
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.metricHeader, { color: theme.accentCyan }]}>Salary Utilization Index</Text>
        <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
          {((summary.totalExpense / (summary.salary || 1)) * 100).toFixed(0)}%
        </Text>
        <Text style={[styles.metricDesc, { color: theme.textSecondary }]}>
          You have spent <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>{formatCurrency(summary.totalExpense)}</Text> of your configured base salary of <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>{formatCurrency(summary.salary)}</Text>.
        </Text>
      </View>

      {/* System Financial Health Verdict */}
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Feather name="activity" size={14} color={theme.accentPurple} />
          <Text style={[styles.metricHeader, { color: theme.accentPurple, marginBottom: 0 }]}>System Health Verdict</Text>
        </View>
        <Text style={[styles.metricDesc, { color: theme.textSecondary, lineHeight: 18 }]}>
          {summary.totalExpense > summary.salary * 0.8 
            ? "⚠️ Warning: Extreme High Burn Rate! You have consumed over 80% of your earnings. Freeze credit card spend!" 
            : "✅ Healthy: Outstanding cash allocation control. Your retention speed is well optimized. SIP investments ready!"
          }
        </Text>
        <Text style={{ fontSize: 9, color: theme.textSecondary, opacity: 0.5, marginTop: 12, fontWeight: "600" }}>
          Calculations refreshed instantly.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  metricHeader: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 4,
  },
  metricDesc: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 6,
  },
  timeframeContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  timeframePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: "700",
  }
});
