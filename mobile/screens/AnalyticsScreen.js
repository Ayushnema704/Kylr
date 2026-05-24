import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useData } from "../contexts/DataContext";
import { CategoryDistributionChart, DailyTrendBarChart } from "../components/CustomCharts";

export default function AnalyticsScreen({ theme }) {
  const { analytics, aiInsights, formatCurrency } = useData();

  const breakdownData = analytics?.categoryBreakdown || [];
  const trendData = analytics?.dailyTrends || [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Financial Analytics Center</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Category distributions, active trends, and AI advice</Text>
      </View>

      {/* AI INSIGHTS CARD */}
      <View style={[styles.aiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, shadowColor: theme.accentPurple }]}>
        <View style={styles.aiHeader}>
          <Text style={[styles.aiTitle, { color: theme.accentPurple }]}>✦ Intelligent AI Advisor</Text>
        </View>
        <Text style={[styles.aiText, { color: theme.textPrimary }]}>
          {aiInsights || "Generating financial summaries... Connect your Gemini API Key in Settings to populate bespoke asset allocation reports!"}
        </Text>
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
  aiCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  aiText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 18,
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
  }
});
