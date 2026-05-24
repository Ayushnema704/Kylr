"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  TrendingUp, 
  CreditCard, 
  Grid, 
  Settings,
  Shield,
  Activity,
  Sun,
  Moon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const { user, isSandbox, toggleSystemMode } = useAuth();
  const { loading } = useData();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("kylr_theme") || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("kylr_theme", nextTheme);
  };

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Analytics", path: "/analytics", icon: TrendingUp },
    { name: "Accounts", path: "/accounts", icon: CreditCard },
    { name: "Categories", path: "/categories", icon: Grid },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className={`app-wrapper ${mounted && theme === "light" ? "light-theme" : ""}`}>
      {/* Dynamic Futuristic Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">K</div>
          <span className="logo-text">KYLR</span>
        </div>

        {/* Tab Links */}
        <nav style={{ flexGrow: 1 }}>
          <ul className="nav-menu">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = pathname === item.path;
              return (
                <li key={item.name}>
                  <Link 
                    href={item.path} 
                    className={`nav-link ${isActive ? "active" : ""}`}
                  >
                    <IconComp size={18} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Theme Toggle Button */}
        {mounted && (
          <button 
            onClick={toggleTheme}
            className="glass-button secondary"
            style={{ 
              width: "100%", 
              justifyContent: "flex-start", 
              fontSize: "0.8rem", 
              padding: "10px 14px", 
              borderRadius: "10px", 
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {theme === "dark" ? (
              <>
                <Sun size={14} style={{ color: "var(--neon-amber)" }} />
                <span>Switch to Beige UI</span>
              </>
            ) : (
              <>
                <Moon size={14} style={{ color: "var(--neon-purple)" }} />
                <span>Switch to Dark Cyber</span>
              </>
            )}
          </button>
        )}

        {/* System Status Tracker */}
        <div style={{ margin: "24px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            fontSize: "0.75rem", 
            color: isSandbox ? "var(--neon-amber)" : "var(--neon-emerald)",
            background: "rgba(255,255,255,0.02)",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.04)"
          }}>
            <Shield size={12} />
            <span>Mode: {isSandbox ? "Sandbox (Offline)" : "Sheets API Live"}</span>
          </div>
          {mounted && loading && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              fontSize: "0.75rem", 
              color: "var(--neon-cyan)"
            }}>
              <Activity size={12} style={{ animation: "spin 2s linear infinite" }} />
              <span>Syncing ledger...</span>
            </div>
          )}
        </div>

        {/* User profile footer */}
        <div className="sidebar-footer">
          {mounted && user && (
            <div className="user-badge">
              <div className="user-avatar">
                {user.displayName.charAt(0)}
              </div>
              <div className="user-info">
                <span className="user-name">{user.displayName}</span>
                <span className="user-tag">{user.email || "hustler@kylr.io"}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main viewport */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
