"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [reminders, setReminders] = useState([]);
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
    const savedUrl = localStorage.getItem("kylr_apps_script_url") || "";
    const savedKey = localStorage.getItem("kylr_gemini_key") || "";
    setAppsScriptUrl(savedUrl);
    setGeminiApiKey(savedKey);
  }, []);

  // Set environment variable properties
  const updateBackendConfig = (url, key) => {
    setAppsScriptUrl(url);
    setGeminiApiKey(key);
    localStorage.setItem("kylr_apps_script_url", url);
    localStorage.setItem("kylr_gemini_key", key);
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

  // Compute live analytical indicators locally (sandbox fallback)
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
      } else if (t.TransactionType === "Expense") {
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

  const attachRunningBalances = useCallback((txnsList, accsList) => {
    if (!txnsList || txnsList.length === 0 || !accsList || accsList.length === 0) return txnsList;

    // Group transactions by account
    const txnsByAccount = {};
    accsList.forEach(a => {
      txnsByAccount[a.AccountName] = [];
    });

    txnsList.forEach(t => {
      if (txnsByAccount[t.Account]) {
        txnsByAccount[t.Account].push(t);
      }
    });

    // For each account, sort transactions oldest to newest and compute running balance backward
    accsList.forEach(a => {
      const accountTxns = txnsByAccount[a.AccountName];
      if (!accountTxns || accountTxns.length === 0) return;

      // Sort oldest to newest
      accountTxns.sort((x, y) => {
        const dx = new Date(x.Date);
        const dy = new Date(y.Date);
        if (dx.getTime() !== dy.getTime()) {
          return dx - dy;
        }
        const tx = x.CreatedAt ? new Date(x.CreatedAt) : 0;
        const ty = y.CreatedAt ? new Date(y.CreatedAt) : 0;
        return tx - ty;
      });

      let currentBal = parseFloat(a.CurrentBalance) || 0;
      for (let i = accountTxns.length - 1; i >= 0; i--) {
        const t = accountTxns[i];
        t.RunningBalance = currentBal;

        const amt = parseFloat(t.Amount) || 0;
        if (t.TransactionType === "Income" || t.TransactionType === "Transfer In") {
          currentBal -= amt;
        } else if (t.TransactionType === "Expense" || t.TransactionType === "Transfer Out") {
          currentBal += amt;
        }
      }
    });

    return txnsList;
  }, []);

  // Fetch all user records
  const refreshData = useCallback(async () => {
    if (!user) return;

    if (isSandbox) {
      // Fetch sandbox records from LocalStorage
      const localTxns = localStorage.getItem("kylr_txns");
      const localCats = localStorage.getItem("kylr_categories");
      const localAccs = localStorage.getItem("kylr_accounts");

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

        localStorage.setItem("kylr_txns", JSON.stringify(loadedTxns));
        localStorage.setItem("kylr_categories", JSON.stringify(loadedCats));
        localStorage.setItem("kylr_accounts", JSON.stringify(loadedAccs));
      }

      const localReminders = localStorage.getItem("kylr_reminders");
      let loadedReminders = [];
      if (localReminders) {
        loadedReminders = JSON.parse(localReminders);
      } else {
        localStorage.setItem("kylr_reminders", JSON.stringify([]));
      }
      setReminders(loadedReminders);

      const processedTxns = attachRunningBalances(loadedTxns, loadedAccs);
      setTransactions(processedTxns);
      setCategories(loadedCats);
      setAccounts(loadedAccs);
      recalculateSandboxAnalytics(processedTxns, loadedAccs);
      
      setAiInsights(
        `🤖 **Sandbox Active**: Doing awesome! You saved $${(user.salary - loadedTxns.filter(t => t.TransactionType === 'Expense').reduce((acc, c) => acc + c.Amount, 0)).toFixed(2)} so far! Check your visual graphs. Connect your Apps Script URL in Settings to sync live Google Sheets!`
      );
      setLoading(false);
    } else {
      // Real API Mode via Google Apps Script web-app endpoint
      if (!appsScriptUrl) {
        setLoading(false);
        return;
      }
      try {
        const getUrl = (action) => `${appsScriptUrl}?action=${action}&uid=${user.uid}`;
        
        // 1. Fetch categories
        const resCat = await fetch(getUrl("getCategories"));
        const jsonCat = await resCat.json();
        
        // 2. Fetch accounts
        const resAcc = await fetch(getUrl("getAccounts"));
        const jsonAcc = await resAcc.json();

        // 3. Fetch transactions
        const resTxn = await fetch(getUrl("getTransactions"));
        const jsonTxn = await resTxn.json();

        // 4. Fetch analytics
        const resAnly = await fetch(getUrl("getAnalytics"));
        const jsonAnly = await resAnly.json();

        if (jsonCat.success) setCategories(jsonCat.categories);
        if (jsonAcc.success) setAccounts(jsonAcc.accounts);
        if (jsonTxn.success) {
          // Process transactions to split any single "Transfer" row into two entries
          const processed = [];
          jsonTxn.transactions.forEach(t => {
            if (t.TransactionType === "Transfer") {
              const sourceAccount = t.Account;
              const destAccount = t.DestinationAccount || t.destinationAccount || "Destination Account";
              
              // 1. Debit entry (Transfer Out)
              const outTxn = {
                ...t,
                TransactionID: t.TransactionID + "_OUT",
                TransactionType: "Transfer Out",
                Note: t.Note ? `${t.Note} (Transfer to ${destAccount})` : `Transfer to ${destAccount}`
              };
              
              // 2. Credit entry (Transfer In)
              const inTxn = {
                ...t,
                TransactionID: t.TransactionID + "_IN",
                TransactionType: "Transfer In",
                Account: destAccount,
                Note: t.Note ? `${t.Note} (Transfer from ${sourceAccount})` : `Transfer from ${sourceAccount}`
              };
              processed.push(outTxn, inTxn);
            } else {
              processed.push(t);
            }
          });
          const accs = jsonAcc.success ? jsonAcc.accounts : accounts;
          const withBalances = attachRunningBalances(processed, accs);
          setTransactions(withBalances);
        }
        
        // Fetch reminders
        const resRem = await fetch(getUrl("getReminders"));
        const jsonRem = await resRem.json();
        if (jsonRem.success) setReminders(jsonRem.reminders);

        if (jsonAnly.success) setAnalytics(jsonAnly);

        // 5. Fetch AI Insights
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
  }, [user, isSandbox, appsScriptUrl, geminiApiKey, recalculateSandboxAnalytics, getSandboxDefaults, attachRunningBalances]);

  // Initial fetch trigger
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Background polling sync (Google Workspace style auto-sync)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Only sync if the tab is active/visible to save resources/API quota
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshData();
      }
    }, 8000); // sync every 8 seconds

    return () => clearInterval(interval);
  }, [user, refreshData]);

  // Sync immediately when tab visibility changes to visible
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, refreshData]);

  // ==========================================
  // CURRENCY CONVERSION AND FORMATTING UTILITIES
  // ==========================================
  const convertCurrency = useCallback((amount, fromCurrency, toCurrency) => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    if (fromCurrency === toCurrency) return parseFloat(amount);
    
    const rateFrom = exchangeRates[fromCurrency] || 1;
    const rateTo = exchangeRates[toCurrency] || 1;
    
    // Convert fromCurrency -> USD -> toCurrency
    const amountInUSD = amount / rateFrom;
    return amountInUSD * rateTo;
  }, [exchangeRates]);

  const formatCurrency = useCallback((amount, currencyCode = null) => {
    const activeCurrency = currencyCode || user?.currency || "USD";
    const symbol = CURRENCY_MAP[activeCurrency]?.symbol || "$";
    
    if (amount === undefined || amount === null || amount === "" || amount === "-") {
      return `${symbol}0.00`;
    }
    
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

    // Extract numerical amount
    tokens.forEach(tok => {
      const parsedNum = parseFloat(tok);
      if (!isNaN(parsedNum) && amount === null) {
        amount = parsedNum;
      } else {
        noteTokens.push(tok);
      }
    });

    if (amount === null) return null;

    // Capitalize note
    const note = noteTokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" ") || "General Expense";
    
    // Categorization logic matching keywords
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
      if (data.transactionType === "Transfer") {
        const sourceAccount = data.account;
        const destAccount = data.destinationAccount;
        
        const outTxn = {
          TransactionID: "TX_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          Date: data.date || new Date().toISOString().split("T")[0],
          Amount: finalAmount,
          TransactionType: "Transfer Out",
          Category: "Transfer",
          Account: sourceAccount,
          Note: finalNote ? `${finalNote} (Transfer to ${destAccount})` : `Transfer to ${destAccount}`,
          BudgetType: "Savings",
          CreatedAt: new Date().toISOString()
        };
        
        const inTxn = {
          TransactionID: "TX_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          Date: data.date || new Date().toISOString().split("T")[0],
          Amount: finalAmount,
          TransactionType: "Transfer In",
          Category: "Transfer",
          Account: destAccount,
          Note: finalNote ? `${finalNote} (Transfer from ${sourceAccount})` : `Transfer from ${sourceAccount}`,
          BudgetType: "Savings",
          CreatedAt: new Date().toISOString()
        };
        
        const updatedTxns = [outTxn, inTxn, ...transactions];
        setTransactions(updatedTxns);
        localStorage.setItem("kylr_txns", JSON.stringify(updatedTxns));
        
        // Adjust both target accounts atomically
        const updatedAccs = accounts.map(a => {
          if (a.AccountName === sourceAccount) {
            return { ...a, CurrentBalance: a.CurrentBalance - finalAmount };
          }
          if (a.AccountName === destAccount) {
            return { ...a, CurrentBalance: a.CurrentBalance + finalAmount };
          }
          return a;
        });
        setAccounts(updatedAccs);
        localStorage.setItem("kylr_accounts", JSON.stringify(updatedAccs));
        
        recalculateSandboxAnalytics(updatedTxns, updatedAccs);
        return { success: true };
      }

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
      localStorage.setItem("kylr_txns", JSON.stringify(updatedTxns));

      // Adjust Account Balance locally
      const updatedAccs = accounts.map(a => {
        if (a.AccountName === newTxn.Account) {
          const change = newTxn.TransactionType === "Income" ? newTxn.Amount : -newTxn.Amount;
          return { ...a, CurrentBalance: a.CurrentBalance + change };
        }
        return a;
      });
      setAccounts(updatedAccs);
      localStorage.setItem("kylr_accounts", JSON.stringify(updatedAccs));

      recalculateSandboxAnalytics(updatedTxns, updatedAccs);
      return { success: true };
    } else {
      // POST API call
      try {
        const payload = {
          action: "addTransaction",
          uid: user.uid,
          amount: finalAmount,
          transactionType: data.transactionType,
          category: data.category,
          account: data.account,
          destinationAccount: data.destinationAccount,
          note: finalNote,
          budgetType: data.budgetType,
          date: data.date
        };

        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          // Adjust Account Balance locally immediately to ensure instant UI updates
          if (data.transactionType === "Transfer") {
            const updated = accounts.map(a => {
              if (a.AccountName === data.account) {
                return { ...a, CurrentBalance: parseFloat(a.CurrentBalance) - finalAmount };
              }
              if (a.AccountName === data.destinationAccount) {
                return { ...a, CurrentBalance: parseFloat(a.CurrentBalance) + finalAmount };
              }
              return a;
            });
            setAccounts(updated);

            // Construct and prepend optimistic double transaction rows for instant UI feedback
            const outTxn = {
              TransactionID: resJson.transactionId || "TX_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
              Date: data.date || new Date().toISOString().split("T")[0],
              Amount: finalAmount,
              TransactionType: "Transfer Out",
              Category: "Transfer",
              Account: data.account,
              Note: finalNote ? `${finalNote} (Transfer to ${data.destinationAccount})` : `Transfer to ${data.destinationAccount}`,
              BudgetType: "Savings",
              CreatedAt: new Date().toISOString()
            };
            
            const inTxn = {
              TransactionID: "TX_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
              Date: data.date || new Date().toISOString().split("T")[0],
              Amount: finalAmount,
              TransactionType: "Transfer In",
              Category: "Transfer",
              Account: data.destinationAccount,
              Note: finalNote ? `${finalNote} (Transfer from ${data.account})` : `Transfer from ${data.account}`,
              BudgetType: "Savings",
              CreatedAt: new Date().toISOString()
            };
            
            setTransactions(prev => [outTxn, inTxn, ...prev]);
          } else {
            const updated = accounts.map(a => {
              if (a.AccountName === data.account) {
                const change = data.transactionType === "Income" ? finalAmount : -finalAmount;
                return { ...a, CurrentBalance: parseFloat(a.CurrentBalance) + change };
              }
              return a;
            });
            setAccounts(updated);

            // Construct and prepend optimistic single transaction row
            const newTxn = {
              TransactionID: resJson.transactionId || "TX_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
              Date: data.date || new Date().toISOString().split("T")[0],
              Amount: finalAmount,
              TransactionType: data.transactionType || "Expense",
              Category: data.category || "Dining Out",
              Account: data.account || "HDFC Savings",
              Note: finalNote,
              BudgetType: data.budgetType || "Want",
              CreatedAt: new Date().toISOString()
            };
            
            setTransactions(prev => [newTxn, ...prev]);
          }
          await refreshData();
        }
        return resJson;
      } catch (err) {
        console.error("Add Transaction error: ", err);
        return { success: false, error: err.toString() };
      }
    }
  };

  const deleteTransaction = async (txnId) => {
    if (isSandbox) {
      const target = transactions.find(t => t.TransactionID === txnId);
      if (!target) return { success: false };

      // If it is a transfer, delete both target and partner locally
      let toRemove = [target.TransactionID];
      let partner = null;
      if (target.TransactionType === "Transfer Out" || target.TransactionType === "Transfer In") {
        const partnerType = target.TransactionType === "Transfer Out" ? "Transfer In" : "Transfer Out";
        partner = transactions.find(t => 
          t.Date === target.Date && 
          t.Amount === target.Amount && 
          t.TransactionType === partnerType && 
          t.TransactionID !== target.TransactionID
        );
        if (partner) toRemove.push(partner.TransactionID);
      }

      const updatedTxns = transactions.filter(t => !toRemove.includes(t.TransactionID));
      setTransactions(updatedTxns);
      localStorage.setItem("kylr_txns", JSON.stringify(updatedTxns));

      // Revert local account balances for both
      const updatedAccs = accounts.map(a => {
        let balChange = 0;
        if (a.AccountName === target.Account) {
          balChange += target.TransactionType === "Income" ? -target.Amount : target.Amount;
        }
        if (partner && a.AccountName === partner.Account) {
          balChange += partner.TransactionType === "Income" ? -partner.Amount : partner.Amount;
        }
        return { ...a, CurrentBalance: a.CurrentBalance + balChange };
      });
      setAccounts(updatedAccs);
      localStorage.setItem("kylr_accounts", JSON.stringify(updatedAccs));

      recalculateSandboxAnalytics(updatedTxns, updatedAccs);
      return { success: true };
    } else {
      try {
        const payload = {
          action: "deleteTransaction",
          uid: user.uid,
          transactionId: txnId.replace("_OUT", "").replace("_IN", "") // Clean temporary front-end IDs
        };
        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          // Revert local account balance immediately for instant UI updates
          const target = transactions.find(t => t.TransactionID === txnId);
          if (target) {
            let partner = null;
            if (target.TransactionType === "Transfer Out" || target.TransactionType === "Transfer In") {
              const partnerType = target.TransactionType === "Transfer Out" ? "Transfer In" : "Transfer Out";
              partner = transactions.find(t => 
                t.Date === target.Date && 
                parseFloat(t.Amount) === parseFloat(target.Amount) && 
                t.TransactionType === partnerType && 
                t.TransactionID !== target.TransactionID
              );
            }

            const updated = accounts.map(a => {
              let balChange = 0;
              if (a.AccountName === target.Account) {
                const multiplier = (target.TransactionType === "Income" || target.TransactionType === "Transfer In") ? -1 : 1;
                balChange += parseFloat(target.Amount) * multiplier;
              }
              if (partner && a.AccountName === partner.Account) {
                const partnerMultiplier = partner.TransactionType === "Transfer In" ? -1 : 1;
                balChange += parseFloat(partner.Amount) * partnerMultiplier;
              }
              return { ...a, CurrentBalance: parseFloat(a.CurrentBalance) + balChange };
            });
            setAccounts(updated);

            // Optimistically remove both transactions from local React state
            const toRemove = [target.TransactionID];
            if (partner) toRemove.push(partner.TransactionID);
            setTransactions(prev => prev.filter(t => !toRemove.includes(t.TransactionID)));
          }
          await refreshData();
        }
        return resJson;
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
  };

  // ==========================================
  // CATEGORIES CRUD CORE METHODS
  // ==========================================
  const addCategory = async (data) => {
    if (isSandbox) {
      const newCat = {
        CategoryID: "CAT_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        CategoryName: data.categoryName,
        Icon: data.icon || "Tag",
        Color: data.color || "#8B5CF6",
        BudgetType: data.budgetType || "Want",
        CreatedAt: new Date().toISOString()
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      localStorage.setItem("kylr_categories", JSON.stringify(updated));
      return { success: true };
    } else {
      try {
        const payload = {
          action: "addCategory",
          uid: user.uid,
          categoryName: data.categoryName,
          icon: data.icon,
          color: data.color,
          budgetType: data.budgetType
        };
        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          await refreshData();
        }
        return resJson;
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
  };

  const deleteCategory = async (catId) => {
    if (isSandbox) {
      const updated = categories.filter(c => c.CategoryID !== catId);
      setCategories(updated);
      localStorage.setItem("kylr_categories", JSON.stringify(updated));
      return { success: true };
    } else {
      try {
        const payload = {
          action: "deleteCategory",
          uid: user.uid,
          categoryId: catId
        };
        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          await refreshData();
        }
        return resJson;
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
  };

  // ==========================================
  // ACCOUNTS CRUD CORE METHODS
  // ==========================================
  const addAccount = async (data) => {
    if (isSandbox) {
      const newAcc = {
        AccountID: "ACC_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        AccountType: data.accountType || "Bank Account",
        AccountName: data.accountName,
        CurrentBalance: parseFloat(data.currentBalance) || 0,
        CreditLimit: parseFloat(data.creditLimit) || 0,
        BankName: data.bankName || "",
        CardLast4Digits: data.cardLast4Digits || "0000",
        CreatedAt: new Date().toISOString(),
        Color: data.color || "#1E1B4B",
        BuyPrice: parseFloat(data.buyPrice) || 0,
        Quantity: parseFloat(data.quantity) || 0
      };
      const updated = [...accounts, newAcc];
      setAccounts(updated);
      localStorage.setItem("kylr_accounts", JSON.stringify(updated));
      recalculateSandboxAnalytics(transactions, updated);
      return { success: true };
    } else {
      try {
        const payload = {
          action: "addAccount",
          uid: user.uid,
          accountType: data.accountType,
          accountName: data.accountName,
          currentBalance: data.currentBalance,
          creditLimit: data.creditLimit,
          bankName: data.bankName,
          cardLast4Digits: data.cardLast4Digits,
          color: data.color || "#1E1B4B",
          buyPrice: data.buyPrice || 0,
          quantity: data.quantity || 0
        };
        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          await refreshData();
        }
        return resJson;
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
  };

  const deleteAccount = async (accId) => {
    if (isSandbox) {
      const updated = accounts.filter(a => a.AccountID !== accId);
      setAccounts(updated);
      localStorage.setItem("kylr_accounts", JSON.stringify(updated));
      recalculateSandboxAnalytics(transactions, updated);
      return { success: true };
    } else {
      try {
        const payload = {
          action: "deleteAccount",
          uid: user.uid,
          accountId: accId
        };
        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          await refreshData();
        }
        return resJson;
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
  };

  // ==========================================
  // AUTOPAYS & REMINDERS CRUD METHODS
  // ==========================================
  const addReminder = async (data) => {
    if (isSandbox) {
      const newRem = {
        ReminderID: "REM_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        UID: user.uid,
        Title: data.title || "Recurring Deduction",
        Amount: parseFloat(data.amount) || 0,
        TransactionType: data.transactionType || "Expense",
        Frequency: data.frequency || "Monthly",
        Account: data.account || "Cash",
        DestinationAccount: data.destinationAccount || "",
        Category: data.category || "Uncategorized",
        BudgetType: data.budgetType || "Want",
        StartDate: data.startDate || new Date().toISOString().split('T')[0],
        DeductionDay: parseInt(data.deductionDay) || 1,
        IsAutopay: data.isAutopay === true || data.isAutopay === "true",
        CheckedOffMonths: "",
        CreatedAt: new Date().toISOString()
      };
      const updated = [newRem, ...reminders];
      setReminders(updated);
      localStorage.setItem("kylr_reminders", JSON.stringify(updated));
      return { success: true };
    } else {
      try {
        const payload = {
          action: "addReminder",
          uid: user.uid,
          title: data.title,
          amount: parseFloat(data.amount) || 0,
          transactionType: data.transactionType,
          frequency: data.frequency,
          account: data.account,
          destinationAccount: data.destinationAccount,
          category: data.category,
          budgetType: data.budgetType,
          startDate: data.startDate,
          deductionDay: parseInt(data.deductionDay) || 1,
          isAutopay: data.isAutopay
        };
        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          await refreshData();
        }
        return resJson;
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
  };

  const deleteReminder = async (remId) => {
    if (isSandbox) {
      const updated = reminders.filter(r => r.ReminderID !== remId);
      setReminders(updated);
      localStorage.setItem("kylr_reminders", JSON.stringify(updated));
      return { success: true };
    } else {
      try {
        const payload = {
          action: "deleteReminder",
          uid: user.uid,
          reminderId: remId
        };
        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          await refreshData();
        }
        return resJson;
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
  };

  const checkOffReminder = async (remId, monthStr) => {
    if (isSandbox) {
      const target = reminders.find(r => r.ReminderID === remId);
      if (!target) return { success: false, error: "Reminder not found" };

      let checked = target.CheckedOffMonths ? String(target.CheckedOffMonths).trim() : "";
      const checkedArray = checked ? checked.split(",") : [];
      if (checkedArray.indexOf(monthStr) !== -1) {
        return { success: false, error: "Already checked off" };
      }
      checkedArray.push(monthStr);
      
      const updatedReminders = reminders.map(r => {
        if (r.ReminderID === remId) {
          return { ...r, CheckedOffMonths: checkedArray.join(",") };
        }
        return r;
      });
      setReminders(updatedReminders);
      localStorage.setItem("kylr_reminders", JSON.stringify(updatedReminders));

      // Post standard or self transfer transaction
      const noteSuffix = ` (Autopay ${monthStr})`;
      const finalNote = target.Title ? `${target.Title}${noteSuffix}` : `Autopay deduction${noteSuffix}`;
      let dayStr = String(target.DeductionDay || 1);
      if (dayStr.length === 1) dayStr = "0" + dayStr;
      const txnDate = `${monthStr}-${dayStr}`;

      const res = await addTransaction({
        amount: target.Amount,
        note: finalNote,
        category: target.Category,
        account: target.Account,
        destinationAccount: target.DestinationAccount,
        transactionType: target.TransactionType,
        budgetType: target.BudgetType,
        date: txnDate
      });

      return res;
    } else {
      try {
        const payload = {
          action: "checkOffReminder",
          uid: user.uid,
          reminderId: remId,
          monthStr: monthStr
        };
        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          await refreshData();
        }
        return resJson;
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
  };

  // ==========================================
  // PROFILE / BUDGET SETTINGS MOD CORE METHOD
  // ==========================================
  const updateBudget = async (data) => {
    const oldCurrency = user?.currency || "USD";
    const newCurrency = data.currency || oldCurrency;
    let convertedSalary = parseFloat(data.salary) || user.salary;

    if (isSandbox) {
      let updatedTxns = [...transactions];
      let updatedAccs = [...accounts];

      if (oldCurrency !== newCurrency) {
        // Convert all transaction amounts
        updatedTxns = transactions.map(t => ({
          ...t,
          Amount: parseFloat(convertCurrency(t.Amount, oldCurrency, newCurrency).toFixed(2))
        }));
        
        // Convert all account balances and limits
        updatedAccs = accounts.map(a => ({
          ...a,
          CurrentBalance: parseFloat(convertCurrency(a.CurrentBalance, oldCurrency, newCurrency).toFixed(2)),
          CreditLimit: parseFloat(convertCurrency(a.CreditLimit, oldCurrency, newCurrency).toFixed(2))
        }));

        localStorage.setItem("kylr_txns", JSON.stringify(updatedTxns));
        localStorage.setItem("kylr_accounts", JSON.stringify(updatedAccs));
      }

      // Modify auth session user object
      const updatedUser = {
        ...user,
        displayName: data.name || user.displayName,
        salary: convertedSalary,
        budgetRuleEnabled: data.budgetRuleEnabled === true,
        needsPercentage: parseFloat(data.needsPercentage) || user.needsPercentage,
        wantsPercentage: parseFloat(data.wantsPercentage) || user.wantsPercentage,
        savingsPercentage: parseFloat(data.savingsPercentage) || user.savingsPercentage,
        currency: newCurrency
      };
      
      localStorage.setItem("kylr_user", JSON.stringify(updatedUser));
      // Re-trigger visual analytics calculations to capture updated salary boundaries
      window.location.reload(); // Quick refresh to update everything reliably
      return { success: true };
    } else {
      try {
        const payload = {
          action: "updateBudget",
          uid: user.uid,
          name: data.name,
          salary: data.salary,
          budgetRuleEnabled: data.budgetRuleEnabled,
          needsPercentage: data.needsPercentage,
          wantsPercentage: data.wantsPercentage,
          savingsPercentage: data.savingsPercentage,
          currency: data.currency
        };
        const res = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        const resJson = await res.json();
        if (resJson.success) {
          // Sync local profile state
          const updatedUser = {
            ...user,
            displayName: data.name || user.displayName,
            salary: parseFloat(data.salary) || user.salary,
            budgetRuleEnabled: data.budgetRuleEnabled === true,
            needsPercentage: parseFloat(data.needsPercentage) || user.needsPercentage,
            wantsPercentage: parseFloat(data.wantsPercentage) || user.wantsPercentage,
            savingsPercentage: parseFloat(data.savingsPercentage) || user.savingsPercentage,
            currency: data.currency || user.currency || "USD"
          };
          localStorage.setItem("kylr_user", JSON.stringify(updatedUser));
          await refreshData();
        }
        return resJson;
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
  };

  // ==========================================
  // GEMINI AI INSIGHT GENERATION GATEWAY
  // ==========================================
  const generateGeminiInsightsMock = async (customPrompt) => {
    setLoading(true);
    try {
      if (isSandbox) {
        // Run sandbox simulation based on custom prompts
        await new Promise(r => setTimeout(r, 1500)); // natural delay
        const expenses = transactions.filter(t => t.TransactionType === "Expense");
        const totalEx = expenses.reduce((acc, c) => acc + c.Amount, 0);
        const topCat = analytics?.categoryBreakdown?.[0]?.name || "None";
        
        let customVal = `✨ **KYLR Gemini AI Review**: \n\n* 💸 **Budget Rule Health**: Your **salary utilization** is currently sitting at **${((totalEx / user.salary) * 100).toFixed(0)}%**. You have been tracking beautifully on your **Needs (${analytics?.summary?.splitExpenses?.Need || 0} spend)** but keep an eye on your **Wants** which comprises a large portion of your cards! \n* 🚨 **Spending Alerts**: We noticed **${topCat}** is your #1 spending blackhole this month ($${analytics?.categoryBreakdown?.[0]?.value || 0} total). Swiggy/Zomato dine-outs are currently spiking on weekends by **18.4%**. Consider capping card payments!\n* 🚀 **Aura Capitalist Action**: Take **$200** from your HDFC Savings cash balance and drop it into **SIP Investments** right now to lock in that **20% savings goal** before you buy that next cart item. Stay winning!`;
        setAiInsights(customVal);
        setLoading(false);
        return { success: true, insights: customVal };
      } else {
        // Query Gemini through backend Google Apps Script gateway
        if (!appsScriptUrl) return { success: false, error: "Setup Google Apps Script Web App ID first." };
        const res = await fetch(`${appsScriptUrl}?action=getAiInsights&uid=${user.uid}&geminiApiKey=${geminiApiKey}`);
        const json = await res.json();
        if (json.success) {
          setAiInsights(json.insights);
          return json;
        }
        return { success: false, error: json.error };
      }
    } catch (e) {
      setLoading(false);
      return { success: false, error: e.toString() };
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
        exchangeRates,
        convertCurrency,
        formatCurrency,
        updateBackendConfig,
        refreshData,
        parseNaturalLanguageExpense,
        addTransaction,
        deleteTransaction,
        addCategory,
        deleteCategory,
        addAccount,
        deleteAccount,
        updateBudget,
        generateGeminiInsightsMock,
        reminders,
        addReminder,
        deleteReminder,
        checkOffReminder
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
