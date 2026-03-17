import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Register({ onRegister, existingStudent }) {
const [form, setForm] = useState({ name: "", telegramUsername: "", gmail: "" });  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const change = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.telegramUsername || !form.gmail) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/register`, form);
      onRegister(data.student);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Is the backend running?");
    } finally { setLoading(false); }
  };

  const connectCalendar = () => {
    const username = existingStudent?.telegram_username || form.telegramUsername;
    if (!username) { setError("Register or enter your Telegram username first."); return; }
    window.location.href = `${API}/auth/google?telegramUsername=${encodeURIComponent(username)}`;
  };

  if (existingStudent) {
    return (
      <div>
        <div className="page-title">Welcome back,<br />{existingStudent.name.split(" ")[0]} 👋</div>
        <p className="page-sub">You're logged in. Head to Deadlines to add a reminder.</p>

        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>{existingStudent.name}</div>
              <div style={{ color:"var(--muted)", fontSize:13, marginTop:2, fontFamily:"'JetBrains Mono',monospace" }}>{existingStudent.phone}</div>
              <div style={{ color:"var(--muted)", fontSize:13, fontFamily:"'JetBrains Mono',monospace" }}>{existingStudent.gmail}</div>
            </div>
            <span className="tag tag-green">● Active</span>
          </div>

          {existingStudent.calendar_connected ? (
            <div className="alert-success">📅 Google Calendar connected — events will be auto-created!</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div className="alert-warn">
                ⚡ Connect Google Calendar to auto-create deadline events in your calendar.
              </div>
              <button className="btn-primary" onClick={connectCalendar}>
                🔗 Connect Google Calendar
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop:16 }}>
          <p style={{ fontSize:12, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace" }}>
            Not you? <button onClick={() => { localStorage.removeItem("cf_student"); window.location.reload(); }}
              style={{ color:"var(--accent)", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"inherit" }}>
              Sign out
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Get Started<br />with CampusFlow</div>
      <p className="page-sub">Register once. Get WhatsApp reminders + Google Calendar events for every deadline.</p>

      <div className="card">
        <form onSubmit={submit}>
          {error && <div className="alert-error">⚠ {error}</div>}

          <div className="field">
            <label className="field-label">Full Name</label>
            <input className="field-input" name="name" value={form.name}
              onChange={change} placeholder="Arjun Sharma" />
          </div>

          <div className="field">
  <label className="field-label">Telegram Username</label>
  <input className="field-input" name="telegramUsername" 
    value={form.telegramUsername}
    onChange={change} placeholder="@yourusername" />
  <div className="field-hint">Open Telegram → Settings → your username starting with @</div>
</div>

          <div className="field">
            <label className="field-label">Gmail Address</label>
            <input className="field-input" name="gmail" value={form.gmail}
              onChange={change} placeholder="arjun@gmail.com" type="email" />
            <div className="field-hint">Used for Google Calendar integration.</div>
          </div>

          <div style={{ height: 8 }} />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><span className="spinner"/>Registering...</> : "Register & Get Welcome Message →"}
          </button>
        </form>
      </div>

      {/* What you get section */}
      <div style={{ marginTop: 24, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        {[
          { icon:"📱", title:"WhatsApp", desc:"Instant reminders on your phone" },
          { icon:"📅", title:"Calendar", desc:"Auto Google Calendar events" },
          { icon:"🤖", title:"AI Notice", desc:"Smart 3-bullet summaries" },
        ].map(f => (
          <div key={f.title} className="card" style={{ padding:16, textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{f.icon}</div>
            <div style={{ fontWeight:700, fontSize:13 }}>{f.title}</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
