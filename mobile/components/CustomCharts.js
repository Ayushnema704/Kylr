import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Curated modern fintech palette matching categories
const COLOR_PALETTE = ["#8B5CF6", "#06B6D4", "#10B981", "#F43F5E", "#F59E0B", "#EC4899", "#3B82F6", "#6B7280"];

// Custom category distribution visual share builder (Matches Donut style from Web)
export function CategoryDistributionChart({ data, formatCurrency, theme }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No spending activity recorded yet.
        </Text>
      </View>
    );
  }

  const total = data.reduce((acc, c) => acc + c.value, 0) || 0;

  return (
    <View style={styles.container}>
      {/* 1. Center Donut Stat Badge */}
      <View style={styles.donutWrapper}>
        <View style={[styles.donutCenter, { borderColor: theme.cardBorder, backgroundColor: theme.background }]}>
          <Feather name="pie-chart" size={16} color={theme.accentPurple} style={{ marginBottom: 4 }} />
          <Text style={[styles.donutSubText, { color: theme.textSecondary }]}>TOTAL SPENT</Text>
          <Text style={[styles.donutValText, { color: theme.textPrimary }]}>{formatCurrency(total)}</Text>
        </View>
      </View>

      {/* 2. Web-style Legend with Color Badges */}
      <Text style={[styles.legendTitle, { color: theme.textSecondary }]}>Ledger Distributions</Text>
      <View style={styles.legendGrid}>
        {data.map((item, idx) => {
          const percentage = ((item.value / (total || 1)) * 100).toFixed(0);
          const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          
          return (
            <View 
              key={item.name} 
              style={[
                styles.legendCard, 
                { 
                  backgroundColor: theme.cardBg, 
                  borderColor: theme.cardBorder,
                  borderLeftColor: color,
                  borderLeftWidth: 4
                }
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <View>
                  <Text style={[styles.legendLabel, { color: theme.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.legendPercent, { color: theme.textSecondary }]}>{percentage}% share</Text>
                </View>
                <Text style={[styles.legendValue, { color: theme.textPrimary }]}>
                  {formatCurrency(item.value)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Custom Daily Spending Area-Glow Trend Chart
export function DailyTrendBarChart({ data, formatCurrency, theme }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No historical trends available.
        </Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map(d => d.amount), 0) || 1;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <View style={styles.barsContainer}>
          {data.map((item, idx) => {
            const barHeightPercent = ((item.amount / maxVal) * 100).toFixed(0);
            
            return (
              <View key={item.date} style={styles.barColumn}>
                {/* Visual Tooltip Badge */}
                <View style={styles.barValWrapper}>
                  <Text style={[styles.barTooltip, { color: theme.textPrimary }]}>
                    {item.amount > 0 ? formatCurrency(item.amount).split('.')[0] : ""}
                  </Text>
                </View>
                
                {/* Glowing Trend Bar resembling Web Recharts Area glow */}
                <View style={[styles.verticalBarOuter, { backgroundColor: theme.cardBorder }]}>
                  <View 
                    style={[
                      styles.verticalBarInner, 
                      { 
                        height: `${Math.max(parseFloat(barHeightPercent), 4)}%`, 
                        backgroundColor: `${theme.accentPurple}2F`, // Translucent gradient background
                        borderTopColor: theme.accentPurple, // Glowing top border
                        borderTopWidth: 2,
                        shadowColor: theme.accentPurple,
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        elevation: 4
                      }
                    ]} 
                  />
                </View>
                
                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>
                  {item.date.split("-")[2] || item.date}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.axisLabelRow}>
        <Text style={[styles.axisLabel, { color: theme.textSecondary }]}>
          Daily expenditures (Last 10 active days)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 10,
  },
  emptyContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "500",
  },
  donutWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
  },
  donutCenter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  donutSubText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  donutValText: {
    fontSize: 15,
    fontWeight: "900",
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 6,
  },
  legendGrid: {
    gap: 8,
  },
  legendCard: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  legendPercent: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  chartWrapper: {
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 5,
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: "100%",
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  barValWrapper: {
    height: 18,
    justifyContent: "center",
    marginBottom: 4,
  },
  barTooltip: {
    fontSize: 8,
    fontWeight: "700",
  },
  verticalBarOuter: {
    width: 14,
    height: "70%",
    borderRadius: 7,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  verticalBarInner: {
    width: "100%",
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 6,
  },
  axisLabelRow: {
    alignItems: "center",
    marginTop: 12,
  },
  axisLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  }
});
