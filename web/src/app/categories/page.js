"use client";

import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { 
  Plus, 
  Trash2, 
  Home, 
  ShoppingBag, 
  Zap, 
  Utensils, 
  CreditCard, 
  Tv, 
  Tag, 
  TrendingUp, 
  DollarSign,
  Grid
} from "lucide-react";

// Predefined modern GenZ fintech colors
const FINTECH_PALETTE = [
  "#F43F5E", // Rose (Need)
  "#10B981", // Emerald (Need/Income)
  "#F59E0B", // Amber (Need)
  "#EC4899", // Pink (Want)
  "#8B5CF6", // Purple (Savings)
  "#3B82F6", // Blue (Want)
  "#06B6D4", // Cyan (Want)
  "#6B7280"  // Gray (Muted)
];

const ICON_OPTIONS = [
  { name: "Home", component: Home },
  { name: "ShoppingBag", component: ShoppingBag },
  { name: "Zap", component: Zap },
  { name: "Utensils", component: Utensils },
  { name: "CreditCard", component: CreditCard },
  { name: "Tv", component: Tv },
  { name: "Tag", component: Tag },
  { name: "TrendingUp", component: TrendingUp },
  { name: "DollarSign", component: DollarSign }
];

const IconMap = {
  Home, ShoppingBag, Zap, Utensils, CreditCard, Tv, Tag, TrendingUp, DollarSign
};

export default function Categories() {
  const { categories, addCategory, deleteCategory, loading } = useData();

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [selectedColor, setSelectedColor] = useState(FINTECH_PALETTE[0]);
  const [budgetType, setBudgetType] = useState("Want");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    const res = await addCategory({
      categoryName,
      icon: selectedIcon,
      color: selectedColor,
      budgetType
    });

    if (res.success) {
      setCategoryName("");
      setSelectedIcon("Tag");
      setSelectedColor(FINTECH_PALETTE[0]);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", color: "var(--text-secondary)" }}>
        Syncing categoric ledger filters...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title-sec">
          <h1>Category Customization</h1>
          <span className="header-subtitle">
            Create dynamic financial categories mapped securely to the 50-30-20 budgeting layers.
          </span>
        </div>
        <div className="glow-pill purple">
          <Grid size={12} />
          <span>Dynamic mapping operational</span>
        </div>
      </header>

      {/* TWO COLUMN INTERACTIVE BODY */}
      <section className="dashboard-grid">
        {/* Left Column: List existing Categories (Span 2) */}
        <div className="grid-span-2" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h3>🏷️ Active Custom Categories</h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
            gap: "20px" 
          }}>
            {categories.map((cat) => {
              const IconComp = IconMap[cat.Icon] || Tag;
              const catColor = cat.Color || "#6B7280";
              
              return (
                <div 
                  key={cat.CategoryID}
                  className="glass-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderLeft: `4px solid ${catColor}`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "10px", 
                      background: `rgba(${parseInt(catColor.slice(1,3), 16) || 139}, ${parseInt(catColor.slice(3,5), 16) || 92}, ${parseInt(catColor.slice(5,7), 16) || 246}, 0.15)`,
                      color: catColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <IconComp size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{cat.CategoryName}</h4>
                      <span className={`glow-pill ${cat.BudgetType === "Need" ? "emerald" : cat.BudgetType === "Want" ? "cyan" : "purple"}`} style={{ fontSize: "0.65rem", padding: "2px 8px", marginTop: "4px" }}>
                        {cat.BudgetType}
                      </span>
                    </div>
                  </div>

                  {/* Prevent deleting base Salary/Uncategorized categories for safety */}
                  {cat.CategoryName !== "Salary" && cat.CategoryName !== "Rent" ? (
                    <button 
                      onClick={() => deleteCategory(cat.CategoryID)}
                      style={{ 
                        background: "transparent", 
                        border: "none", 
                        color: "rgba(244, 63, 94, 0.4)", 
                        cursor: "pointer", 
                        transition: "color 0.2s ease" 
                      }}
                      onMouseEnter={(e) => e.target.style.color = "var(--neon-rose)"}
                      onMouseLeave={(e) => e.target.style.color = "rgba(244, 63, 94, 0.4)"}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>Locked</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Add Category Form */}
        <div className="glass-card glow-purple">
          <h3 style={{ marginBottom: "16px" }}>⚡ Create Category</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Category Name */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Category Name</label>
              <input 
                type="text" 
                placeholder="e.g. Subscriptions"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="glass-input" 
                required
              />
            </div>

            {/* Budget rule assignment */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Budget Rule Mapping</label>
              <select 
                className="glass-select"
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
              >
                <option value="Need">Need (50% Essential Rent/Groceries)</option>
                <option value="Want">Want (30% Dining/Entertainment)</option>
                <option value="Savings">Savings (20% Investments/SIP/Emergency)</option>
              </select>
            </div>

            {/* Icon Picker (Clickable Pills) */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Select Icon Symbol</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                {ICON_OPTIONS.map(ico => {
                  const IcoComp = ico.component;
                  const isActive = selectedIcon === ico.name;
                  return (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() => setSelectedIcon(ico.name)}
                      style={{
                        padding: "8px",
                        background: isActive ? "rgba(139, 92, 246, 0.2)" : "rgba(0,0,0,0.2)",
                        border: isActive ? "1px solid var(--neon-purple)" : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        color: isActive ? "#fff" : "var(--text-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <IcoComp size={16} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Swatch Picker */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Select Theme HSL</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {FINTECH_PALETTE.map(col => {
                  const isActive = selectedColor === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: col,
                        border: isActive ? "2px solid #fff" : "none",
                        boxShadow: isActive ? "0 0 10px rgba(255,255,255,0.5)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Visual Preview */}
            <div style={{ 
              background: "rgba(255, 255, 255, 0.02)", 
              padding: "12px", 
              borderRadius: "8px", 
              border: "1px solid rgba(255, 255, 255, 0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Visual Pill Preview:</span>
              <div className={`glow-pill ${budgetType === "Need" ? "emerald" : budgetType === "Want" ? "cyan" : "purple"}`} style={{ borderLeft: `3px solid ${selectedColor}` }}>
                {categoryName || "Preview"}
              </div>
            </div>

            <button type="submit" className="glass-button" style={{ width: "100%" }}>
              <Plus size={16} /> Create custom filter
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
