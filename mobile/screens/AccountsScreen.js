import React, { useMemo } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";

export default function AccountsScreen({ theme }) {
  const { accounts, formatCurrency } = useData();

  // Memoize vault balance aggregations to prevent unnecessary recalculations on re-renders
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

  // Custom bank card themes matching web
  const getCardTheme = (name) => {
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Vault Asset Sources</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Debit cards, credit limits, and wallets</Text>
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
        const cardTheme = getCardTheme(acc.AccountName);
        const limitVal = parseFloat(acc.CreditLimit) || 0;
        const balanceVal = parseFloat(acc.CurrentBalance);
        
        return (
          <View key={acc.AccountID} style={styles.cardContainer}>
            {/* Real Visual Card */}
            <View style={[styles.bankCard, { backgroundColor: cardTheme.bg }]}>
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
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
  }
});
