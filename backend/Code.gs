/**
 * KYLR Finance Ecosystem
 * Google Apps Script Backend Web API
 * Zero-Cost Serverless Backend Database
 */

// Safe configurations
const GEMINI_API_KEY = ""; // Optional: User can set this in their Script Properties or hardcode here.
const DEFAULT_CURRENCY = "USD";

/**
 * Handle incoming GET requests
 */
function doGet(e) {
  return handleRequest(e, "GET");
}

/**
 * Handle incoming POST requests
 */
function doPost(e) {
  return handleRequest(e, "POST");
}

/**
 * Main Request Router with CORS support
 */
function handleRequest(e, method) {
  const result = { success: false, error: "Invalid request" };
  
  try {
    // Process params
    let params = {};
    if (e.parameter) {
      params = e.parameter;
    }
    
    // Parse JSON payload for POST
    let payload = {};
    if (method === "POST" && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    
    // Merge parameters
    const query = { ...params, ...payload };
    const action = query.action;
    
    // Extract User UID (for multi-tenant isolation)
    // The client sends the Firebase UID in x-firebase-uid or inside the payload
    const uid = query.uid || query.UID;
    
    if (!uid) {
      return responseJSON({ success: false, error: "Unauthorized: Missing user identification (UID)" });
    }
    
    // Ensure all spreadsheet tables exist
    initSpreadsheet();
    
    // Route action
    switch (action) {
      // USERS / BUDGETS
      case "getUserProfile":
        return responseJSON(getUserProfile(uid));
      case "updateBudget":
        return responseJSON(updateBudget(uid, query));
        
      // TRANSACTIONS
      case "getTransactions":
        return responseJSON(getTransactions(uid));
      case "addTransaction":
        return responseJSON(addTransaction(uid, query));
      case "deleteTransaction":
        return responseJSON(deleteTransaction(uid, query.transactionId));
        
      // CATEGORIES
      case "getCategories":
        return responseJSON(getCategories(uid));
      case "addCategory":
        return responseJSON(addCategory(uid, query));
      case "deleteCategory":
        return responseJSON(deleteCategory(uid, query.categoryId));
        
      // ACCOUNTS
      case "getAccounts":
        return responseJSON(getAccounts(uid));
      case "addAccount":
        return responseJSON(addAccount(uid, query));
      case "deleteAccount":
        return responseJSON(deleteAccount(uid, query.accountId));
        
      // ANALYTICS
      case "getAnalytics":
        return responseJSON(getAnalytics(uid));
        
      // AI INSIGHTS
      case "getAiInsights":
        return responseJSON(getAiInsights(uid, query.geminiApiKey || GEMINI_API_KEY));
        
      // REMINDERS & AUTOPAYS
      case "getReminders":
        return responseJSON(getReminders(uid));
      case "addReminder":
        return responseJSON(addReminder(uid, query));
      case "deleteReminder":
        return responseJSON(deleteReminder(uid, query.reminderId));
      case "checkOffReminder":
        return responseJSON(checkOffReminder(uid, query.reminderId, query.monthStr));
        
      default:
        return responseJSON({ success: false, error: "Action '" + action + "' not recognized" });
    }
  } catch (err) {
    return responseJSON({ success: false, error: err.toString(), stack: err.stack });
  }
}

/**
 * Format Output as JSON with proper CORS headers
 */
function responseJSON(data) {
  const jsonString = JSON.stringify(data);
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Initialize Database structure if sheets are missing
 */
function initSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheets = {
    "Users": ["UID", "Name", "Email", "Salary", "BudgetRuleEnabled", "NeedsPercentage", "WantsPercentage", "SavingsPercentage", "CreatedAt"],
    "Transactions": ["TransactionID", "UID", "Date", "Amount", "TransactionType", "Category", "Account", "Note", "BudgetType", "CreatedAt"],
    "Categories": ["CategoryID", "UID", "CategoryName", "Icon", "Color", "BudgetType", "CreatedAt"],
    "Accounts": ["AccountID", "UID", "AccountType", "AccountName", "CurrentBalance", "CreditLimit", "BankName", "CardLast4Digits", "CreatedAt", "Color", "BuyPrice", "Quantity"],
    "Reminders": ["ReminderID", "UID", "Title", "Amount", "TransactionType", "Frequency", "Account", "DestinationAccount", "Category", "BudgetType", "StartDate", "DeductionDay", "IsAutopay", "CheckedOffMonths", "CreatedAt"]
  };
  
  for (let sheetName in sheets) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      // Format headers
      sheet.getRange(1, 1, 1, sheets[sheetName].length)
        .setFontWeight("bold")
        .setBackground("#1a1a2e")
        .setFontColor("#ffffff");
    } else if (sheetName === "Accounts") {
      // Auto-migrate: check if columns exist
      let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (headers.indexOf("Color") === -1) {
        sheet.getRange(1, headers.length + 1).setValue("Color")
          .setFontWeight("bold")
          .setBackground("#1a1a2e")
          .setFontColor("#ffffff");
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      }
      if (headers.indexOf("BuyPrice") === -1) {
        sheet.getRange(1, headers.length + 1).setValue("BuyPrice")
          .setFontWeight("bold")
          .setBackground("#1a1a2e")
          .setFontColor("#ffffff");
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      }
      if (headers.indexOf("Quantity") === -1) {
        sheet.getRange(1, headers.length + 1).setValue("Quantity")
          .setFontWeight("bold")
          .setBackground("#1a1a2e")
          .setFontColor("#ffffff");
      }
    }
  }
}

/**
 * Helper to convert sheet rows into array of objects
 */
function getSheetRows(sheetName, uidFilter = null) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  
  const uidIndex = headers.indexOf("UID");
  
  const list = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    // Apply isolated tenant filtering
    if (uidFilter && uidIndex !== -1 && String(row[uidIndex]) !== String(uidFilter)) {
      continue;
    }
    
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      if (val instanceof Date) {
        if (headers[j] === "Date") {
          val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        } else {
          val = Utilities.formatDate(val, "UTC", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        }
      }
      obj[headers[j]] = val;
    }
    obj.rowIndex = i + 2; // Keep track of physical row index (1-based, accounts for headers)
    list.push(obj);
  }
  return list;
}

// ==========================================
// 1. USER PROFILE & 50-30-20 BUDGET MODULE
// ==========================================

function getUserProfile(uid) {
  const users = getSheetRows("Users", uid);
  if (users.length > 0) {
    return { success: true, profile: users[0] };
  }
  
  // Create default user profile if not exist
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const defaultRow = [
    uid,
    "New KYLR User",
    "",
    5000, // Monthly salary
    true, // BudgetRuleEnabled
    50,   // Needs %
    30,   // Wants %
    20,   // Savings %
    new Date().toISOString()
  ];
  sheet.appendRow(defaultRow);
  
  return {
    success: true,
    profile: {
      UID: uid,
      Name: "New KYLR User",
      Email: "",
      Salary: 5000,
      BudgetRuleEnabled: true,
      NeedsPercentage: 50,
      WantsPercentage: 30,
      SavingsPercentage: 20,
      CreatedAt: defaultRow[8]
    }
  };
}

function updateBudget(uid, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const users = getSheetRows("Users", uid);
  
  const salary = data.salary !== undefined ? parseFloat(data.salary) : 5000;
  const ruleEnabled = data.budgetRuleEnabled !== undefined ? (data.budgetRuleEnabled === true || data.budgetRuleEnabled === "true") : true;
  const needs = data.needsPercentage !== undefined ? parseFloat(data.needsPercentage) : 50;
  const wants = data.wantsPercentage !== undefined ? parseFloat(data.wantsPercentage) : 30;
  const savings = data.savingsPercentage !== undefined ? parseFloat(data.savingsPercentage) : 20;
  const name = data.name || "KYLR User";
  
  if (users.length > 0) {
    const rIndex = users[0].rowIndex;
    // ["UID", "Name", "Email", "Salary", "BudgetRuleEnabled", "NeedsPercentage", "WantsPercentage", "SavingsPercentage", "CreatedAt"]
    sheet.getRange(rIndex, 2).setValue(name);
    sheet.getRange(rIndex, 4).setValue(salary);
    sheet.getRange(rIndex, 5).setValue(ruleEnabled);
    sheet.getRange(rIndex, 6).setValue(needs);
    sheet.getRange(rIndex, 7).setValue(wants);
    sheet.getRange(rIndex, 8).setValue(savings);
  } else {
    sheet.appendRow([uid, name, "", salary, ruleEnabled, needs, wants, savings, new Date().toISOString()]);
  }
  SpreadsheetApp.flush(); // Force database commit immediately
  return { success: true, message: "Profile & budget rule updated successfully" };
}

// ==========================================
// 2. TRANSACTION MANAGEMENT MODULE
// ==========================================

/**
 * Dynamic Multi-Sheet Transaction Aggregator with Multi-tenant isolation.
 * Scans all sheets in the workbook and aggregates transactions from any sheets
 * starting with "Transactions" (e.g. legacy "Transactions" sheet and monthly "Transactions_2026-05").
 */
function getAllTransactionRows(uidFilter) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const combined = [];
  
  for (let i = 0; i < sheets.length; i++) {
    const sheetName = sheets[i].getName();
    if (sheetName === "Transactions" || sheetName.indexOf("Transactions_") === 0) {
      const rows = getSheetRows(sheetName, uidFilter);
      for (let j = 0; j < rows.length; j++) {
        const row = rows[j];
        row.sheetName = sheetName; // Keep track of physical sheet name for editing/deletion
        combined.push(row);
      }
    }
  }
  return combined;
}

/**
 * Fetch or dynamically initialize a monthly transactions table partition
 */
function getOrCreateMonthlySheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = ["TransactionID", "UID", "Date", "Amount", "TransactionType", "Category", "Account", "Note", "BudgetType", "CreatedAt"];
    sheet.appendRow(headers);
    // Format headers
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1a1a2e")
      .setFontColor("#ffffff");
  }
  return sheet;
}

function getTransactions(uid) {
  const list = getAllTransactionRows(uid);
  // Sort descending by Date
  list.sort((a, b) => new Date(b.Date) - new Date(a.Date));
  return { success: true, transactions: list };
}

function addTransaction(uid, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const id = "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const date = data.date || new Date().toISOString().split('T')[0];
  const amount = parseFloat(data.amount) || 0;
  const type = data.transactionType || "Expense"; // Income / Expense / Transfer
  const category = data.category || "Uncategorized";
  const account = data.account || "Cash";
  const note = data.note || "";
  const budgetType = data.budgetType || "Want"; // Need / Want / Savings

  if (type === "Transfer") {
    const destAccount = data.destinationAccount;
    const sourceAccount = account;
    
    // 1. Create Transfer Out record
    const outId = "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    let outSheetName = "Transactions";
    try {
      const parts = date.split('-');
      if (parts.length >= 2) {
        outSheetName = "Transactions_" + parts[0] + "-" + parts[1];
      }
    } catch (err) {}
    const outSheet = getOrCreateMonthlySheet(ss, outSheetName);
    outSheet.appendRow([
      outId,
      uid,
      date,
      amount,
      "Transfer Out",
      "Transfer",
      sourceAccount,
      note ? `${note} (Transfer to ${destAccount})` : `Transfer to ${destAccount}`,
      "Savings",
      new Date().toISOString()
    ]);
    adjustAccountBalance(uid, sourceAccount, amount, "Transfer Out");
    
    // 2. Create Transfer In record
    const inId = "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    let inSheetName = "Transactions";
    try {
      const parts = date.split('-');
      if (parts.length >= 2) {
        inSheetName = "Transactions_" + parts[0] + "-" + parts[1];
      }
    } catch (err) {}
    const inSheet = getOrCreateMonthlySheet(ss, inSheetName);
    inSheet.appendRow([
      inId,
      uid,
      date,
      amount,
      "Transfer In",
      "Transfer",
      destAccount,
      note ? `${note} (Transfer from ${sourceAccount})` : `Transfer from ${sourceAccount}`,
      "Savings",
      new Date().toISOString()
    ]);
    adjustAccountBalance(uid, destAccount, amount, "Transfer In");
    
    return { success: true, transactionId: outId, message: "Self Transfer completed successfully" };
  }

  // Parse YYYY-MM from transaction date to create a new monthly sheet if not exists
  let sheetName = "Transactions";
  try {
    const parts = date.split('-');
    if (parts.length >= 2) {
      sheetName = "Transactions_" + parts[0] + "-" + parts[1]; // Transactions_2026-05
    }
  } catch (err) {
    // fallback to legacy
  }

  const sheet = getOrCreateMonthlySheet(ss, sheetName);
  
  // Append transaction
  sheet.appendRow([
    id,
    uid,
    date,
    amount,
    type,
    category,
    account,
    note,
    budgetType,
    new Date().toISOString()
  ]);
  
  // Dynamically update the account balance
  adjustAccountBalance(uid, account, amount, type);
  SpreadsheetApp.flush(); // Force database commit immediately
  return { success: true, transactionId: id, message: "Transaction added successfully to " + sheetName };
}

function deleteTransaction(uid, txnId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txns = getAllTransactionRows(uid);
  
  const target = txns.find(t => String(t.TransactionID) === String(txnId));
  if (!target) {
    return { success: false, error: "Transaction not found or unauthorized" };
  }
  
  const sheet = ss.getSheetByName(target.sheetName);
  if (!sheet) {
    return { success: false, error: "Sheet " + target.sheetName + " not found" };
  }
  
  // Revert balance before deleting
  const multiplier = (target.TransactionType === "Income" || target.TransactionType === "Transfer In") ? -1 : 1;
  adjustAccountBalance(uid, target.Account, parseFloat(target.Amount) * multiplier, "Income"); // simulated Income to reverse
  
  // If it is a transfer, also find and delete the corresponding visual transfer entry
  if (target.TransactionType === "Transfer Out" || target.TransactionType === "Transfer In") {
    const partnerType = target.TransactionType === "Transfer Out" ? "Transfer In" : "Transfer Out";
    
    // Find the partner entry in the transactions
    const partner = txns.find(t => 
      t.Date === target.Date && 
      parseFloat(t.Amount) === parseFloat(target.Amount) && 
      t.TransactionType === partnerType && 
      String(t.TransactionID) !== String(target.TransactionID)
    );
    
    if (partner) {
      // Revert partner's balance
      const partnerMultiplier = partner.TransactionType === "Transfer In" ? -1 : 1;
      adjustAccountBalance(uid, partner.Account, parseFloat(partner.Amount) * partnerMultiplier, "Income");
      
      const partnerSheet = ss.getSheetByName(partner.sheetName);
      if (partnerSheet) {
        // If they are in the same sheet, handle index shifting safely
        if (partner.sheetName === target.sheetName) {
          if (partner.rowIndex > target.rowIndex) {
            sheet.deleteRow(target.rowIndex);
            sheet.deleteRow(partner.rowIndex - 1);
          } else {
            sheet.deleteRow(partner.rowIndex);
            sheet.deleteRow(target.rowIndex - 1);
          }
        } else {
          // Different monthly sheets
          sheet.deleteRow(target.rowIndex);
          partnerSheet.deleteRow(partner.rowIndex);
        }
      } else {
        sheet.deleteRow(target.rowIndex);
      }
    } else {
      sheet.deleteRow(target.rowIndex);
    }
  } else {
    sheet.deleteRow(target.rowIndex);
  }
  
  SpreadsheetApp.flush(); // Force database commit immediately
  return { success: true, message: "Transaction deleted successfully" };
}

// ==========================================
// 3. CATEGORIES MANAGEMENT MODULE
// ==========================================

function getCategories(uid) {
  const customList = getSheetRows("Categories", uid);
  
  // If user has no categories, seed basic ones
  if (customList.length === 0) {
    const defaultCategories = [
      { name: "Rent", icon: "Home", color: "#F43F5E", budgetType: "Need" },
      { name: "Groceries", icon: "ShoppingBag", color: "#10B981", budgetType: "Need" },
      { name: "Utilities", icon: "Zap", color: "#F59E0B", budgetType: "Need" },
      { name: "Dining Out", icon: "Utensils", color: "#EC4899", budgetType: "Want" },
      { name: "Shopping", icon: "CreditCard", color: "#8B5CF6", budgetType: "Want" },
      { name: "Entertainment", icon: "Tv", color: "#3B82F6", budgetType: "Want" },
      { name: "Investments", icon: "TrendingUp", color: "#06B6D4", budgetType: "Savings" },
      { name: "Salary", icon: "DollarSign", color: "#10B981", budgetType: "Need" }
    ];
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Categories");
    const createdList = [];
    
    defaultCategories.forEach(c => {
      const id = "CAT_" + Math.random().toString(36).substr(2, 9).toUpperCase();
      const row = [id, uid, c.name, c.icon, c.color, c.budgetType, new Date().toISOString()];
      sheet.appendRow(row);
      createdList.push({
        CategoryID: id,
        UID: uid,
        CategoryName: c.name,
        Icon: c.icon,
        Color: c.color,
        BudgetType: c.budgetType,
        CreatedAt: row[6]
      });
    });
    return { success: true, categories: createdList };
  }
  
  return { success: true, categories: customList };
}

function addCategory(uid, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Categories");
  
  const id = "CAT_" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const name = data.categoryName || "New Category";
  const icon = data.icon || "Tag";
  const color = data.color || "#6B7280";
  const budgetType = data.budgetType || "Want"; // Need / Want / Savings
  
  sheet.appendRow([
    id,
    uid,
    name,
    icon,
    color,
    budgetType,
    new Date().toISOString()
  ]);
  
  return { success: true, categoryId: id, message: "Category created successfully" };
}

function deleteCategory(uid, catId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Categories");
  const cats = getSheetRows("Categories", uid);
  
  const target = cats.find(c => String(c.CategoryID) === String(catId));
  if (!target) {
    return { success: false, error: "Category not found or unauthorized" };
  }
  
  sheet.deleteRow(target.rowIndex);
  return { success: true, message: "Category deleted successfully" };
}

// ==========================================
// 4. ACCOUNTS MANAGEMENT MODULE
// ==========================================

function getAccounts(uid) {
  const accounts = getSheetRows("Accounts", uid);
  
  // Seed default if empty
  if (accounts.length === 0) {
    const defaults = [
      { type: "Bank Account", name: "HDFC Savings", balance: 2500, limit: 0, bank: "HDFC Bank", last4: "4920", color: "#1E1B4B" },
      { type: "Credit Card", name: "ICICI Amazon Pay", balance: -150, limit: 5000, bank: "ICICI Bank", last4: "8821", color: "#111827" },
      { type: "Wallet", name: "Paytm Wallet", balance: 120, limit: 0, bank: "Paytm", last4: "0000", color: "#064E3B" }
    ];
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Accounts");
    const created = [];
    
    defaults.forEach(a => {
      const id = "ACC_" + Math.random().toString(36).substr(2, 9).toUpperCase();
      const row = [id, uid, a.type, a.name, a.balance, a.limit, a.bank, a.last4, new Date().toISOString(), a.color];
      sheet.appendRow(row);
      created.push({
        AccountID: id,
        UID: uid,
        AccountType: a.type,
        AccountName: a.name,
        CurrentBalance: a.balance,
        CreditLimit: a.limit,
        BankName: a.bank,
        CardLast4Digits: a.last4,
        CreatedAt: row[8],
        Color: a.color
      });
    });
    return { success: true, accounts: created };
  }
  
  return { success: true, accounts: accounts };
}

function addAccount(uid, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Accounts");
  
  const id = "ACC_" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const type = data.accountType || "Bank Account";
  const name = data.accountName || "My Wallet";
  const balance = parseFloat(data.currentBalance) || 0.0;
  const limit = parseFloat(data.creditLimit) || 0.0;
  const bank = data.bankName || "";
  const last4 = data.cardLast4Digits || "";
  const color = data.color || "#1E1B4B";
  const buyPrice = parseFloat(data.buyPrice) || 0.0;
  const quantity = parseFloat(data.quantity) || 0.0;
  
  sheet.appendRow([
    id,
    uid,
    type,
    name,
    balance,
    limit,
    bank,
    last4,
    new Date().toISOString(),
    color,
    buyPrice,
    quantity
  ]);
  SpreadsheetApp.flush(); // Force database commit immediately
  return { success: true, accountId: id, message: "Financial Account created successfully" };
}

function deleteAccount(uid, accId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Accounts");
  const accounts = getSheetRows("Accounts", uid);
  
  const target = accounts.find(a => String(a.AccountID) === String(accId));
  if (!target) {
    return { success: false, error: "Account not found or unauthorized" };
  }
  
  sheet.deleteRow(target.rowIndex);
  SpreadsheetApp.flush(); // Force database commit immediately
  return { success: true, message: "Account deleted successfully" };
}

/**
 * Automatically adjust account balance on Transaction modifications
 */
function adjustAccountBalance(uid, accountName, amount, txnType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Accounts");
  const accounts = getSheetRows("Accounts", uid);
  
  const target = accounts.find(a => String(a.AccountName).trim().toLowerCase() === String(accountName).trim().toLowerCase());
  if (target) {
    const change = (txnType === "Income" || txnType === "Transfer In") ? amount : -amount;
    const newBal = parseFloat(target.CurrentBalance) + change;
    sheet.getRange(target.rowIndex, 5).setValue(newBal); // Balance is column E (5th column)
  }
}

// ==========================================
// 5. ANALYTICS ENGINE
// ==========================================

function getAnalytics(uid) {
  const profileData = getUserProfile(uid).profile;
  const transactions = getAllTransactionRows(uid);
  const accounts = getSheetRows("Accounts", uid);
  
  let totalIncome = 0;
  let totalExpense = 0;
  
  let needSpend = 0;
  let wantSpend = 0;
  let savingsSpend = 0;
  
  const categoryBreakdown = {};
  const dailyTrends = {};
  
  transactions.forEach(t => {
    const amt = parseFloat(t.Amount) || 0;
    const type = t.TransactionType;
    const bType = t.BudgetType;
    const dateStr = String(t.Date).split('T')[0];
    
    if (type === "Income") {
      totalIncome += amt;
    } else if (type === "Expense") {
      totalExpense += amt;
      
      // 50-30-20 split tracking
      if (bType === "Need") needSpend += amt;
      else if (bType === "Want") wantSpend += amt;
      else if (bType === "Savings") savingsSpend += amt;
      
      // Category aggregation
      const cat = t.Category;
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
      
      // Daily aggregates (last 30 days)
      dailyTrends[dateStr] = (dailyTrends[dateStr] || 0) + amt;
    }
  });
  
  // Format category list
  const categoriesList = Object.keys(categoryBreakdown).map(cat => ({
    name: cat,
    value: categoryBreakdown[cat]
  })).sort((a, b) => b.value - a.value);
  
  // Format daily trend list (sorted chronologically)
  const trendsList = Object.keys(dailyTrends).map(d => ({
    date: d,
    amount: dailyTrends[d]
  })).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-15); // limit to last 15 active days
  
  return {
    success: true,
    summary: {
      salary: parseFloat(profileData.Salary),
      budgetRuleEnabled: profileData.BudgetRuleEnabled,
      rules: {
        Needs: parseFloat(profileData.NeedsPercentage),
        Wants: parseFloat(profileData.WantsPercentage),
        Savings: parseFloat(profileData.SavingsPercentage)
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
    accountsSummary: accounts.map(a => ({
      name: a.AccountName,
      type: a.AccountType,
      balance: parseFloat(a.CurrentBalance),
      limit: parseFloat(a.CreditLimit)
    }))
  };
}

// ==========================================
// 6. GEMINI AI INSIGHTS MODULE
// ==========================================

function getAiInsights(uid, apiKey) {
  const actualApiKey = apiKey || GEMINI_API_KEY;
  if (!actualApiKey) {
    return { 
      success: true, 
      insights: "💡 Connect your Gemini API Key in Web Dashboard settings to unlock automated premium AI finance reviews, subscription trackers, and GenZ budget warning tips!" 
    };
  }
  
  try {
    const analytics = getAnalytics(uid);
    const recentTxns = getTransactions(uid).transactions.slice(0, 10);
    
    // Construct rich text prompt with budget context
    const profile = analytics.summary;
    const categoriesJson = JSON.stringify(analytics.categoryBreakdown);
    const txnsJson = JSON.stringify(recentTxns.map(t => ({ amount: t.Amount, desc: t.Note, cat: t.Category, type: t.TransactionType, bType: t.BudgetType })));
    
    const prompt = `You are KYLR, a premium, futuristic, and highly intelligent AI GenZ finance companion. 
Analyze the user's spending data and give actionable, smart, visual, and slightly witty financial insights.
Style: Keep paragraphs extremely short, use bullet points, emoji highlights, and GenZ fintech slang.

User's Budget Profile:
- Monthly Base Income/Salary: $${profile.salary}
- Budget Methodology: 50-30-20 Rule is ${profile.budgetRuleEnabled ? "Enabled" : "Disabled"}.
- Set Targets: Needs: ${profile.rules.Needs}%, Wants: ${profile.rules.Wants}%, Savings: ${profile.rules.Savings}%
- Real Monthly Spending Breakdown:
  * Total Spent on Needs: $${profile.splitExpenses.Need} (Target: $${profile.salary * profile.rules.Needs / 100})
  * Total Spent on Wants: $${profile.splitExpenses.Want} (Target: $${profile.salary * profile.rules.Wants / 100})
  * Dedicated to Savings: $${profile.splitExpenses.Savings} (Target: $${profile.salary * profile.rules.Savings / 100})

Top Spending Categories:
${categoriesJson}

Recent Transactions:
${txnsJson}

Provide exactly 3 high-impact Bullet Insights covering:
1. Budget Rule Health: Did they overshoot their Wants or Needs? How is salary utilization looking?
2. Spending Alerts: Call out if a specific category is abnormally heavy or a recurring subscription looks suspicious.
3. Proactive Savings Action: A highly creative, modern suggestion to hit their savings target.`;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + actualApiKey;
    
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
      const insightText = json.candidates[0].content.parts[0].text;
      return { success: true, insights: insightText };
    } else {
      return { success: false, error: "Unexpected response format from Gemini API", details: json };
    }
  } catch (e) {
    return { success: false, error: "AI Inference Failed: " + e.toString() };
  }
}

// ==========================================
// 7. AUTOPAYS & REMINDERS MODULE
// ==========================================

function getReminders(uid) {
  const list = getSheetRows("Reminders", uid);
  // Sort descending by CreatedAt
  list.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
  return { success: true, reminders: list };
}

function addReminder(uid, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Reminders");
  
  const id = "REM_" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const title = data.title || "Recurring Deduction";
  const amount = parseFloat(data.amount) || 0;
  const type = data.transactionType || "Expense";
  const freq = data.frequency || "Monthly";
  const account = data.account || "Cash";
  const destAccount = data.destinationAccount || "";
  const category = data.category || "Uncategorized";
  const budgetType = data.budgetType || "Want";
  const startDate = data.startDate || new Date().toISOString().split('T')[0];
  const deductionDay = parseInt(data.deductionDay) || 1;
  const isAutopay = data.isAutopay === true || data.isAutopay === "true";
  
  sheet.appendRow([
    id,
    uid,
    title,
    amount,
    type,
    freq,
    account,
    destAccount,
    category,
    budgetType,
    startDate,
    deductionDay,
    isAutopay,
    "", // CheckedOffMonths
    new Date().toISOString()
  ]);
  
  SpreadsheetApp.flush();
  return { success: true, reminderId: id, message: "Autopay/Reminder added successfully" };
}

function deleteReminder(uid, reminderId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Reminders");
  const list = getSheetRows("Reminders", uid);
  
  const target = list.find(r => String(r.ReminderID) === String(reminderId));
  if (!target) {
    return { success: false, error: "Reminder not found or unauthorized" };
  }
  
  sheet.deleteRow(target.rowIndex);
  SpreadsheetApp.flush();
  return { success: true, message: "Reminder deleted successfully" };
}

function checkOffReminder(uid, reminderId, monthStr) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Reminders");
  const list = getSheetRows("Reminders", uid);
  
  const target = list.find(r => String(r.ReminderID) === String(reminderId));
  if (!target) {
    return { success: false, error: "Reminder not found or unauthorized" };
  }
  
  // 1. Update checked off months list
  let checked = target.CheckedOffMonths ? String(target.CheckedOffMonths).trim() : "";
  const checkedArray = checked ? checked.split(",") : [];
  if (checkedArray.indexOf(monthStr) !== -1) {
    return { success: false, error: "Already checked off for " + monthStr };
  }
  checkedArray.push(monthStr);
  const updatedChecked = checkedArray.join(",");
  
  // Set CheckedOffMonths in row (column N is 14th column)
  sheet.getRange(target.rowIndex, 14).setValue(updatedChecked);
  
  // 2. Post corresponding transaction record
  const noteSuffix = ` (Autopay ${monthStr})`;
  const finalNote = target.Title ? `${target.Title}${noteSuffix}` : `Autopay deduction${noteSuffix}`;
  
  // Resolve transaction date (deduction day for the given month, e.g. "2026-05-10")
  let dayStr = String(target.DeductionDay || 1);
  if (dayStr.length === 1) dayStr = "0" + dayStr;
  const txnDate = `${monthStr}-${dayStr}`;
  
  if (target.TransactionType === "Transfer") {
    const amount = parseFloat(target.Amount) || 0;
    const sourceAccount = target.Account;
    const destAccount = target.DestinationAccount;
    
    // Create Transfer Out record
    const outId = "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    let outSheetName = "Transactions";
    try {
      outSheetName = "Transactions_" + monthStr;
    } catch (err) {}
    const outSheet = getOrCreateMonthlySheet(ss, outSheetName);
    outSheet.appendRow([
      outId,
      uid,
      txnDate,
      amount,
      "Transfer Out",
      "Transfer",
      sourceAccount,
      finalNote ? `${finalNote} (Transfer to ${destAccount})` : `Transfer to ${destAccount}`,
      "Savings",
      new Date().toISOString()
    ]);
    adjustAccountBalance(uid, sourceAccount, amount, "Transfer Out");
    
    // Create Transfer In record
    const inId = "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    let inSheetName = "Transactions";
    try {
      inSheetName = "Transactions_" + monthStr;
    } catch (err) {}
    const inSheet = getOrCreateMonthlySheet(ss, inSheetName);
    inSheet.appendRow([
      inId,
      uid,
      txnDate,
      amount,
      "Transfer In",
      "Transfer",
      destAccount,
      finalNote ? `${finalNote} (Transfer from ${sourceAccount})` : `Transfer from ${sourceAccount}`,
      "Savings",
      new Date().toISOString()
    ]);
    adjustAccountBalance(uid, destAccount, amount, "Transfer In");
  } else {
    // Standard Expense
    const amount = parseFloat(target.Amount) || 0;
    const type = target.TransactionType || "Expense";
    const category = target.Category || "Uncategorized";
    const account = target.Account || "Cash";
    const budgetType = target.BudgetType || "Want";
    const id = "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    let sheetName = "Transactions";
    try {
      sheetName = "Transactions_" + monthStr;
    } catch (err) {}
    const txSheet = getOrCreateMonthlySheet(ss, sheetName);
    txSheet.appendRow([
      id,
      uid,
      txnDate,
      amount,
      type,
      category,
      account,
      finalNote,
      budgetType,
      new Date().toISOString()
    ]);
    
    adjustAccountBalance(uid, account, amount, type);
  }
  
  SpreadsheetApp.flush();
  return { success: true, message: "Deduction successfully checked off and posted to transactions" };
}

