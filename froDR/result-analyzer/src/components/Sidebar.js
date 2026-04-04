import React, { useState, useEffect } from "react";

const T = {
  sidebar:   "#111827",
  border:    "#2a3348",
  accent:    "#4f8ef7",
  accentSoft:"#1e3a6e",
  success:   "#22c55e",
  danger:    "#ef4444",
  muted:     "#64748b",
  text:      "#e2e8f0",
  textSub:   "#94a3b8",
};

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { key: "dashboard", label: "Dashboard",   icon: "▦" },
      { key: "results",   label: "Results",     icon: "≡" },
      { key: "analysis",  label: "Analysis",    icon: "↗" },
      { key: "announcements", label: "Announcements", icon: "📢" },
      { key: "progress",  label: "Progress",    icon: "◎" },
    ],
  },
  {
    label: "Export",
    items: [
      { key: "download", label: "Download",     icon: "⬇", hasSubmenu: true },
    ],
  },
];

export default function Sidebar({ setDashboard, setView, setPage, activeView, downloadCSV, downloadPDF }) {
  const [saved, setSaved]       = useState(null);
  const [navTop, setNavTop]     = useState(0);
  const [dlOpen, setDlOpen]     = useState(false);

  useEffect(() => {
    const load = () => {
      try { setSaved(JSON.parse(localStorage.getItem("profile"))); } catch { setSaved(null); }
    };
    load();

    const nav = document.querySelector(".navbar");
    setNavTop(nav ? nav.offsetHeight : 0);

    const handler    = (e) => { if (e?.detail) setSaved(e.detail); else load(); };
    const storageH   = (ev) => { if (ev.key === "profile") load(); };
    window.addEventListener("profileUpdated", handler);
    window.addEventListener("storage", storageH);
    return () => {
      window.removeEventListener("profileUpdated", handler);
      window.removeEventListener("storage", storageH);
    };
  }, []);

  const go = (key) => {
    if (key === "download") { setDlOpen(o => !o); return; }
    setDlOpen(false);
    if (setView) setView(key);
    if (setPage && key === "profile") setPage("profile");
  };

  const initials = saved?.fullName
    ? saved.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <aside style={{
      position: "sticky",
      top: navTop,
      width: 240,
      flexShrink: 0,
      height: `calc(100vh - ${navTop}px)`,
      background: T.sidebar,
      borderRight: `1px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      zIndex: 10,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>

      {/* ── Brand ─────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Result Analysis
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginTop: 3 }}>
          Student Portal
        </div>
      </div>

      {/* ── Profile card ──────────────────────────────────────────── */}
      <div
        onClick={() => { if (setPage) setPage("profile"); else if (setView) setView("profile"); }}
        style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}
        onMouseEnter={e => e.currentTarget.style.background = "#ffffff05"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {/* Avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: saved?.profileImage ? "transparent" : T.accentSoft,
          border: `2px solid ${T.accentSoft}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", marginBottom: 10,
          fontSize: 16, fontWeight: 700, color: T.accent,
        }}>
          {saved?.profileImage
            ? <img src={saved.profileImage} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>
          {saved?.fullName || "Student"}
        </div>

        {saved?.email && (
          <div style={{ fontSize: 11, color: T.muted, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {saved.email}
          </div>
        )}

        {(saved?.rollNo || saved?.course || saved?.semester) && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {saved?.rollNo && (
              <span style={badge("info")}>#{saved.rollNo}</span>
            )}
            {saved?.course && (
              <span style={badge("info")}>{saved.course}</span>
            )}
            {saved?.semester && (
              <span style={badge("info")}>{saved.semester}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "8px 0" }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: T.muted,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "14px 20px 6px",
            }}>
              {group.label}
            </div>

            {group.items.map(item => {
              const isActive = activeView === item.key;

              if (item.hasSubmenu) {
                return (
                  <div key={item.key} style={{ position: "relative" }}>
                    <div
                      onClick={() => go(item.key)}
                      style={navItemStyle(isActive || dlOpen)}
                      onMouseEnter={e => { if (!isActive && !dlOpen) e.currentTarget.style.background = "#ffffff06"; }}
                      onMouseLeave={e => { if (!isActive && !dlOpen) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 14, opacity: 0.8 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: 10, color: T.muted, transition: "transform 0.2s", transform: dlOpen ? "rotate(180deg)" : "none" }}>▾</span>
                    </div>

                    {dlOpen && (
                      <div style={{
                        background: "#1c2333",
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        margin: "4px 12px 4px",
                        overflow: "hidden",
                      }}>
                        {[
                          { label: "Export as CSV",  action: () => { downloadCSV?.(); setDlOpen(false); } },
                          { label: "Export as PDF",  action: () => { downloadPDF?.(); setDlOpen(false); } },
                        ].map((opt, i) => (
                          <div
                            key={i}
                            onClick={opt.action}
                            style={{
                              padding: "10px 16px", fontSize: 12, color: T.textSub, cursor: "pointer",
                              borderBottom: i === 0 ? `1px solid ${T.border}` : "none",
                              display: "flex", alignItems: "center", gap: 8,
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#ffffff08"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ fontSize: 11 }}>{i === 0 ? "⬇" : "📄"}</span>
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={item.key}
                  onClick={() => go(item.key)}
                  style={navItemStyle(isActive)}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#ffffff06"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 14, opacity: 0.8 }}>{item.icon}</span>
                  {item.label}
                </div>
              );
            })}
          </div>
        ))}

        {/* Divider + Logout */}
        <div style={{ borderTop: `1px solid ${T.border}`, margin: "12px 0" }} />
        <div
          onClick={() => setDashboard?.(null)}
          style={{ ...navItemStyle(false), color: T.danger }}
          onMouseEnter={e => { e.currentTarget.style.background = "#450a0a22"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: 14 }}>⏻</span>
          Logout
        </div>
      </nav>

      {/* ── AI badge ──────────────────────────────────────────────── */}
      <div style={{
        margin: "0 16px 16px",
        background: "#1e1b4b",
        border: "1px solid #312e81",
        borderRadius: 10,
        padding: "10px 12px",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", marginBottom: 3 }}>✦ AI Insights Active</div>
        <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.5 }}>
          Smart predictions & analysis enabled
        </div>
      </div>

    </aside>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function navItemStyle(active) {
  return {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 20px", cursor: "pointer",
    fontSize: 13, fontWeight: 500,
    color: active ? "#fff" : "#94a3b8",
    background: active ? "#1e3a6e" : "transparent",
    borderLeft: `3px solid ${active ? "#4f8ef7" : "transparent"}`,
    transition: "all 0.15s",
  };
}

function badge(type) {
  const m = {
    info: { bg: "#1e3a6e22", color: "#4f8ef7", border: "#1e3a6e" },
  };
  const c = m[type] || m.info;
  return {
    display: "inline-block", padding: "2px 8px", borderRadius: 20,
    fontSize: 10, fontWeight: 600,
    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
  };
}
