import React, { useMemo } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useData } from "../contexts/DataContext";

export default function CategoriesScreen({ theme }) {
  const { categories, transactions, formatCurrency } = useData();

  // Memoize aggregated metrics to optimize rendering performance from O(N*M) to O(N+M)
  const { spentMap, totalExpense } = useMemo(() => {
    const map = {};
    let total = 0;
    transactions.forEach(t => {
      if (t.TransactionType === "Expense") {
        const amt = parseFloat(t.Amount) || 0;
        map[t.Category] = (map[t.Category] || 0) + amt;
        total += amt;
      }
    });
    return { spentMap: map, totalExpense: total || 1 };
  }, [transactions]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Category Allocator</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage transaction categories and allocation rules</Text>
      </View>

      {/* CATEGORIES LIST */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Active Ledger Categories</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        {categories.map(cat => {
          const spent = spentMap[cat.CategoryName] || 0;
          const percent = ((spent / totalExpense) * 100).toFixed(0);
          
          return (
            <View key={cat.CategoryID} style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
              <View style={styles.rowLeft}>
                {/* Visual Icon Badge */}
                <View 
                  style={[
                    styles.iconCircle, 
                    { 
                      backgroundColor: `${cat.Color}1F`, // Translucent background
                      borderColor: `${cat.Color}3A` 
                    }
                  ]}
                >
                  <View style={[styles.innerCircle, { backgroundColor: cat.Color }]} />
                </View>
                
                <View style={{ marginLeft: 14 }}>
                  <Text style={[styles.catName, { color: theme.textPrimary }]}>{cat.CategoryName}</Text>
                  
                  {/* Budget Allocation Pill */}
                  <View style={[styles.pill, { backgroundColor: theme.cardBorder, marginTop: 4 }]}>
                    <Text style={[styles.pillText, { color: theme.textSecondary }]}>
                      {cat.BudgetType === "Need" ? "Needs" : cat.BudgetType === "Want" ? "Wants" : "Savings"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.catSpent, { color: theme.textPrimary }]}>{formatCurrency(spent)}</Text>
                <Text style={[styles.catPercent, { color: theme.textSecondary }]}>{percent}% of total expenses</Text>
              </View>
            </View>
          );
        })}
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
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    fontSize: 13,
    fontWeight: "700",
  },
  pill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 8,
    fontWeight: "700",
  },
  catSpent: {
    fontSize: 13,
    fontWeight: "800",
  },
  catPercent: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 4,
  }
});
