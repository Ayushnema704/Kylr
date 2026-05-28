import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Switch, 
  Alert,
  ActivityIndicator
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";

export default function RemindersScreen({ theme }) {
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

  // Form states
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

  const [formExpanded, setFormExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("Current"); // "Current" or "Upcoming"

  // Date constants
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

  // Sync selectors defaults
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

  const handleCategoryChange = (catName) => {
    setCategory(catName);
    const matched = categories.find(c => c.CategoryName === catName);
    if (matched) {
      setBudgetType(matched.BudgetType);
    }
  };

  const handleDateTextChange = (text) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = cleaned.slice(0, 4) + "-" + cleaned.slice(4);
    }
    if (cleaned.length > 6) {
      formatted = formatted.slice(0, 7) + "-" + formatted.slice(7, 9);
    }
    setStartDate(formatted.slice(0, 10));
  };

  const handleAddRule = async () => {
    if (!title || !amount || isNaN(parseFloat(amount)) || submitting) {
      Alert.alert("Input Error", "Please fill in a valid title and amount.");
      return;
    }

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
        setFormExpanded(false);
        Alert.alert("Success", "Autopay/Reminder rule scheduled successfully!");
      } else {
        Alert.alert("Error", "Failed to schedule recurring deduction.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOffReminder = async (remId, monthStr) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await checkOffReminder(remId, monthStr);
      if (res.success) {
        Alert.alert("Deduction Posted", `Deduction successfully checked off and posted to your ledger for ${monthStr}!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (remId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this recurring schedule? Existing posted transactions will remain unaffected.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await deleteReminder(remId);
          } 
        }
      ]
    );
  };

  const getTotals = (monthStr) => {
    let expected = 0;
    let posted = 0;

    reminders.forEach(r => {
      const start = new Date(r.StartDate);
      const limit = new Date(monthStr + "-31");
      if (start > limit) return;

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

  const currentTotals = getTotals(currentMonthStr);
  const upcomingTotals = getTotals(upcomingMonthStr);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Autopays & Reminders</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Track recurring expenses and log automated deductions</Text>
      </View>

      {/* EXPANDABLE COLLAPSIBLE FORM BUTTON */}
      <TouchableOpacity 
        style={[styles.formTrigger, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
        onPress={() => setFormExpanded(!formExpanded)}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Feather name="plus-circle" size={16} color={theme.accentPurple} />
          <Text style={[styles.formTriggerText, { color: theme.textPrimary }]}>
            {formExpanded ? "Close Deduction Config" : "Configure New Recurring Rule"}
          </Text>
        </View>
        <Feather name={formExpanded ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
      </TouchableOpacity>

      {formExpanded && (
        <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, marginTop: -14, marginBottom: 20 }]}>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Deduction Title</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
              placeholder="e.g. Netflix, Rent, HDFC to Paytm" 
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Amount</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
                placeholder="0.00" 
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Frequency</Text>
              <ScrollView horizontal style={styles.currencySelect}>
                {["Daily", "Weekly", "Monthly", "Yearly"].map(freq => (
                  <TouchableOpacity 
                    key={freq} 
                    style={[
                      styles.currencyPill, 
                      { backgroundColor: frequency === freq ? theme.accentPurple : theme.cardBorder }
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text style={[styles.currencyPillText, { color: frequency === freq ? "#FFFFFF" : theme.textPrimary }]}>{freq}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Day of Month</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
                placeholder="e.g. 10" 
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={deductionDay}
                onChangeText={setDeductionDay}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Flow Type</Text>
              <ScrollView horizontal style={styles.currencySelect}>
                {["Expense", "Transfer"].map(type => (
                  <TouchableOpacity 
                    key={type} 
                    style={[
                      styles.currencyPill, 
                      { backgroundColor: transactionType === type ? theme.accentPurple : theme.cardBorder }
                    ]}
                    onPress={() => setTransactionType(type)}
                  >
                    <Text style={[styles.currencyPillText, { color: transactionType === type ? "#FFFFFF" : theme.textPrimary }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                {transactionType === "Transfer" ? "Source Account" : "Funding Account"}
              </Text>
              <ScrollView horizontal style={styles.currencySelect}>
                {accounts.map(acc => (
                  <TouchableOpacity 
                    key={acc.AccountID} 
                    style={[
                      styles.currencyPill, 
                      { backgroundColor: account === acc.AccountName ? theme.accentPurple : theme.cardBorder }
                    ]}
                    onPress={() => setAccount(acc.AccountName)}
                  >
                    <Text style={[styles.currencyPillText, { color: account === acc.AccountName ? "#FFFFFF" : theme.textPrimary }]}>{acc.AccountName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {transactionType === "Transfer" ? (
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Destination Account</Text>
                <ScrollView horizontal style={styles.currencySelect}>
                  {accounts.filter(acc => acc.AccountName !== account).map(acc => (
                    <TouchableOpacity 
                      key={acc.AccountID} 
                      style={[
                        styles.currencyPill, 
                        { backgroundColor: destinationAccount === acc.AccountName ? theme.accentPurple : theme.cardBorder }
                      ]}
                      onPress={() => setDestinationAccount(acc.AccountName)}
                    >
                      <Text style={[styles.currencyPillText, { color: destinationAccount === acc.AccountName ? "#FFFFFF" : theme.textPrimary }]}>{acc.AccountName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : (
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Category</Text>
                <ScrollView horizontal style={styles.currencySelect}>
                  {categories.map(cat => (
                    <TouchableOpacity 
                      key={cat.CategoryID} 
                      style={[
                        styles.currencyPill, 
                        { backgroundColor: category === cat.CategoryName ? theme.accentPurple : theme.cardBorder }
                      ]}
                      onPress={() => handleCategoryChange(cat.CategoryName)}
                    >
                      <Text style={[styles.currencyPillText, { color: category === cat.CategoryName ? "#FFFFFF" : theme.textPrimary }]}>{cat.CategoryName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Start Date</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
              placeholder="YYYY-MM-DD" 
              placeholderTextColor={theme.textSecondary}
              value={startDate}
              onChangeText={handleDateTextChange}
              maxLength={10}
            />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 10 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Set as Automatic Autopay</Text>
            </View>
            <Switch 
              value={isAutopay} 
              onValueChange={setIsAutopay}
              thumbColor={theme.accentPurple}
              trackColor={{ false: theme.cardBorder, true: theme.accentPurple }}
            />
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accentPurple }]} onPress={handleAddRule} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Add Deduction Rule</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* MONTH TAB SWITCHER */}
      <View style={[styles.tabBar, { borderColor: theme.cardBorder }]}>
        <TouchableOpacity 
          style={[styles.tabButton, { backgroundColor: activeTab === "Current" ? theme.accentPurple : "transparent" }]}
          onPress={() => setActiveTab("Current")}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === "Current" ? "#FFFFFF" : theme.textSecondary }]}>
            {currentMonthLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, { backgroundColor: activeTab === "Upcoming" ? theme.accentPurple : "transparent" }]}
          onPress={() => setActiveTab("Upcoming")}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === "Upcoming" ? "#FFFFFF" : theme.textSecondary }]}>
            {upcomingMonthLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MONTH TOTALS GRID */}
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        <View style={[styles.miniStatCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, marginRight: 8 }]}>
          <Text style={[styles.miniStatTitle, { color: theme.textSecondary }]}>Expected Outflow</Text>
          <Text style={[styles.miniStatValue, { color: theme.textPrimary }]}>
            {formatCurrency(activeTab === "Current" ? currentTotals.expected : upcomingTotals.expected)}
          </Text>
        </View>
        <View style={[styles.miniStatCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, marginLeft: 8 }]}>
          <Text style={[styles.miniStatTitle, { color: theme.textSecondary }]}>Posted Deductions</Text>
          <Text style={[styles.miniStatValue, { color: theme.accentEmerald }]}>
            {formatCurrency(activeTab === "Current" ? currentTotals.posted : upcomingTotals.posted)}
          </Text>
        </View>
      </View>

      {/* REMINDERS LIST BLOCK */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🕒 Deduction Alert Schedules</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, padding: 12 }]}>
        {reminders.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recurring schedules defined. Setup one above!</Text>
        ) : (
          reminders.map(r => {
            const targetMonthStr = activeTab === "Current" ? currentMonthStr : upcomingMonthStr;
            
            // Check start dates
            const ruleStart = new Date(r.StartDate);
            const periodLimit = new Date(targetMonthStr + "-31");
            if (ruleStart > periodLimit) return null;

            const checkedMonths = r.CheckedOffMonths ? String(r.CheckedOffMonths).split(",") : [];
            const isChecked = checkedMonths.includes(targetMonthStr);

            return (
              <View key={r.ReminderID} style={[styles.remItem, { borderBottomColor: theme.cardBorder }]}>
                
                {/* LEFT: Checkbox and Details */}
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <TouchableOpacity 
                    onPress={() => !isChecked && handleCheckOffReminder(r.ReminderID, targetMonthStr)}
                    disabled={isChecked || submitting}
                    style={{ marginRight: 12 }}
                  >
                    <Feather 
                      name={isChecked ? "check-square" : "square"} 
                      size={20} 
                      color={isChecked ? theme.accentEmerald : theme.textSecondary} 
                    />
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                      <Text style={[styles.remTitle, { color: isChecked ? theme.textSecondary : theme.textPrimary, textDecorationLine: isChecked ? "line-through" : "none" }]}>
                        {r.Title}
                      </Text>
                      {(r.IsAutopay === true || r.IsAutopay === "true") && (
                        <View style={styles.miniTag}>
                          <Text style={{ fontSize: 7, fontWeight: "700", color: theme.accentPurple }}>AUTOPAY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 9, color: theme.textSecondary, marginTop: 4 }}>
                      🔁 {r.Frequency} | Day {r.DeductionDay} | 💳 {r.Account} {r.DestinationAccount ? `➜ ${r.DestinationAccount}` : ""}
                    </Text>
                  </View>
                </View>

                {/* RIGHT: Amount and Trash */}
                <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                  <View style={{ alignItems: "flex-end", marginRight: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: isChecked ? theme.accentEmerald : theme.accentRose }}>
                      {isChecked ? "+" : "-"}{formatCurrency(r.Amount)}
                    </Text>
                    <Text style={{ fontSize: 7, color: theme.textSecondary, textTransform: "uppercase" }}>
                      {isChecked ? "Posted" : "Expected"}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => handleDeleteRule(r.ReminderID)}>
                    <Feather name="trash-2" size={14} color={theme.accentRose} style={{ opacity: 0.7 }} />
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 20,
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
  formTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  formTriggerText: {
    fontSize: 12,
    fontWeight: "700",
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: "600",
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
  saveButton: {
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },
  miniStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  miniStatTitle: {
    fontSize: 8,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 30,
    fontWeight: "600",
  },
  remItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  remTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  miniTag: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  }
});
