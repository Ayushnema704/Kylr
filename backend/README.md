# 📊 KYLR Backend Setup & Database Schema Guide

This backend enables **KYLR** to run on a **₹0-cost production infrastructure** by utilizing Google Sheets as a database, Google Apps Script as a secure REST API host, and Firebase UID filtering to keep individual user data isolated.

---

## 🏛️ Google Sheets Schema Architecture

When you deploy the Google Apps Script web app and make your first request, it will automatically initialize the Google Sheet with the required tables and headers if they do not already exist.

### 1. `Users` Table
Holds core personal budget profiles.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| **UID** | `String` | Unique Firebase User ID |
| **Name** | `String` | Display name of the user |
| **Email** | `String` | Registered Email address |
| **Salary** | `Number` | Monthly base salary (income base) |
| **BudgetRuleEnabled** | `Boolean` | Flag to split salary by 50-30-20 rule |
| **NeedsPercentage** | `Number` | Percentage allocation for Needs (e.g. 50) |
| **WantsPercentage** | `Number` | Percentage allocation for Wants (e.g. 30) |
| **SavingsPercentage** | `Number` | Percentage allocation for Savings (e.g. 20) |
| **CreatedAt** | `String` | Account creation timestamp |

### 2. `Transactions` Table
Holds all expenses, incomes, and transfers.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| **TransactionID** | `String` | Unique auto-generated alphanumeric ID |
| **UID** | `String` | Firebase User UID (owner) |
| **Date** | `String` | Date of the transaction (`YYYY-MM-DD`) |
| **Amount** | `Number` | Value in selected currency |
| **TransactionType** | `String` | `Income` or `Expense` |
| **Category** | `String` | Matching custom or default category name |
| **Account** | `String` | Funding account source name |
| **Note** | `String` | Optional notes |
| **BudgetType** | `String` | Budget bucket: `Need`, `Want`, or `Savings` |
| **CreatedAt** | `String` | Row write timestamp |

### 3. `Categories` Table
Holds user customized categories.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| **CategoryID** | `String` | Unique category identifier |
| **UID** | `String` | Owner User UID |
| **CategoryName** | `String` | Name (e.g., Food, Subscriptions, Fuel) |
| **Icon** | `String` | Lucide icon symbol reference |
| **Color** | `String` | Custom HSL Hex Color code (e.g. `#8B5CF6`) |
| **BudgetType** | `String` | Target budget bucket: `Need`, `Want`, or `Savings` |
| **CreatedAt** | `String` | Category creation timestamp |

### 4. `Accounts` Table
Holds financial source details.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| **AccountID** | `String` | Unique financial account identifier |
| **UID** | `String` | Owner User UID |
| **AccountType** | `String` | `Bank Account`, `Credit Card`, or `Wallet` |
| **AccountName** | `String` | Display Name (e.g. HDFC Salary, SBI Account) |
| **CurrentBalance** | `Number` | Active cash or card outstanding balance |
| **CreditLimit** | `Number` | Total credit limit (only for Credit Cards) |
| **BankName** | `String` | Issuing bank name |
| **CardLast4Digits**| `String` | Last 4 digits of the card for visual mapping |
| **CreatedAt** | `String` | Account creation timestamp |

---

## 🚀 Step-by-Step Google Apps Script Deployment

Follow these quick steps to host your backend serverless API:

1. **Create a Spreadsheet**:
   * Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
   * Name it `KYLR Database`.
   * Copy the **Spreadsheet ID** from the browser address bar:
     `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit`

2. **Open Apps Script Editor**:
   * In your spreadsheet menu, click on **Extensions** -> **Apps Script**.
   * Rename the project to `KYLR Backend API`.

3. **Paste the Code**:
   * Delete any default code in the editor (`Code.gs`).
   * Copy the entire contents of [Code.gs](file:///c:/Users/ashis/OneDrive/Documents/Kylr/backend/Code.gs) in this repository and paste it into the editor.
   * *(Optional)* Put your Gemini API Key in the `GEMINI_API_KEY` configuration on line 7 or configure it in the Web UI Settings panel later!

4. **Deploy as a Web App**:
   * In the top-right corner of the Apps Script interface, click **Deploy** -> **New deployment**.
   * Click the **Gear icon (Select type)** and choose **Web app**.
   * Configure details:
     * **Description**: `KYLR Production Web App`
     * **Execute as**: `Me (your-google-email@gmail.com)`
     * **Who has access**: `Anyone` *(Crucial for frontend fetching)*
   * Click **Deploy**.
   * Review Permissions, sign in, click **Advanced** -> **Go to KYLR Backend API (unsafe)**, and click **Allow**.

5. **Save the Web App URL**:
   * Once deployed, copy the **Web app URL**:
     `https://script.google.com/macros/s/AKfycb.../exec`
   * Place this URL in your web project settings or configure it as `NEXT_PUBLIC_APPS_SCRIPT_URL` in your `.env.local` to switch from Sandbox to Live Sheets!
