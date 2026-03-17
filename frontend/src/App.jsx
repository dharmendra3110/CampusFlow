import { useState, useEffect } from "react";
import Register from "./pages/Register";
import Deadline from "./pages/Deadline";
import Summarize from "./pages/Summarize";
import Chat from "./pages/Chat";

const NAV = [
  { id: "register", icon: "◈", label: "Register" },
  { id: "deadline", icon: "◷", label: "Deadlines" },
  { id: "summarize", icon: "◉", label: "AI Notice" },
  { id: "chat",     icon: "◎", label: "CampusBot" },
];

export default function App() {
  const [page, setPage]       = useState("register");
  const [student, setStudent] = useState(null);

  // Persist student session in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cf_student");
    if (saved) setStudent(JSON.parse(saved));
  }, []);

  // Handle Google Calendar OAuth return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "connected") {
      setStudent(s => s ? { ...s, calendar_connected: true } : s);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleRegister = (s) => {
    setStudent(s);
    localStorage.setItem("cf_student", JSON.stringify(s));
    setPage("deadline");
  };

  const handleLogout = () => {
    setStudent(null);
    localStorage.removeItem("cf_student");
    setPage("register");
  };

  return (
    <div className="app-root">
      {/* Ambient background */}
      <div className="ambient" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">⬡</span>
            <span className="logo-text">Campus<em>Flow</em></span>
            <span className="logo-badge">v2.0</span>
          </div>

          <nav className="nav">
            {NAV.map(n => (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                className={`nav-btn ${page === n.id ? "active" : ""}`}
              >
                <span className="nav-icon">{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </button>
            ))}
          </nav>

          <div className="header-right">
            {student ? (
              <div className="user-chip">
                <span className="user-dot" />
                <span className="user-name">{student.name.split(" ")[0]}</span>
                {student.calendar_connected && <span className="cal-badge" title="Calendar connected">📅</span>}
                <button onClick={handleLogout} className="logout-btn" title="Log out">✕</button>
              </div>
            ) : (
              <span className="guest-label">Not registered</span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main">
        <div className="page-wrap">
          {page === "register"  && <Register onRegister={handleRegister} existingStudent={student} />}
          {page === "deadline"  && <Deadline student={student} />}
          {page === "summarize" && <Summarize student={student} />}
          {page === "chat"      && <Chat student={student} />}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #0a0a0f;
          --ink-2: #111118;
          --ink-3: #1a1a26;
          --border: rgba(255,255,255,0.07);
          --border-active: rgba(99,179,237,0.4);
          --text: #e8e8f0;
          --muted: #6b6b80;
          --accent: #63b3ed;
          --accent-2: #76e3b0;
          --accent-3: #f093fb;
          --danger: #fc8181;
          --warn: #f6ad55;
          --radius: 12px;
          --radius-lg: 20px;
        }

        body {
          background: var(--ink);
          color: var(--text);
          font-family: 'Syne', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .app-root { position: relative; min-height: 100vh; }

        /* Ambient background */
        .ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
          animation: drift 20s ease-in-out infinite;
        }
        .orb-1 { width: 600px; height: 600px; background: #63b3ed; top: -200px; right: -100px; animation-delay: 0s; }
        .orb-2 { width: 500px; height: 500px; background: #76e3b0; bottom: -150px; left: -100px; animation-delay: -7s; }
        .orb-3 { width: 400px; height: 400px; background: #f093fb; top: 40%; left: 30%; animation-delay: -14s; }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        .grid-overlay {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Header */
        .header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(10,10,15,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .header-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 0 24px; height: 60px;
          display: flex; align-items: center; gap: 32px;
        }
        .logo { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .logo-mark { font-size: 22px; color: var(--accent); line-height: 1; }
        .logo-text { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
        .logo-text em { font-style: normal; color: var(--accent); }
        .logo-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: var(--muted);
          border: 1px solid var(--border); border-radius: 4px;
          padding: 1px 5px;
        }

        .nav { display: flex; gap: 4px; flex: 1; justify-content: center; }
        .nav-btn {
          display: flex; align-items: center; gap-6px; gap: 6px;
          padding: 6px 14px; border-radius: 8px; border: none;
          background: transparent; color: var(--muted);
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease;
          letter-spacing: 0.3px;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.05); color: var(--text); }
        .nav-btn.active {
          background: rgba(99,179,237,0.1);
          color: var(--accent);
          border: 1px solid rgba(99,179,237,0.2);
        }
        .nav-icon { font-size: 15px; opacity: 0.8; }

        .header-right { margin-left: auto; flex-shrink: 0; }
        .user-chip {
          display: flex; align-items: center; gap: 6px;
          background: rgba(118,227,176,0.08);
          border: 1px solid rgba(118,227,176,0.2);
          border-radius: 100px; padding: 4px 10px 4px 8px;
        }
        .user-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent-2); }
        .user-name { font-size: 13px; font-weight: 600; color: var(--accent-2); }
        .cal-badge { font-size: 11px; }
        .logout-btn {
          background: none; border: none; color: var(--muted);
          cursor: pointer; font-size: 11px; padding: 0 2px;
          transition: color 0.15s;
        }
        .logout-btn:hover { color: var(--danger); }
        .guest-label { font-size: 12px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

        /* Main */
        .main { position: relative; z-index: 1; padding: 40px 24px 80px; }
        .page-wrap { max-width: 680px; margin: 0 auto; }

        /* Shared form styles used by all pages */
        .page-title {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 800; letter-spacing: -1px;
          line-height: 1.1; margin-bottom: 8px;
        }
        .page-sub { font-size: 15px; color: var(--muted); margin-bottom: 36px; line-height: 1.5; }

        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px;
        }
        .card + .card { margin-top: 16px; }

        .field { margin-bottom: 20px; }
        .field:last-of-type { margin-bottom: 0; }
        .field-label {
          display: block; font-size: 12px; font-weight: 700;
          letter-spacing: 0.8px; text-transform: uppercase;
          color: var(--muted); margin-bottom: 8px;
        }
        .field-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: var(--radius); padding: 12px 16px;
          color: var(--text); font-family: 'Syne', sans-serif; font-size: 15px;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.15); }
        .field-input:focus {
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px rgba(99,179,237,0.08);
        }
        .field-hint { font-size: 11px; color: var(--muted); margin-top: 5px; font-family: 'JetBrains Mono', monospace; }

        .btn-primary {
          width: 100%; padding: 14px 24px;
          background: var(--accent); color: var(--ink);
          border: none; border-radius: var(--radius);
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          letter-spacing: 0.3px; cursor: pointer;
          transition: all 0.15s ease;
          position: relative; overflow: hidden;
        }
        .btn-primary:hover { background: #90cdf4; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,179,237,0.25); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        .btn-secondary {
          padding: 10px 20px; background: transparent;
          border: 1px solid var(--border); border-radius: var(--radius);
          color: var(--text); font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.15s;
        }
        .btn-secondary:hover { border-color: var(--border-active); color: var(--accent); }

        .alert-error {
          background: rgba(252,129,129,0.08);
          border: 1px solid rgba(252,129,129,0.2);
          color: var(--danger); border-radius: var(--radius);
          padding: 12px 16px; font-size: 14px; margin-bottom: 16px;
        }
        .alert-success {
          background: rgba(118,227,176,0.08);
          border: 1px solid rgba(118,227,176,0.2);
          color: var(--accent-2); border-radius: var(--radius);
          padding: 12px 16px; font-size: 14px; margin-bottom: 16px;
        }
        .alert-warn {
          background: rgba(246,173,85,0.08);
          border: 1px solid rgba(246,173,85,0.2);
          color: var(--warn); border-radius: var(--radius);
          padding: 12px 16px; font-size: 14px; margin-bottom: 16px;
        }

        .spinner {
          display: inline-block; width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2); border-top-color: var(--ink);
          border-radius: 50%; animation: spin 0.6s linear infinite;
          vertical-align: middle; margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .tag {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 100px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; font-family: 'JetBrains Mono', monospace;
        }
        .tag-blue   { background: rgba(99,179,237,0.12);  color: var(--accent);   border: 1px solid rgba(99,179,237,0.2);  }
        .tag-green  { background: rgba(118,227,176,0.12); color: var(--accent-2); border: 1px solid rgba(118,227,176,0.2); }
        .tag-purple { background: rgba(240,147,251,0.12); color: var(--accent-3); border: 1px solid rgba(240,147,251,0.2); }
        .tag-warn   { background: rgba(246,173,85,0.12);  color: var(--warn);     border: 1px solid rgba(246,173,85,0.2);  }
        .tag-danger { background: rgba(252,129,129,0.12); color: var(--danger);   border: 1px solid rgba(252,129,129,0.2); }

        @media (max-width: 600px) {
          .nav-label { display: none; }
          .nav-btn { padding: 8px 10px; }
          .header-inner { gap: 16px; }
          .logo-badge { display: none; }
        }
      `}</style>
    </div>
  );
}
