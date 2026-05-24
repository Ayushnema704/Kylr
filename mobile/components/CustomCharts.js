import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

// Custom category distribution horizontal bar chart
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

  const total = data.reduce((acc, c) => acc + c.value, 0) || 1;

  // Custom colors matching categories
  const colorPalette = ["#8B5CF6", "#10B981", "#06B6D4", "#F59E0B", "#EC4899", "#3B82F6", "#F43F5E", "#14B8A6"];

  return (
    <View style={styles.container}>
      {data.map((item, idx) => {
        const percentage = ((item.value / total) * 100).toFixed(0);
        const color = colorPalette[idx % colorPalette.length];
        
        return (
          <View key={item.name} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={[styles.catName, { color: theme.textPrimary }]}>
                {item.name} ({percentage}%)
              </Text>
              <Text style={[styles.catValue, { color: theme.textPrimary }]}>
                {formatCurrency(item.value)}
              </Text>
            </View>
            <View style={[styles.barOuter, { backgroundColor: theme.cardBorder }]}>
              <View 
                style={[
                  styles.barInner, 
                  { 
                    width: `${Math.max(parseFloat(percentage), 3)}%`, 
                    backgroundColor: color,
                    shadowColor: color,
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 }
                  }
                ]} 
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Custom Daily Spending Vertical Bar Chart
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
                <View style={styles.barValWrapper}>
                  <Text style={[styles.barTooltip, { color: theme.textPrimary, fontSize: 8 }]}>
                    {item.amount > 0 ? formatCurrency(item.amount).split('.')[0] : ""}
                  </Text>
                </View>
                
                <View style={[styles.verticalBarOuter, { backgroundColor: theme.cardBorder }]}>
                  <View 
                    style={[
                      styles.verticalBarInner, 
                      { 
                        height: `${Math.max(parseFloat(barHeightPercent), 4)}%`, 
                        backgroundColor: "var(--neon-purple)" === "var(--neon-purple)" ? "#8B5CF6" : "#A78BFA",
                        shadowColor: "#8B5CF6",
                        shadowOpacity: 0.4,
                        shadowRadius: 5
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
          Showing daily transactions (Last 10 active days)
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
  row: {
    marginBottom: 14,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  catName: {
    fontSize: 12,
    fontWeight: "600",
  },
  catValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  barOuter: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barInner: {
    height: "100%",
    borderRadius: 4,
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
    fontWeight: "600",
  },
  verticalBarOuter: {
    width: 12,
    height: "70%",
    borderRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  verticalBarInner: {
    width: "100%",
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 6,
  },
  axisLabelRow: {
    alignItems: "center",
    marginTop: 10,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: "600",
  }
});
