import React, { useState } from "react";
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
import { useAuth } from "../contexts/AuthContext";
import { useData, CURRENCY_MAP } from "../contexts/DataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen({ theme, activeThemeName, toggleTheme }) {
  const { user, setUser, isSandbox, toggleSystemMode } = useAuth();
  const { 
    appsScriptUrl, 
    geminiApiKey, 
    updateBackendConfig, 
    exchangeRates, 
    formatCurrency,
    refreshData 
  } = useData();

  // Profile forms
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [salary, setSalary] = useState(user?.salary?.toString() || "5000");
  const [activeCurrency, setActiveCurrency] = useState(user?.currency || "USD");
  
  // Percentages splits
  const [needs, setNeeds] = useState(user?.needsPercentage?.toString() || "50");
  const [wants, setWants] = useState(user?.wantsPercentage?.toString() || "30");
  const [savings, setSavings] = useState(user?.savingsPercentage?.toString() || "20");

  // Integration forms
  const [scriptUrl, setScriptUrl] = useState(appsScriptUrl);
  const [apiKey, setApiKey] = useState(geminiApiKey);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Save profile changes
  const handleSaveProfile = async () => {
    const n = parseInt(needs) || 0;
    const w = parseInt(wants) || 0;
    const s = parseInt(savings) || 0;

    if (n + w + s !== 100) {
      Alert.alert("Input Split Error", "Your budget percentages must add up to exactly 100% (e.g. 50 + 30 + 20).");
      return;
    }

    setSavingProfile(true);
    const prevCurrency = user?.currency || "USD";
    const updatedUser = {
      ...user,
      displayName,
      salary: parseFloat(salary) || 5000,
      currency: activeCurrency,
      needsPercentage: n,
      wantsPercentage: w,
      savingsPercentage: s
    };

    // Scale database items on base currency changes
    if (activeCurrency !== prevCurrency) {
      const scaleRate = exchangeRates[activeCurrency] / exchangeRates[prevCurrency];
      
      // Update local storage items if in Sandbox
      if (isSandbox) {
        try {
          const localTxns = await AsyncStorage.getItem("kylr_txns");
          const localAccs = await AsyncStorage.getItem("kylr_accounts");

          if (localTxns) {
            const txs = JSON.parse(localTxns);
            const scaledTxs = txs.map(t => ({
              ...t,
              Amount: parseFloat((t.Amount * scaleRate).toFixed(2))
            }));
            await AsyncStorage.setItem("kylr_txns", JSON.stringify(scaledTxs));
          }

          if (localAccs) {
            const accs = JSON.parse(localAccs);
            const scaledAccs = accs.map(a => ({
              ...a,
              CurrentBalance: parseFloat((a.CurrentBalance * scaleRate).toFixed(2)),
              CreditLimit: parseFloat((a.CreditLimit * scaleRate).toFixed(2))
            }));
            await AsyncStorage.setItem("kylr_accounts", JSON.stringify(scaledAccs));
          }
        } catch (e) {
          console.warn("Could not scale database elements:", e);
        }
      }
    }

    await setUser(updatedUser);
    await refreshData();
    setSavingProfile(false);
    Alert.alert("Success", "User profile and budget allocations successfully updated!");
  };

  // Save backend credentials
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    await updateBackendConfig(scriptUrl, apiKey);
    await refreshData();
    setSavingConfig(false);
    Alert.alert("Success", "Integration credentials synchronized!");
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>App Configurations</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage accounts, database syncing, and aesthetics</Text>
      </View>

      {/* THEME SELECTOR SWITCH */}
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
        <View>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Aesthetic Theme Style</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Active: {activeThemeName === "dark" ? "Cyberpunk Neon (Dark)" : "Espresso Latte (Light)"}
          </Text>
        </View>
        <Switch 
          value={activeThemeName === "light"} 
          onValueChange={toggleTheme}
          thumbColor={theme.accentPurple}
          trackColor={{ false: theme.cardBorder, true: theme.accentPurple }}
        />
      </View>

      {/* USER PROFILE CARD */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>👤 Profile & Budget Rules</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Display Name</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
            placeholder="Aura Investor" 
            placeholderTextColor={theme.textSecondary}
            value={displayName}
            onChangeText={setDisplayName}
          />
        </View>

        <View style={styles.formRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Base Income</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
              placeholder="5000" 
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={salary}
              onChangeText={setSalary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Base Currency</Text>
            <ScrollView horizontal style={styles.currencySelect}>
              {Object.keys(CURRENCY_MAP).map(code => (
                <TouchableOpacity 
                  key={code} 
                  style={[
                    styles.currencyPill, 
                    { backgroundColor: activeCurrency === code ? theme.accentPurple : theme.cardBorder }
                  ]}
                  onPress={() => setActiveCurrency(code)}
                >
                  <Text style={[styles.currencyPillText, { color: activeCurrency === code ? "#FFFFFF" : theme.textPrimary }]}>{code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <Text style={[styles.formLabel, { color: theme.textSecondary, marginTop: 10 }]}>50-30-20 Rules Ratio splits (%)</Text>
        <View style={styles.formRow}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Text style={[styles.miniLabel, { color: theme.accentEmerald }]}>Needs</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
              keyboardType="numeric"
              value={needs}
              onChangeText={setNeeds}
            />
          </View>
          <View style={{ flex: 1, marginHorizontal: 5 }}>
            <Text style={[styles.miniLabel, { color: theme.accentCyan }]}>Wants</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
              keyboardType="numeric"
              value={wants}
              onChangeText={setWants}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Text style={[styles.miniLabel, { color: theme.accentPurple }]}>Savings</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
              keyboardType="numeric"
              value={savings}
              onChangeText={setSavings}
            />
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accentPurple }]} onPress={handleSaveProfile}>
          {savingProfile ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile Configurations</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* LIVE EXCHANGE RATES MATRIX */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>📈 Live Exchange Network</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary, marginBottom: 14 }]}>
          Relative to: 1 {activeCurrency} ({CURRENCY_MAP[activeCurrency]?.name})
        </Text>
        
        {Object.keys(CURRENCY_MAP).map(code => {
          if (code === activeCurrency) return null;
          
          // Calculate rate relative to activeCurrency
          const portfolioRate = exchangeRates[activeCurrency] || 1;
          const targetRate = exchangeRates[code] || 1;
          const relativeRate = (targetRate / portfolioRate).toFixed(4);
          
          const portfolioSymbol = CURRENCY_MAP[activeCurrency]?.symbol || "";
          const targetSymbol = CURRENCY_MAP[code]?.symbol || "";

          return (
            <View key={code} style={[styles.rateRow, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.rateCode, { color: theme.textPrimary }]}>{code}</Text>
              <Text style={[styles.rateValue, { color: theme.textPrimary }]}>
                {portfolioSymbol}1 = {targetSymbol}{relativeRate}
              </Text>
            </View>
          );
        })}
      </View>

      {/* SYSTEM BACKEND SYNC */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🔌 Backend Sync Settings</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        
        {/* Sandbox toggle */}
        <View style={styles.sandboxRow}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Offline Local Sandbox Mode</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Stores your data locally in the vault sandbox
            </Text>
          </View>
          <Switch 
            value={isSandbox} 
            onValueChange={(val) => {
              toggleSystemMode(val ? "sandbox" : "production");
              refreshData();
              Alert.alert("System Mode Swapped", val ? "Switched to Local Sandbox." : "Switched to Live Production Sheets.");
            }}
            thumbColor={theme.accentPurple}
            trackColor={{ false: theme.cardBorder, true: theme.accentPurple }}
          />
        </View>

        {!isSandbox && (
          <View style={{ marginTop: 15 }}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Google Apps Script Web App URL</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
                placeholder="https://script.google.com/macros/s/.../exec" 
                placeholderTextColor={theme.textSecondary}
                value={scriptUrl}
                onChangeText={setScriptUrl}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Gemini AI API Key</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.cardBorder, color: theme.textPrimary }]} 
                placeholder="AIzaSy..." 
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={true}
                value={apiKey}
                onChangeText={setApiKey}
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accentPurple }]} onPress={handleSaveConfig}>
              {savingConfig ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Synchronize API Credentials</Text>
              )}
            </TouchableOpacity>
          </View>
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
    marginTop: 10,
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
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
    height: 40,
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
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rateCode: {
    fontSize: 12,
    fontWeight: "700",
  },
  rateValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  sandboxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  }
});
