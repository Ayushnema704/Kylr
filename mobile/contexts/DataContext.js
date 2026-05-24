import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

export const CURRENCY_MAP = {
  USD: { symbol: "$", name: "US Dollar" },
  INR: { symbol: "₹", name: "Indian Rupee" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  JPY: { symbol: "¥", name: "Japanese Yen" },
  CAD: { symbol: "CA$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" }
};

const DataContext = createContext();

export function DataProvider({ children }) {
  const { user, isSandbox } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState("");
  const [loading, setLoading] = useState(true);
  const [appsScriptUrl, setAppsScriptUrl] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [exchangeRates, setExchangeRates] = useState({
    USD: 1,
    INR: 83.5,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 155.0,
    CAD: 1.36,
    AUD: 1.51
  });

  // Fetch live exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const json = await res.json();
        if (json && json.rates) {
          setExchangeRates(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(curr => {
              if (json.rates[curr]) {
                updated[curr] = json.rates[curr];
              }
            });
            return updated;
          });
        }
      } catch (err) {
        console.warn("Failed to fetch live exchange rates, using offline defaults:", err);
      }
    };
    fetchRates();
  }, []);

  // Load configs
  useEffect(() => {
    const loadConfigs = async () => {
      const savedUrl = await AsyncStorage.getItem("kylr_apps_script_url") || "";
      const savedKey = await AsyncStorage.getItem("kylr_gemini_key") || "";
      setAppsScriptUrl(savedUrl);
      setGeminiApiKey(savedKey);
    };
    loadConfigs();
  }, []);

  // Update configuration
  const updateBackendConfig = async (url, key) => {
    setAppsScriptUrl(url);
    setGeminiApiKey(key);
    await AsyncStorage.setItem("kylr_apps_script_url", url);
    await AsyncStorage.setItem("kylr_gemini_key", key);
  };

  // Seed default Sandbox database
  const getSandboxDefaults = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const prevDate = (days) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString().split("T")[0];
    };

    const initialCategories = [
      { CategoryID: "CAT_1", CategoryName: "Rent", Icon: "Home", Color: "#F43F5E", BudgetType: "Need" },
      { CategoryID: "CAT_2", CategoryName: "Groceries", Icon: "ShoppingBag", Color: "#10B981", BudgetType: "Need" },
      { CategoryID: "CAT_3", CategoryName: "Utilities", Icon: "Zap", Color: "#F59E0B", BudgetType: "Need" },
      { CategoryID: "CAT_4", CategoryName: "Dining Out", Icon: "Utensils", Color: "#EC4899", BudgetType: "Want" },
      { CategoryID: "CAT_5", CategoryName: "Shopping", Icon: "CreditCard", Color: "#8B5CF6", BudgetType: "Want" },
      { CategoryID: "CAT_6", CategoryName: "Entertainment", Icon: "Tv", Color: "#3B82F6", BudgetType: "Want" },
      { CategoryID: "CAT_7", CategoryName: "Investments", Icon: "TrendingUp", Color: "#06B6D4", BudgetType: "Savings" },
      { CategoryID: "CAT_8", CategoryName: "Salary", Icon: "DollarSign", Color: "#10B981", BudgetType: "Need" }
    ];

    const initialAccounts = [
      { AccountID: "ACC_1", AccountType: "Bank Account", AccountName: "HDFC Savings", CurrentBalance: 2450, CreditLimit: 0, BankName: "HDFC Bank", CardLast4Digits: "4920" },
      { AccountID: "ACC_2", AccountType: "Credit Card", AccountName: "ICICI Amazon Pay", CurrentBalance: -150, CreditLimit: 5000, BankName: "ICICI Bank", CardLast4Digits: "8821" },
      { AccountID: "ACC_3", AccountType: "Wallet", AccountName: "Paytm Wallet", CurrentBalance: 120, CreditLimit: 0, BankName: "Paytm Wallet", CardLast4Digits: "0000" }
    ];

    const initialTxns = [
      { TransactionID: "TX_1", Date: today, Amount: 320, TransactionType: "Expense", Category: "Dining Out", Account: "Paytm Wallet", Note: "Swiggy Dinner Delivery", BudgetType: "Want", CreatedAt: new Date().toISOString() },
      { TransactionID: "TX_2", Date: prevDate(2), Amount: 1200, TransactionType: "Expense", Category: "Rent", Account: "HDFC Savings", Note: "Co-living Space Rent", BudgetType: "Need", CreatedAt: new Date().toISOString() },
      { TransactionID: "TX_3", Date: prevDate(4), Amount: 45, TransactionType: "Expense", Category: "Entertainment", Account: "ICICI Amazon Pay", Note: "Netflix Premium Sub", BudgetType: "Want", CreatedAt: new Date().toISOString() },
      { TransactionID: "TX_4", Date: prevDate(5), Amount: 180, TransactionType: "Expense", Category: "Groceries", Account: "HDFC Savings", Note: "Whole Foods purchase", BudgetType: "Need", CreatedAt: new Date().toISOString() },
      { TransactionID: "TX_5", Date: prevDate(7), Amount: 500, TransactionType: "Expense", Category: "Investments", Account: "HDFC Savings", Note: "Mutual Fund Monthly SIP", BudgetType: "Savings", CreatedAt: new Date().toISOString() },
      { TransactionID: "TX_6", Date: prevDate(10), Amount: 5000, TransactionType: "Income", Category: "Salary", Account: "HDFC Savings", Note: "KYLR Dev Project Advance", BudgetType: "Need", CreatedAt: new Date().toISOString() }
    ];

    return { initialCategories, initialAccounts, initialTxns };
  }, []);

  // Recalculate dashboard analytical summaries locally (sandbox fallback)
  const recalculateSandboxAnalytics = useCallback((txs, accs) => {
    if (!user) return;
    
    let totalIncome = 0;
    let totalExpense = 0;
    let needSpend = 0;
    let wantSpend = 0;
    let savingsSpend = 0;
    
    const catBreakdown = {};
    const dailyMap = {};

    txs.forEach(t => {
      const amt = parseFloat(t.Amount) || 0;
      if (t.TransactionType === "Income") {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        if (t.BudgetType === "Need") needSpend += amt;
        else if (t.BudgetType === "Want") wantSpend += amt;
        else if (t.BudgetType === "Savings") savingsSpend += amt;
        
        catBreakdown[t.Category] = (catBreakdown[t.Category] || 0) + amt;
        dailyMap[t.Date] = (dailyMap[t.Date] || 0) + amt;
      }
    });

    const categoriesList = Object.keys(catBreakdown).map(cat => ({
      name: cat,
      value: catBreakdown[cat]
    })).sort((a, b) => b.value - a.value);

    const trendsList = Object.keys(dailyMap).map(d => ({
      date: d,
      amount: dailyMap[d]
    })).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-10);

    setAnalytics({
      summary: {
        salary: parseFloat(user.salary) || 5000,
        budgetRuleEnabled: user.budgetRuleEnabled,
        rules: {
          Needs: user.needsPercentage || 50,
          Wants: user.wantsPercentage || 30,
          Savings: user.savingsPercentage || 20
        },
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        splitExpenses: {
          Need: needSpend,
          Want: wantSpend,
          Savings: savingsSpend
        }
      },
      categoryBreakdown: categoriesList,
      dailyTrends: trendsList,
      accountsSummary: accs.map(a => ({
        name: a.AccountName,
        type: a.AccountType,
        balance: parseFloat(a.CurrentBalance),
        limit: parseFloat(a.CreditLimit)
      }))
    });
  }, [user]);

  // Refresh all user records
  const refreshData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (isSandbox) {
      const localTxns = await AsyncStorage.getItem("kylr_txns");
      const localCats = await AsyncStorage.getItem("kylr_categories");
      const localAccs = await AsyncStorage.getItem("kylr_accounts");

      let loadedTxns, loadedCats, loadedAccs;

      if (localTxns && localCats && localAccs) {
        loadedTxns = JSON.parse(localTxns);
        loadedCats = JSON.parse(localCats);
        loadedAccs = JSON.parse(localAccs);
      } else {
        const defaults = getSandboxDefaults();
        loadedTxns = defaults.initialTxns;
        loadedCats = defaults.initialCategories;
        loadedAccs = defaults.initialAccounts;

        await AsyncStorage.setItem("kylr_txns", JSON.stringify(loadedTxns));
        await AsyncStorage.setItem("kylr_categories", JSON.stringify(loadedCats));
        await AsyncStorage.setItem("kylr_accounts", JSON.stringify(loadedAccs));
      }

      setTransactions(loadedTxns);
      setCategories(loadedCats);
      setAccounts(loadedAccs);
      recalculateSandboxAnalytics(loadedTxns, loadedAccs);
      
      setAiInsights(
        `🤖 **Sandbox Active**: Doing awesome! You saved $${(user.salary - loadedTxns.filter(t => t.TransactionType === 'Expense').reduce((acc, c) => acc + c.Amount, 0)).toFixed(2)} so far! Check your visual graphs. Connect your Apps Script URL in Settings to sync live Google Sheets!`
      );
      setLoading(false);
    } else {
      // Production API Mode
      if (!appsScriptUrl) {
        setLoading(false);
        return;
      }
      try {
        const getUrl = (action) => `${appsScriptUrl}?action=${action}&uid=${user.uid}`;
        
        const resCat = await fetch(getUrl("getCategories"));
        const jsonCat = await resCat.json();
        
        const resAcc = await fetch(getUrl("getAccounts"));
        const jsonAcc = await resAcc.json();

        const resTxn = await fetch(getUrl("getTransactions"));
        const jsonTxn = await resTxn.json();

        const resAnly = await fetch(getUrl("getAnalytics"));
        const jsonAnly = await resAnly.json();

        if (jsonCat.success) setCategories(jsonCat.categories);
        if (jsonAcc.success) setAccounts(jsonAcc.accounts);
        if (jsonTxn.success) setTransactions(jsonTxn.transactions);
        if (jsonAnly.success) setAnalytics(jsonAnly);

        if (geminiApiKey) {
          const resAi = await fetch(`${appsScriptUrl}?action=getAiInsights&uid=${user.uid}&geminiApiKey=${geminiApiKey}`);
          const jsonAi = await resAi.json();
          if (jsonAi.success) {
            setAiInsights(jsonAi.insights);
          }
        }
      } catch (err) {
        console.error("API Fetch Error: ", err);
      } finally {
        setLoading(false);
      }
    }
  }, [user, isSandbox, appsScriptUrl, geminiApiKey, recalculateSandboxAnalytics, getSandboxDefaults]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ==========================================
  // CURRENCY CONVERSION AND FORMATTING
  // ==========================================
  const convertCurrency = useCallback((amount, fromCurrency, toCurrency) => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    if (fromCurrency === toCurrency) return parseFloat(amount);
    
    const rateFrom = exchangeRates[fromCurrency] || 1;
    const rateTo = exchangeRates[toCurrency] || 1;
    
    const amountInUSD = amount / rateFrom;
    return amountInUSD * rateTo;
  }, [exchangeRates]);

  const formatCurrency = useCallback((amount, currencyCode = null) => {
    const activeCurrency = currencyCode || user?.currency || "USD";
    const symbol = CURRENCY_MAP[activeCurrency]?.symbol || "$";
    const num = parseFloat(amount);
    if (isNaN(num)) return `${symbol}0.00`;
    
    const formattedNum = Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return `${num < 0 ? "-" : ""}${symbol}${formattedNum}`;
  }, [user?.currency]);

  // ==========================================
  // NLP SMART EXPENSE TRANSACTION PARSER
  // ==========================================
  const parseNaturalLanguageExpense = useCallback((text) => {
    if (!text || text.trim() === "") return null;

    const tokens = text.toLowerCase().trim().split(/\s+/);
    let amount = null;
    let noteTokens = [];

    tokens.forEach(tok => {
      const parsedNum = parseFloat(tok);
      if (!isNaN(parsedNum) && amount === null) {
        amount = parsedNum;
      } else {
        noteTokens.push(tok);
      }
    });

    if (amount === null) return null;

    const note = noteTokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" ") || "General Expense";
    
    let matchCatName = "Dining Out";
    let budgetType = "Want";

    const matchText = note.toLowerCase();
    if (matchText.includes("rent") || matchText.includes("room") || matchText.includes("flat")) {
      matchCatName = "Rent";
      budgetType = "Need";
    } else if (matchText.includes("swiggy") || matchText.includes("zomato") || matchText.includes("food") || matchText.includes("eat") || matchText.includes("cafe") || matchText.includes("dine")) {
      matchCatName = "Dining Out";
      budgetType = "Want";
    } else if (matchText.includes("grocer") || matchText.includes("market") || matchText.includes("milk") || matchText.includes("veggie")) {
      matchCatName = "Groceries";
      budgetType = "Need";
    } else if (matchText.includes("bill") || matchText.includes("electric") || matchText.includes("wifi") || matchText.includes("recharge") || matchText.includes("utility")) {
      matchCatName = "Utilities";
      budgetType = "Need";
    } else if (matchText.includes("buy") || matchText.includes("shop") || matchText.includes("amazon") || matchText.includes("myntra") || matchText.includes("clothes")) {
      matchCatName = "Shopping";
      budgetType = "Want";
    } else if (matchText.includes("netflix") || matchText.includes("movie") || matchText.includes("prime") || matchText.includes("game") || matchText.includes("spotify")) {
      matchCatName = "Entertainment";
      budgetType = "Want";
    } else if (matchText.includes("sip") || matchText.includes("stock") || matchText.includes("crypto") || matchText.includes("mutual") || matchText.includes("invest")) {
      matchCatName = "Investments";
      budgetType = "Savings";
    }

    return {
      amount,
      note,
      category: matchCatName,
      budgetType,
      transactionType: "Expense",
      date: new Date().toISOString().split("T")[0]
    };
  }, []);

  // ==========================================
  // TRANSACTION CRUD CORE METHODS
  // ==========================================
  const addTransaction = async (data) => {
    const portfolioCurrency = user?.currency || "USD";
    const inputCurrency = data.inputCurrency || portfolioCurrency;
    
    let finalAmount = parseFloat(data.amount) || 0;
    let finalNote = data.note || "";
    
    if (inputCurrency !== portfolioCurrency) {
      const converted = convertCurrency(finalAmount, inputCurrency, portfolioCurrency);
      const inputSymbol = CURRENCY_MAP[inputCurrency]?.symbol || inputCurrency;
      finalAmount = parseFloat(converted.toFixed(2));
      finalNote = `${finalNote} (Converted from ${inputSymbol}${parseFloat(data.amount).toFixed(2)} ${inputCurrency})`;
    }

    if (isSandbox) {
      const newTxn = {
        TransactionID: "TX_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        Date: data.date || new Date().toISOString().split("T")[0],
        Amount: finalAmount,
        TransactionType: data.transactionType || "Expense",
        Category: data.category || "Dining Out",
        Account: data.account || "HDFC Savings",
        Note: finalNote,
        BudgetType: data.budgetType || "Want",
        CreatedAt: new Date().toISOString()
      };

      const updatedTxns = [newTxn, ...transactions];
      setTransactions(updatedTxns);
      await AsyncStorage.setItem("kylr_txns", JSON.stringify(updatedTxns));

      const updatedAccs = accounts.map(a => {
        if (a.AccountName === newTxn.Account) {
          const balAdjust = newTxn.TransactionType === "Income" ? newTxn.Amount : -newTxn.Amount;
          return { ...a, CurrentBalance: parseFloat(a.CurrentBalance) + balAdjust };
        }
        return a;
      });
      setAccounts(updatedAccs);
      await AsyncStorage.setItem("kylr_accounts", JSON.stringify(updatedAccs));
      recalculateSandboxAnalytics(updatedTxns, updatedAccs);

      return { success: true };
    } else {
      // Production backend call
      try {
        const postUrl = `${appsScriptUrl}?action=addTransaction&uid=${user.uid}`;
        const body = {
          date: data.date || new Date().toISOString().split("T")[0],
          amount: finalAmount,
          transactionType: data.transactionType || "Expense",
          category: data.category || "Dining Out",
          account: data.account || "HDFC Savings",
          note: finalNote,
          budgetType: data.budgetType || "Want"
        };

        const res = await fetch(postUrl, {
          method: "POST",
          body: JSON.stringify(body)
        });
        const json = await res.json();
        if (json.success) {
          await refreshData();
          return { success: true };
        }
      } catch (err) {
        console.error("API Add Error: ", err);
      }
      return { success: false };
    }
  };

  const deleteTransaction = async (txnId) => {
    if (isSandbox) {
      const txnToDelete = transactions.find(t => t.TransactionID === txnId);
      if (!txnToDelete) return { success: false };

      const updatedTxns = transactions.filter(t => t.TransactionID !== txnId);
      setTransactions(updatedTxns);
      await AsyncStorage.setItem("kylr_txns", JSON.stringify(updatedTxns));

      const updatedAccs = accounts.map(a => {
        if (a.AccountName === txnToDelete.Account) {
          const balAdjust = txnToDelete.TransactionType === "Income" ? -txnToDelete.Amount : txnToDelete.Amount;
          return { ...a, CurrentBalance: parseFloat(a.CurrentBalance) + balAdjust };
        }
        return a;
      });
      setAccounts(updatedAccs);
      await AsyncStorage.setItem("kylr_accounts", JSON.stringify(updatedAccs));
      recalculateSandboxAnalytics(updatedTxns, updatedAccs);

      return { success: true };
    } else {
      try {
        const postUrl = `${appsScriptUrl}?action=deleteTransaction&uid=${user.uid}&transactionId=${txnId}`;
        const res = await fetch(postUrl, { method: "POST" });
        const json = await res.json();
        if (json.success) {
          await refreshData();
          return { success: true };
        }
      } catch (err) {
        console.error("API Delete Error: ", err);
      }
      return { success: false };
    }
  };

  return (
    <DataContext.Provider
      value={{
        transactions,
        categories,
        accounts,
        analytics,
        aiInsights,
        loading,
        appsScriptUrl,
        geminiApiKey,
        updateBackendConfig,
        refreshData,
        addTransaction,
        deleteTransaction,
        parseNaturalLanguageExpense,
        exchangeRates,
        convertCurrency,
        formatCurrency
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
