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
  Moon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const { user, isSandbox, toggleSystemMode } = useAuth();
  const { loading } = useData();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [authorized, setAuthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("kylr_theme") || "dark";
    setTheme(savedTheme);
    const collapsed = localStorage.getItem("kylr_sidebar_collapsed") === "true";
    setIsSidebarCollapsed(collapsed);
  }, []);

  const toggleSidebar = () => {
    const nextCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextCollapsed);
    localStorage.setItem("kylr_sidebar_collapsed", nextCollapsed ? "true" : "false");
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_DEPLOYMENT_PASSWORD || "kylr2026";
    if (passcode === correctPassword) {
      setAuthorized(true);
      setError("");
    } else {
      setError("❌ Invalid Security Passcode. Try again.");
    }
  };

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

  if (mounted && !authorized) {
    return (
      <div 
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          background: "#050508",
          color: "#fff",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
          fontFamily: "var(--font-sans, system-ui)"
        }}
      >
        {/* Animated Cyber Background Glows */}
        <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%)", top: "15%", left: "15%", zIndex: 1 }} />
        <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, rgba(0,0,0,0) 70%)", bottom: "15%", right: "15%", zIndex: 1 }} />

        {/* Passcode card */}
        <div 
          className="glass-card"
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "40px",
            borderRadius: "20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            zIndex: 2,
            position: "relative"
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid var(--neon-purple)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "var(--neon-purple)",
              boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)",
            }}>
              <Shield size={28} />
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px", fontFamily: "var(--font-display)" }}>KYLR Deployment Lock</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Enter the secure passcode to unlock your AI financial ecosystem ledger.
            </p>
          </div>

          <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input 
              type="password" 
              placeholder="Enter passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(0, 0, 0, 0.25)",
                color: "#fff",
                fontSize: "0.95rem",
                textAlign: "center",
                outline: "none",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--neon-purple)";
                e.target.style.boxShadow = "0 0 15px rgba(139, 92, 246, 0.25)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
                e.target.style.boxShadow = "none";
              }}
              required
              autoFocus
            />

            {error ? (
              <span style={{ fontSize: "0.85rem", color: "var(--neon-rose)", fontWeight: 600 }}>{error}</span>
            ) : null}

            <button 
              type="submit" 
              className="glass-button"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Unlock Ledger
            </button>
          </form>

          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "8px" }}>
            Configure your Vercel deployment variable <code style={{ color: "var(--neon-cyan)" }}>NEXT_PUBLIC_DEPLOYMENT_PASSWORD</code> to set a custom passcode.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-wrapper ${mounted && theme === "light" ? "light-theme" : ""} ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Dynamic Futuristic Sidebar */}
      <aside className="sidebar">
        <div className="logo-container" style={{ position: "relative", justifyContent: isSidebarCollapsed ? "center" : "flex-start", paddingLeft: isSidebarCollapsed ? "0" : "8px" }}>
          <div className="logo-icon">K</div>
          {!isSidebarCollapsed && <span className="logo-text">KYLR</span>}
          
          <button 
            onClick={toggleSidebar}
            style={{
              position: "absolute",
              right: isSidebarCollapsed ? "-20px" : "-10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: theme === "light" ? "var(--bg-panel)" : "rgba(13, 13, 23, 0.95)",
              border: "1px solid var(--border-glow)",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--neon-purple)",
              cursor: "pointer",
              boxShadow: "0 0 10px rgba(139, 92, 246, 0.25)",
              transition: "all 0.3s ease",
              zIndex: 100
            }}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
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
                    title={isSidebarCollapsed ? item.name : ""}
                    style={{ justifyContent: isSidebarCollapsed ? "center" : "flex-start" }}
                  >
                    <IconComp size={18} />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
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
              justifyContent: isSidebarCollapsed ? "center" : "flex-start", 
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
            title={theme === "dark" ? "Switch to Beige UI" : "Switch to Dark Cyber"}
          >
            {theme === "dark" ? (
              <>
                <Sun size={14} style={{ color: "var(--neon-amber)" }} />
                {!isSidebarCollapsed && <span>Switch to Beige UI</span>}
              </>
            ) : (
              <>
                <Moon size={14} style={{ color: "var(--neon-purple)" }} />
                {!isSidebarCollapsed && <span>Switch to Dark Cyber</span>}
              </>
            )}
          </button>
        )}

        {/* System Status Tracker */}
        {!isSidebarCollapsed && (
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
        )}

        {/* User profile footer */}
        <div className="sidebar-footer" style={{ paddingLeft: isSidebarCollapsed ? "0" : "8px", display: "flex", justifyContent: isSidebarCollapsed ? "center" : "flex-start" }}>
          {mounted && user && (
            <div className="user-badge" title={isSidebarCollapsed ? `${user.displayName} (${user.email || "hustler@kylr.io"})` : ""}>
              <div className="user-avatar" style={{ margin: isSidebarCollapsed ? "0 auto" : "0" }}>
                {user.displayName.charAt(0)}
              </div>
              {!isSidebarCollapsed && (
                <div className="user-info">
                  <span className="user-name">{user.displayName}</span>
                  <span className="user-tag">{user.email || "hustler@kylr.io"}</span>
                </div>
              )}
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
