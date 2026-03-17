import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Deadline({ student }) {
  const [form, setForm]       = useState({ title:"", date:"", time:"" });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [deadlines, setDeadlines] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (student?.telegram_username) fetchDeadlines();
  }, [student]);

  const fetchDeadlines = async () => {
    setLoadingList(true);
    try {
      const { data } = await axios.get(`${API}/deadlines/${student.telegram_username}`);
      setDeadlines(data.deadlines || []);
    } catch { /* ignore */ }
    finally { setLoadingList(false); }
  };

  const change = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); setResult(null); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time) { setError("All fields required."); return; }
    if (!student?.telegram_username) { setError("Please register first to send reminders."); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/deadline`, { ...form, telegramUsername: student.telegram_username });
      setResult(data);
      setForm({ title:"", date:"", time:"" });
      fetchDeadlines();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add deadline.");
    } finally { setLoading(false); }
  };

  const today = new Date().toISOString().split("T")[0];

  const urgencyOf = (dateStr) => {
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "past";
    if (diff < 2) return "danger";
    if (diff < 7) return "warn";
    return "ok";
  };

  return (
    <div>
      <div className="page-title">Add Deadline</div>
      <p className="page-sub">
        Each deadline triggers a{" "}
        <span style={{ color:"var(--accent-2)" }}>WhatsApp reminder</span>
        {student?.calendar_connected && <> + <span style={{ color:"var(--accent)" }}>Google Calendar event</span></>}.
      </p>

      {!student && (
        <div className="alert-warn" style={{ marginBottom:24 }}>
          ⚡ Register first to receive WhatsApp reminders.
        </div>
      )}

      {/* Add form */}
      <div className="card">
        <form onSubmit={submit}>
          {error  && <div className="alert-error">⚠ {error}</div>}
          {result && <div className="alert-success">✓ {result.message}</div>}

          <div className="field">
            <label className="field-label">Deadline Title</label>
            <input className="field-input" name="title" value={form.title}
              onChange={change} placeholder="e.g. DSA Assignment Submission" />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div className="field">
              <label className="field-label">Date</label>
              <input className="field-input" type="date" name="date" value={form.date}
                min={today} onChange={change} />
            </div>
            <div className="field">
              <label className="field-label">Time</label>
              <input className="field-input" type="time" name="time" value={form.time} onChange={change} />
            </div>
          </div>

          {/* Live WhatsApp preview */}
          {form.title && (
            <div style={{
              background:"rgba(37,211,102,0.06)", border:"1px solid rgba(37,211,102,0.2)",
              borderRadius:"var(--radius)", padding:"14px 16px", marginBottom:16
            }}>
              <div style={{ fontSize:11, color:"rgba(37,211,102,0.7)", fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>
                📱 WhatsApp Preview
              </div>
              <div style={{ fontSize:13, lineHeight:1.7, color:"#d4f5de", fontFamily:"'JetBrains Mono',monospace" }}>
                🚨 *Reminder from CampusFlow*<br/>
                <br/>
                📌 *{form.title}*<br/>
                📅 {form.date || "..."}<br/>
                ⏰ {form.time || "..."}<br/>
                <br/>
                Good luck, {student?.name?.split(" ")[0] || "Student"}! 💪
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? <><span className="spinner"/>Sending reminders...</>
              : `Add Deadline & Send Reminders ${student?.calendar_connected ? "📅" : "📱"}`
            }
          </button>
        </form>
      </div>

      {/* Integration status */}
      {student && (
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <span className="tag tag-green">📱 WhatsApp ready</span>
          {student.calendar_connected
            ? <span className="tag tag-blue">📅 Calendar connected</span>
            : <span className="tag" style={{ background:"rgba(255,255,255,0.04)", color:"var(--muted)", border:"1px solid var(--border)" }}>📅 Calendar not connected</span>
          }
        </div>
      )}

      {/* Deadlines list */}
      {student && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:18 }}>Your Deadlines</h3>
            <button className="btn-secondary" onClick={fetchDeadlines} style={{ padding:"6px 14px", fontSize:13 }}>
              ↻ Refresh
            </button>
          </div>

          {loadingList && <div style={{ color:"var(--muted)", fontSize:14 }}>Loading...</div>}

          {!loadingList && deadlines.length === 0 && (
            <div className="card" style={{ textAlign:"center", padding:"40px 20px", color:"var(--muted)" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>◌</div>
              No deadlines yet. Add one above!
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {deadlines.map(d => {
              const urg = urgencyOf(d.date);
              const tagClass = urg === "danger" ? "tag-danger" : urg === "warn" ? "tag-warn" : urg === "past" ? "" : "tag-green";
              const label = urg === "danger" ? "Soon!" : urg === "warn" ? "This week" : urg === "past" ? "Past" : "Upcoming";
              return (
                <div key={d.id} className="card" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{d.title}</div>
                    <div style={{ color:"var(--muted)", fontSize:13, marginTop:3, fontFamily:"'JetBrains Mono',monospace" }}>
                      {d.date} · {d.time}
                    </div>
                  </div>
                  <span className={`tag ${tagClass}`} style={!tagClass ? { color:"var(--muted)", border:"1px solid var(--border)" } : {}}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
