import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useData, CURRENCY_MAP } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardScreen({ theme }) {
  const { user } = useAuth();
  const { 
    transactions, 
    categories, 
    accounts, 
    analytics, 
    addTransaction, 
    deleteTransaction,
    parseNaturalLanguageExpense,
    convertCurrency,
    formatCurrency,
    loading
  } = useData();

  // Manual transaction state
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [transactionType, setTransactionType] = useState("Expense");
  const [budgetType, setBudgetType] = useState("Want");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [inputCurrency, setInputCurrency] = useState("USD");
  const [submitting, setSubmitting] = useState(false);

  const handleDateChange = (text) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = cleaned.slice(0, 4) + "-" + cleaned.slice(4);
    }
    if (cleaned.length > 6) {
      formatted = formatted.slice(0, 7) + "-" + formatted.slice(7, 9);
    }
    setDate(formatted.slice(0, 10));
  };


  // Sync selectors
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].CategoryName);
    }
    if (accounts.length > 0 && !account) {
      setAccount(accounts[0].AccountName);
    }
    if (user?.currency && !inputCurrency) {
      setInputCurrency(user.currency);
    }
  }, [categories, accounts, user?.currency]);

  // Submit standard transaction
  const handleAddTransaction = async () => {
    if (!amount || isNaN(parseFloat(amount)) || submitting) {
      Alert.alert("Input Error", "Please provide a valid transaction amount.");
      return;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    let transactionDate = date.trim();
    if (transactionDate && !datePattern.test(transactionDate)) {
      Alert.alert("Input Error", "Please provide a valid date in YYYY-MM-DD format (or leave it blank for today's date).");
      return;
    }
    if (!transactionDate) {
      transactionDate = new Date().toISOString().split("T")[0];
    }

    setSubmitting(true);
    try {
      const res = await addTransaction({
        amount: parseFloat(amount),
        note: note || "Manual Log",
        category,
        account,
        transactionType,
        budgetType,
        date: transactionDate,
        inputCurrency
      });

      if (res.success) {
        setAmount("");
        setNote("");
        // Reset selectors and allocations back to their correct defaults after syncing is completed
        if (categories.length > 0) {
          setCategory(categories[0].CategoryName);
          setBudgetType(categories[0].BudgetType);
        }
        if (accounts.length > 0) {
          setAccount(accounts[0].AccountName);
        }
        setTransactionType("Expense");
        setDate(new Date().toISOString().split("T")[0]);
        if (user?.currency) {
          setInputCurrency(user.currency);
        }
        Alert.alert("Success", "Transaction successfully logged!");
      } else {
        Alert.alert("Error", "Could not record transaction. Verify your settings.");
      }
    } catch (err) {
      console.error("Add transaction mobile error: ", err);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };


  const handleCategorySelect = (catName) => {
    setCategory(catName);
    const matched = categories.find(c => c.CategoryName === catName);
    if (matched) {
      setBudgetType(matched.BudgetType);
    }
  };

  const summary = analytics?.summary || {
    salary: user?.salary || 5000,
    rules: { Needs: 50, Wants: 30, Savings: 20 },
    totalIncome: 5000,
    totalExpense: 1745,
    netSavings: 3255,
    splitExpenses: { Need: 1380, Want: 365, Savings: 0 }
  };

  const netSavingsPercent = ((summary.netSavings / (summary.salary || 1)) * 100).toFixed(0);
  const expenseUtilization = ((summary.totalExpense / (summary.salary || 1)) * 100).toFixed(0);

  if (loading && transactions.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accentPurple} />
        <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: 10 }]}>
          Loading financial data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Header section */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.profileName, { color: theme.textPrimary }]}>{user?.displayName || "Aura Investor"}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: "rgba(139, 92, 246, 0.15)", borderColor: "rgba(139, 92, 246, 0.3)" }]}>
          <Text style={[styles.badgeText, { color: theme.accentPurple }]}>✦ AI Sync Active</Text>
        </View>
      </View>

      {/* SCORECARDS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow} contentContainerStyle={{ gap: 15, paddingRight: 20 }}>
        {/* Net flow */}
        <View style={[styles.scoreCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, shadowColor: theme.accentPurple }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <Feather name="trending-up" size={10} color={theme.accentPurple} />
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>NET FLOW</Text>
          </View>
          <Text style={[styles.cardValue, { color: theme.accentPurple }]}>{formatCurrency(summary.netSavings)}</Text>
          <Text style={[styles.cardSubText, { color: theme.textSecondary }]}>{netSavingsPercent}% of monthly base</Text>
        </View>

        {/* Expenses */}
        <View style={[styles.scoreCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, shadowColor: theme.accentRose }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <Feather name="arrow-down-left" size={10} color={theme.accentRose} />
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>EXPENSES</Text>
          </View>
          <Text style={[styles.cardValue, { color: theme.textPrimary }]}>{formatCurrency(summary.totalExpense)}</Text>
          <Text style={[styles.cardSubText, { color: theme.accentRose }]}>{expenseUtilization}% utilization</Text>
        </View>

        {/* Monthly target */}
        <View style={[styles.scoreCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, shadowColor: theme.accentEmerald }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <Feather name="dollar-sign" size={10} color={theme.accentEmerald} />
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>BASE TARGET</Text>
          </View>
          <Text style={[styles.cardValue, { color: theme.accentEmerald }]}>{formatCurrency(summary.salary)}</Text>
          <Text style={[styles.cardSubText, { color: theme.textSecondary }]}>Configured in settings</Text>
        </View>
      </ScrollView>

      {/* 50-30-20 METERS */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>50-30-20 Budget Health</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        
        {/* Needs meter */}
        <View style={styles.meter}>
          <View style={styles.meterHeader}>
            <Text style={[styles.meterLabel, { color: theme.accentEmerald }]}>Needs ({summary.rules.Needs}%)</Text>
            <Text style={[styles.meterValue, { color: theme.textSecondary }]}>
              {formatCurrency(summary.splitExpenses.Need)} / {formatCurrency(summary.salary * summary.rules.Needs / 100)}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((summary.splitExpenses.Need / (summary.salary * summary.rules.Needs / 100)) * 100, 100)}%`, 
                  backgroundColor: theme.accentEmerald 
                }
              ]} 
            />
          </View>
        </View>

        {/* Wants meter */}
        <View style={styles.meter}>
          <View style={styles.meterHeader}>
            <Text style={[styles.meterLabel, { color: theme.accentCyan }]}>Wants ({summary.rules.Wants}%)</Text>
            <Text style={[styles.meterValue, { color: theme.textSecondary }]}>
              {formatCurrency(summary.splitExpenses.Want)} / {formatCurrency(summary.salary * summary.rules.Wants / 100)}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((summary.splitExpenses.Want / (summary.salary * summary.rules.Wants / 100)) * 100, 100)}%`, 
                  backgroundColor: theme.accentCyan 
                }
              ]} 
            />
          </View>
        </View>

        {/* Savings meter */}
        <View style={styles.meter}>
          <View style={styles.meterHeader}>
            <Text style={[styles.meterLabel, { color: theme.accentPurple }]}>Savings ({summary.rules.Savings}%)</Text>
            <Text style={[styles.meterValue, { color: theme.textSecondary }]}>
              {formatCurrency(summary.splitExpenses.Savings)} / {formatCurrency(summary.salary * summary.rules.Savings / 100)}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((summary.splitExpenses.Savings / (summary.salary * summary.rules.Savings / 100)) * 100, 100)}%`, 
                  backgroundColor: theme.accentPurple 
                }
              ]} 
            />
          </View>
        </View>
      </View>


      {/* MANUAL LEDGER FORM */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>📝 Manual Ledger Entry</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        
        {/* Amount & Input Currency */}
        <View style={styles.formRow}>
          <View style={{ flex: 2 }}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Amount</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary, opacity: submitting ? 0.7 : 1 }]} 
              placeholder="0.00" 
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={!submitting}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Currency</Text>
            <ScrollView horizontal style={styles.currencySelect}>
              {Object.keys(CURRENCY_MAP).map(code => (
                <TouchableOpacity 
                  key={code} 
                  style={[
                    styles.currencyPill, 
                    { 
                      backgroundColor: inputCurrency === code ? theme.accentPurple : theme.cardBorder,
                      opacity: submitting ? 0.6 : 1
                    }
                  ]}
                  onPress={() => setInputCurrency(code)}
                  disabled={submitting}
                >
                  <Text style={[styles.currencyPillText, { color: inputCurrency === code ? "#FFFFFF" : theme.textPrimary }]}>{code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Real-time conversion preview */}
        {amount && !isNaN(parseFloat(amount)) && inputCurrency !== (user?.currency || "USD") && (
          <View style={[styles.previewBox, { borderColor: theme.accentPurple, backgroundColor: "rgba(139, 92, 246, 0.05)" }]}>
            <Text style={{ color: theme.accentPurple, fontSize: 11, fontWeight: "600" }}>
              Portfolio Equivalent: {CURRENCY_MAP[inputCurrency]?.symbol}{parseFloat(amount).toFixed(2)} {inputCurrency} ≈ {formatCurrency(convertCurrency(parseFloat(amount), inputCurrency, user?.currency || "USD"))}
            </Text>
          </View>
        )}

        {/* Note */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Description</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary, opacity: submitting ? 0.7 : 1 }]} 
            placeholder="e.g. Nvidia Stock SIP" 
            placeholderTextColor={theme.textSecondary}
            value={note}
            onChangeText={setNote}
            editable={!submitting}
          />
        </View>

        {/* Flow & Source selector */}
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Flow Type</Text>
            <View style={styles.selectorRow}>
              {["Expense", "Income"].map(t => (
                <TouchableOpacity 
                  key={t} 
                  style={[styles.flowPill, { backgroundColor: transactionType === t ? theme.accentPurple : theme.cardBorder, opacity: submitting ? 0.6 : 1 }]}
                  onPress={() => setTransactionType(t)}
                  disabled={submitting}
                >
                  <Text style={[styles.flowPillText, { color: transactionType === t ? "#FFFFFF" : theme.textPrimary }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat.CategoryID} 
                  style={[styles.catPill, { backgroundColor: category === cat.CategoryName ? theme.accentPurple : theme.cardBorder, opacity: submitting ? 0.6 : 1 }]}
                  onPress={() => handleCategorySelect(cat.CategoryName)}
                  disabled={submitting}
                >
                  <Text style={[styles.catPillText, { color: category === cat.CategoryName ? "#FFFFFF" : theme.textPrimary }]}>{cat.CategoryName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Funding Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
              {accounts.map(acc => (
                <TouchableOpacity 
                  key={acc.AccountID} 
                  style={[styles.catPill, { backgroundColor: account === acc.AccountName ? theme.accentPurple : theme.cardBorder, opacity: submitting ? 0.6 : 1 }]}
                  onPress={() => setAccount(acc.AccountName)}
                  disabled={submitting}
                >
                  <Text style={[styles.catPillText, { color: account === acc.AccountName ? "#FFFFFF" : theme.textPrimary }]}>{acc.AccountName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Transaction Date</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary, opacity: submitting ? 0.7 : 1 }]} 
              placeholder="YYYY-MM-DD" 
              placeholderTextColor={theme.textSecondary}
              value={date}
              onChangeText={handleDateChange}
              maxLength={10}
              editable={!submitting}
            />
          </View>
        </View>

        {/* Budget Allocation pills */}
        <Text style={[styles.formLabel, { color: theme.textSecondary, marginTop: 10 }]}>Budget Tag Allocation</Text>
        <View style={styles.budgetGrid}>
          {[
            { label: "Needs", value: "Need", color: theme.accentEmerald, bg: "rgba(16, 185, 129, 0.12)" },
            { label: "Wants", value: "Want", color: theme.accentCyan, bg: "rgba(6, 182, 212, 0.12)" },
            { label: "Savings", value: "Savings", color: theme.accentPurple, bg: "rgba(139, 92, 246, 0.12)" }
          ].map(tag => (
            <TouchableOpacity 
              key={tag.value} 
              style={[
                styles.budgetPill, 
                { 
                  backgroundColor: budgetType === tag.value ? tag.bg : theme.cardBorder,
                  borderColor: budgetType === tag.value ? tag.color : "transparent",
                  opacity: submitting ? 0.6 : 1
                }
              ]}
              onPress={() => setBudgetType(tag.value)}
              disabled={submitting}
            >
              <Text style={[styles.budgetPillText, { color: budgetType === tag.value ? tag.color : theme.textSecondary }]}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.accentPurple, opacity: submitting ? 0.7 : 1 }]} 
          onPress={handleAddTransaction}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>+ Add Transaction Record</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* RECENT TRANSACTION ACTIVITIES */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🕒 Recent Transactions Activity</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        {transactions.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No ledger logs recorded. Add some expenses above!</Text>
        ) : (
          transactions.map(txn => {
            const cat = categories.find(c => c.CategoryName === txn.Category);
            const dotColor = cat ? cat.Color : theme.accentCyan;

            return (
              <View key={txn.TransactionID} style={[styles.txnItem, { borderBottomColor: theme.cardBorder }]}>
                <View style={styles.txnLeft}>
                  <View style={[styles.dotPill, { backgroundColor: dotColor }]} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={[styles.txnTitle, { color: theme.textPrimary }]} numberOfLines={1}>{txn.Note}</Text>
                    <View style={{ flexDirection: "row", gap: 5, marginTop: 4, alignItems: "center" }}>
                      <Text style={[styles.txnMeta, { color: theme.textSecondary }]}>{txn.Category}</Text>
                      <View style={[styles.smallTag, { backgroundColor: theme.cardBorder }]}>
                        <Text style={{ fontSize: 8, fontWeight: "600", color: theme.textSecondary }}>
                          {txn.BudgetType === "Need" ? "Needs" : txn.BudgetType === "Want" ? "Wants" : "Savings"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
                  <Text style={[styles.txnAmount, { color: txn.TransactionType === "Income" ? theme.accentEmerald : theme.accentRose }]}>
                    {txn.TransactionType === "Income" ? "+" : "-"}{formatCurrency(txn.Amount)}
                  </Text>
                  <TouchableOpacity onPress={() => deleteTransaction(txn.TransactionID)} style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 10, color: theme.accentRose, fontWeight: "700" }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600"
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardRow: {
    marginBottom: 20,
  },
  scoreCard: {
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "800",
    marginVertical: 6,
  },
  cardSubText: {
    fontSize: 9,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 10,
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  meter: {
    marginBottom: 14,
  },
  meterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  meterValue: {
    fontSize: 10,
    fontWeight: "600",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  infoText: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 10,
  },
  nlpRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  nlpButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  nlpButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
  },
  currencySelect: {
    flexDirection: "row",
    height: 38,
  },
  currencyPill: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  currencyPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  previewBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: "row",
    gap: 8,
  },
  flowPill: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginRight: 8,
  },
  flowPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  catPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 6,
  },
  catPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  budgetGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 16,
  },
  budgetPill: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  budgetPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  submitButton: {
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 20,
  },
  txnItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txnLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dotPill: {
    width: 6,
    height: 24,
    borderRadius: 3,
  },
  txnTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  txnMeta: {
    fontSize: 10,
    fontWeight: "600",
  },
  smallTag: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  txnAmount: {
    fontSize: 13,
    fontWeight: "800",
  }
});
