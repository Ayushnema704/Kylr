import React, { useMemo, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";

export default function AccountsScreen({ theme }) {
  const { accounts, addAccount, deleteAccount, formatCurrency } = useData();

  // Modal and Form states
  const [modalVisible, setModalVisible] = useState(false);
  const [accountType, setAccountType] = useState("Bank Account");
  const [accountName, setAccountName] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [bankName, setBankName] = useState("");
  const [cardLast4Digits, setCardLast4Digits] = useState("");
  
  // High-End Fintech color palette swatches
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

  // Memoize vault balance aggregations to optimize rendering
  const { totalAssets, totalLiabilities, netWealth } = useMemo(() => {
    const assets = accounts
      .filter(a => a.AccountType !== "Credit Card")
      .reduce((acc, a) => acc + parseFloat(a.CurrentBalance), 0);

    const liabilities = accounts
      .filter(a => a.AccountType === "Credit Card")
      .reduce((acc, a) => acc + Math.abs(parseFloat(a.CurrentBalance)), 0);

    return {
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWealth: assets - liabilities
    };
  }, [accounts]);

  // Handle addition of new account source
  const handleAddAccountSubmit = async () => {
    if (!accountName.trim()) {
      Alert.alert("Input Error", "Please provide a display name for the account.");
      return;
    }
    if (!currentBalance || isNaN(parseFloat(currentBalance))) {
      Alert.alert("Input Error", "Please provide a valid numeric balance.");
      return;
    }

    setSubmitting(true);
    const res = await addAccount({
      accountType,
      accountName: accountName.trim(),
      currentBalance: parseFloat(currentBalance) || 0,
      creditLimit: parseFloat(creditLimit) || 0,
      bankName: bankName.trim() || "Generic",
      cardLast4Digits: cardLast4Digits || "0000",
      color: selectedColor
    });
    setSubmitting(false);

    if (res.success) {
      setAccountName("");
      setBankName("");
      setCurrentBalance("");
      setCreditLimit("");
      setCardLast4Digits("");
      setSelectedColor(CARD_PALETTE[0]);
      setModalVisible(false);
      Alert.alert("Success", "Financial account added and synchronized!");
    } else {
      Alert.alert("Sync Error", "Could not synchronize new account. Verify your settings.");
    }
  };

  // Handle removal of financial source
  const handleDeleteAccount = (accId) => {
    Alert.alert(
      "Confirm Action",
      "Are you sure you want to remove this financial source? All balance metrics will re-aggregate.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove Asset", 
          style: "destructive",
          onPress: async () => {
            const res = await deleteAccount(accId);
            if (!res.success) {
              Alert.alert("Sync Error", "Could not remove card from Sheets.");
            }
          }
        }
      ]
    );
  };

  // Custom bank card themes matching web card custom colors
  const getCardTheme = (acc) => {
    const customColor = acc.Color || acc.color;
    if (customColor) {
      return {
        bg: customColor,
        brand: acc.AccountType === "Credit Card" ? "KYLR POSTPAID" : "KYLR LIQUID",
        chip: "#FFFFFF",
        textColor: "#FFFFFF",
        subColor: "rgba(255, 255, 255, 0.75)"
      };
    }

    const name = acc.AccountName || "";
    const n = name.toLowerCase();
    if (n.includes("hdfc")) {
      return {
        bg: "#0B1D3A",
        brand: "KYLR DEBIT",
        chip: "#E2B13C",
        textColor: "#FFFFFF",
        subColor: "#94A3B8"
      };
    } else if (n.includes("icici") || n.includes("amazon")) {
      return {
        bg: "#2A2A2E",
        brand: "KYLR ELITE",
        chip: "#F59E0B",
        textColor: "#FFFFFF",
        subColor: "#A1A1AA"
      };
    } else if (n.includes("paytm") || n.includes("wallet")) {
      return {
        bg: "#00B9F5",
        brand: "KYLR WALLET",
        chip: "#FFFFFF",
        textColor: "#FFFFFF",
        subColor: "#E0F2FE"
      };
    }
    return {
      bg: "#4B5563",
      brand: "KYLR CARD",
      chip: "#D1D5DB",
      textColor: "#FFFFFF",
      subColor: "#E5E7EB"
    };
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Vault Asset Sources</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Debit cards, credit limits, and wallets</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setModalVisible(true)} 
            style={[styles.addVaultBtn, { backgroundColor: theme.accentPurple }]}
          >
            <Feather name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.addVaultBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BALANCE SCORECARD */}
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>NET VAULT LIQUID BALANCE</Text>
        <Text style={[styles.mainWealth, { color: theme.textPrimary }]}>{formatCurrency(netWealth)}</Text>
        
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Debit Assets</Text>
            <Text style={[styles.statValue, { color: theme.accentEmerald }]}>{formatCurrency(totalAssets)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Credit Liabilities</Text>
            <Text style={[styles.statValue, { color: theme.accentRose }]}>-{formatCurrency(totalLiabilities)}</Text>
          </View>
        </View>
      </View>

      {/* CARDS LIST SECTION */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Physical & Virtual Cards</Text>
      {accounts.map(acc => {
        const cardTheme = getCardTheme(acc);
        const limitVal = parseFloat(acc.CreditLimit) || 0;
        const balanceVal = parseFloat(acc.CurrentBalance);
        
        return (
          <View key={acc.AccountID} style={styles.cardContainer}>
            {/* Real Visual Card */}
            <View 
              style={[
                styles.bankCard, 
                { 
                  backgroundColor: cardTheme.bg,
                  shadowColor: cardTheme.bg
                }
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.cardChip, { backgroundColor: cardTheme.chip }]} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Feather name="wifi" size={12} color={cardTheme.textColor} style={{ transform: [{ rotate: "90deg" }] }} />
                  <Text style={[styles.cardBrand, { color: cardTheme.textColor }]}>{cardTheme.brand}</Text>
                </View>
              </View>

              <Text style={[styles.cardNumber, { color: cardTheme.textColor }]}>
                ••••  ••••  ••••  {acc.CardLast4Digits || "0000"}
              </Text>

              <View style={styles.cardBottom}>
                <View>
                  <Text style={[styles.cardLabelText, { color: cardTheme.subColor }]}>ACCOUNT SOURCE</Text>
                  <Text style={[styles.cardHolder, { color: cardTheme.textColor }]}>{acc.AccountName}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.cardLabelText, { color: cardTheme.subColor }]}>BALANCE</Text>
                  <Text style={[styles.cardBalance, { color: cardTheme.textColor }]}>
                    {formatCurrency(balanceVal)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Additional details & delete action strip */}
            <View style={[styles.cardActionRow, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionRowText, { color: theme.textSecondary }]}>
                  🏦 {acc.BankName || "Generic Wallet"}
                  {acc.AccountType === "Credit Card" && ` | limit: ${formatCurrency(limitVal)}`}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleDeleteAccount(acc.AccountID)} 
                style={styles.deleteBtn}
              >
                <Feather name="trash-2" size={13} color={theme.accentRose} />
                <Text style={[styles.deleteBtnText, { color: theme.accentRose }]}>Remove</Text>
              </TouchableOpacity>
            </View>

            {/* Credit Card Utilization Bar */}
            {acc.AccountType === "Credit Card" && limitVal > 0 && (
              <View style={[styles.limitProgressBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <View style={styles.limitHeader}>
                  <Text style={[styles.limitLabel, { color: theme.textSecondary }]}>Credit Limit Utilization</Text>
                  <Text style={[styles.limitValue, { color: theme.textPrimary }]}>
                    {formatCurrency(Math.abs(balanceVal))} / {formatCurrency(limitVal)}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min((Math.abs(balanceVal) / limitVal) * 100, 100)}%`, 
                        backgroundColor: theme.accentRose 
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* CREATE ACCOUNT DIALOG MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ width: "100%", maxHeight: "88%" }}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>⚡ Register Financial Vault</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll}>
                
                {/* Account Type Selector */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>Account Type</Text>
                <View style={styles.pickerRow}>
                  {["Bank Account", "Credit Card", "Wallet"].map(type => {
                    const isSelected = accountType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setAccountType(type)}
                        style={[
                          styles.pickerPill,
                          { 
                            backgroundColor: isSelected ? theme.accentPurple : "rgba(255,255,255,0.05)",
                            borderColor: isSelected ? theme.accentPurple : theme.cardBorder
                          }
                        ]}
                      >
                        <Text style={[styles.pickerPillText, { color: isSelected ? "#FFFFFF" : theme.textSecondary }]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Display Name Input */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>Account Display Name</Text>
                <TextInput
                  placeholder="e.g. HDFC Salary Account"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: "rgba(0,0,0,0.15)" }]}
                  value={accountName}
                  onChangeText={setAccountName}
                />

                {/* Balance & Optional Limits */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  {accountType === "Credit Card" ? "Owed Balance" : "Opening Balance"}
                </Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="numeric"
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: "rgba(0,0,0,0.15)" }]}
                  value={currentBalance}
                  onChangeText={setCurrentBalance}
                />

                {accountType === "Credit Card" && (
                  <>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Maximum Credit Limit</Text>
                    <TextInput
                      placeholder="5000"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="numeric"
                      style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: "rgba(0,0,0,0.15)" }]}
                      value={creditLimit}
                      onChangeText={setCreditLimit}
                    />
                  </>
                )}

                {/* Custom Bank Name and Last 4 digits */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Institution / Bank</Text>
                    <TextInput
                      placeholder="e.g. Chase"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: "rgba(0,0,0,0.15)" }]}
                      value={bankName}
                      onChangeText={setBankName}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Last 4 Digits</Text>
                    <TextInput
                      placeholder="4920"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      maxLength={4}
                      keyboardType="numeric"
                      style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: "rgba(0,0,0,0.15)" }]}
                      value={cardLast4Digits}
                      onChangeText={setCardLast4Digits}
                    />
                  </View>
                </View>

                {/* Color swatch personalization */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>Personalize Card Theme</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }} contentContainerStyle={{ gap: 10, paddingRight: 10 }}>
                  {CARD_PALETTE.map(col => {
                    const isActive = selectedColor === col;
                    return (
                      <TouchableOpacity
                        key={col}
                        onPress={() => setSelectedColor(col)}
                        style={[
                          styles.colorSwatch,
                          {
                            backgroundColor: col,
                            borderColor: isActive ? "#FFFFFF" : "rgba(255,255,255,0.15)",
                            borderWidth: isActive ? 2 : 1,
                            transform: isActive ? [{ scale: 1.1 }] : [{ scale: 1 }]
                          }
                        ]}
                      />
                    );
                  })}
                </ScrollView>

                {/* Submitting/Sync indicator button */}
                <TouchableOpacity
                  onPress={handleAddAccountSubmit}
                  disabled={submitting}
                  style={[
                    styles.submitBtn,
                    { 
                      backgroundColor: theme.accentPurple,
                      opacity: submitting ? 0.6 : 1,
                      marginTop: 10
                    }
                  ]}
                >
                  <Text style={styles.submitBtnText}>
                    {submitting ? "Syncing banking vaults..." : "Register Vault Asset"}
                  </Text>
                </TouchableOpacity>

              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  mainWealth: {
    fontSize: 26,
    fontWeight: "800",
    marginVertical: 10,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: 14,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
  },
  cardContainer: {
    marginBottom: 20,
  },
  bankCard: {
    height: 160,
    borderRadius: 18,
    padding: 20,
    justifyContent: "space-between",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardChip: {
    width: 30,
    height: 22,
    borderRadius: 4,
  },
  cardBrand: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    opacity: 0.9,
  },
  cardNumber: {
    fontSize: 15,
    letterSpacing: 2,
    fontWeight: "700",
    opacity: 0.9,
    fontFamily: "Courier",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardLabelText: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardHolder: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardBalance: {
    fontSize: 15,
    fontWeight: "800",
  },
  limitProgressBox: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 14,
    marginTop: -8,
    zIndex: -1,
    paddingTop: 18,
  },
  limitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  limitLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  limitValue: {
    fontSize: 10,
    fontWeight: "800",
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    width: "100%",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalScroll: {
    gap: 12,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  pickerPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 12,
    marginTop: -8,
    zIndex: -1,
    paddingTop: 16,
  },
  actionRowText: {
    fontSize: 9,
    fontWeight: "700",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 9,
    fontWeight: "800",
  },
  addVaultBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addVaultBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  }
});
