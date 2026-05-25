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
  Platform,
  ActivityIndicator
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";

// HSL curated fintech palette
const FINTECH_PALETTE = [
  "#F43F5E", // Rose
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#06B6D4", // Cyan
  "#6B7280"  // Gray
];

const ICON_OPTIONS = [
  { name: "Home", icon: "home" },
  { name: "ShoppingBag", icon: "shopping-bag" },
  { name: "Zap", icon: "zap" },
  { name: "Utensils", icon: "coffee" },
  { name: "CreditCard", icon: "credit-card" },
  { name: "Tv", icon: "tv" },
  { name: "Tag", icon: "tag" },
  { name: "TrendingUp", icon: "trending-up" },
  { name: "DollarSign", icon: "dollar-sign" }
];

const ICON_FEATHER_MAP = {
  Home: "home",
  ShoppingBag: "shopping-bag",
  Zap: "zap",
  Utensils: "coffee",
  CreditCard: "credit-card",
  Tv: "tv",
  Tag: "tag",
  TrendingUp: "trending-up",
  DollarSign: "dollar-sign"
};

export default function CategoriesScreen({ theme }) {
  const { categories, transactions, addCategory, deleteCategory, formatCurrency, loading } = useData();

  // Modal and Form States
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [selectedColor, setSelectedColor] = useState(FINTECH_PALETTE[0]);
  const [budgetType, setBudgetType] = useState("Want");
  const [submitting, setSubmitting] = useState(false);

  // Memoize aggregated metrics to optimize rendering performance
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

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Input Error", "Please provide a category name.");
      return;
    }

    setSubmitting(true);
    const res = await addCategory({
      categoryName: categoryName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      budgetType
    });
    setSubmitting(false);

    if (res.success) {
      setCategoryName("");
      setSelectedIcon("Tag");
      setSelectedColor(FINTECH_PALETTE[0]);
      setModalVisible(false);
      Alert.alert("Success", "Category created and synchronized!");
    } else {
      Alert.alert("Sync Error", "Could not synchronize category.");
    }
  };

  const handleDeletePress = (catId, catName) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete the category "${catName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const res = await deleteCategory(catId);
            if (!res.success) {
              Alert.alert("Sync Error", "Could not delete category.");
            }
          }
        }
      ]
    );
  };

  if (loading && categories.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accentPurple} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Category Allocator</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage transaction categories and allocation rules</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setModalVisible(true)} 
            style={[styles.addBtn, { backgroundColor: theme.accentPurple }]}
          >
            <Feather name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CATEGORIES LIST */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Active Ledger Categories</Text>
      <View style={[styles.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        {categories.map(cat => {
          const spent = spentMap[cat.CategoryName] || 0;
          const percent = ((spent / totalExpense) * 100).toFixed(0);
          const iconName = ICON_FEATHER_MAP[cat.Icon] || "tag";
          const isBaseCategory = cat.CategoryName === "Salary" || cat.CategoryName === "Rent" || cat.CategoryName === "Groceries" || cat.CategoryName === "Utilities";
          
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
                  <Feather name={iconName} size={13} color={cat.Color} />
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
                <Text style={[styles.catPercent, { color: theme.textSecondary }]}>{percent}% of total</Text>
                {!isBaseCategory ? (
                  <TouchableOpacity onPress={() => handleDeletePress(cat.CategoryID, cat.CategoryName)} style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 10, color: theme.accentRose, fontWeight: "700" }}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ fontSize: 9, color: theme.textSecondary, opacity: 0.5, marginTop: 6, fontWeight: "600" }}>Locked</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* CREATE CATEGORY MODAL */}
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
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>⚡ Create Custom Category</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll}>
                
                {/* Category Name */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>Category Name</Text>
                <TextInput
                  placeholder="e.g. Subscriptions"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: "rgba(0,0,0,0.15)" }]}
                  value={categoryName}
                  onChangeText={setCategoryName}
                />

                {/* Budget Rule Mapping */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>Budget Rule Mapping</Text>
                <View style={styles.pickerRow}>
                  {[
                    { label: "Need", value: "Need", desc: "Rent/Groceries" },
                    { label: "Want", value: "Want", desc: "Dining/Leisure" },
                    { label: "Savings", value: "Savings", desc: "SIP/Mutual Funds" }
                  ].map(rule => {
                    const isSelected = budgetType === rule.value;
                    return (
                      <TouchableOpacity
                        key={rule.value}
                        onPress={() => setBudgetType(rule.value)}
                        style={[
                          styles.pickerPill,
                          { 
                            backgroundColor: isSelected ? theme.accentPurple : "rgba(255,255,255,0.05)",
                            borderColor: isSelected ? theme.accentPurple : theme.cardBorder
                          }
                        ]}
                      >
                        <Text style={[styles.pickerPillText, { color: isSelected ? "#FFFFFF" : theme.textSecondary }]}>
                          {rule.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Select Icon */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>Select Icon Symbol</Text>
                <View style={styles.iconGrid}>
                  {ICON_OPTIONS.map(ico => {
                    const isActive = selectedIcon === ico.name;
                    return (
                      <TouchableOpacity
                        key={ico.name}
                        onPress={() => setSelectedIcon(ico.name)}
                        style={[
                          styles.iconBtn,
                          {
                            backgroundColor: isActive ? "rgba(139, 92, 246, 0.15)" : "rgba(0,0,0,0.15)",
                            borderColor: isActive ? theme.accentPurple : theme.cardBorder
                          }
                        ]}
                      >
                        <Feather name={ico.icon} size={15} color={isActive ? "#FFFFFF" : theme.textSecondary} />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Select Color Swatch */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>Select Theme Swatch</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 10 }}>
                  {FINTECH_PALETTE.map(col => {
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

                {/* Visual Preview */}
                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 6 }]}>Live Preview</Text>
                <View style={[styles.previewContainer, { backgroundColor: theme.cardBorder }]}>
                  <View style={[styles.previewPill, { borderLeftColor: selectedColor, backgroundColor: "rgba(0,0,0,0.2)" }]}>
                    <Feather name={ICON_FEATHER_MAP[selectedIcon] || "tag"} size={12} color={selectedColor} style={{ marginRight: 6 }} />
                    <Text style={[styles.previewText, { color: theme.textPrimary }]}>
                      {categoryName || "Preview"}
                    </Text>
                    <View style={[styles.smallPill, { backgroundColor: selectedColor }]}>
                      <Text style={styles.smallPillText}>{budgetType}</Text>
                    </View>
                  </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={[
                    styles.submitBtn,
                    { 
                      backgroundColor: theme.accentPurple,
                      opacity: submitting ? 0.6 : 1,
                      marginTop: 8
                    }
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Custom Ledger Filter</Text>
                  )}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
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
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
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
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  previewContainer: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  previewPill: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 12,
    fontWeight: "700",
    marginRight: 8,
  },
  smallPill: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  smallPillText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
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
  }
});
