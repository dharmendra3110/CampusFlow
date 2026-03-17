import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SAMPLE = `CMRIT — Examination Cell Notification
All 5th and 6th semester B.E. students are hereby informed that the Internal Assessment 2 (IA-2) examinations will be held from 20th March 2026. The timetable has been uploaded to the college portal. Students must compulsorily carry their college ID cards and hall tickets to the examination hall. Attendance in IA-2 is mandatory; absentees without prior medical documentation will be awarded zero marks. Results will be declared within 5 working days. The last date to submit lab records is 18th March 2026. Fee payment for the next semester must be completed by 25th March 2026. For grievances, visit the Examination Cell, Room 102 before 5:00 PM on working days.`;

const URGENCY_META = {
  HIGH:   { label:"HIGH",   class:"tag-danger", icon:"🔴" },
  MEDIUM: { label:"MEDIUM", class:"tag-warn",   icon:"🟡" },
  LOW:    { label:"LOW",    class:"tag-green",  icon:"🟢" },
};

export default function Summarize({ student }) {
  const [notice, setNotice]   = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError]     = useState("");
  const [addingAll, setAddingAll] = useState(false);
  const [addedMsg, setAddedMsg]   = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (notice.trim().length < 20) { setError("Please paste a longer notice text."); return; }
    setLoading(true); setError(""); setSummary(null); setAddedMsg("");
    try {
      const { data } = await axios.post(`${API}/summarize`, { notice });
      setSummary(data.summary);
    } catch (err) {
      setError(err.response?.data?.error || "AI summarization failed.");
    } finally { setLoading(false); }
  };

  const addAllDeadlines = async () => {
    if (!student?.telegram_username || !summary?.deadlines?.length) return;
    setAddingAll(true);
    let count = 0;
    for (const d of summary.deadlines) {
      try {
        await axios.post(`${API}/deadline`, {
          title: d.title, date: d.date, time: d.time,
          telegramUsername: student.telegram_username,
        });
        count++;
      } catch { /* skip individual failures */ }
    }
    setAddedMsg(`✓ Added ${count} deadline${count !== 1 ? "s" : ""} with WhatsApp reminders!`);
    setAddingAll(false);
  };

  const urgMeta = summary ? (URGENCY_META[summary.urgency] || URGENCY_META.MEDIUM) : null;

  return (
    <div>
      <div className="page-title">AI Notice<br />Summarizer</div>
      <p className="page-sub">
        Paste any college notice. Get a <span style={{ color:"var(--accent-3)" }}>smart 3-bullet summary</span>,
        extracted deadlines, and one-click calendar adding.
      </p>

      <div style={{ display:"flex", gap:8, marginBottom:28 }}>
        <span className="tag tag-purple">⚡ Groq LLaMA 3 70B</span>
        <span className="tag tag-green">Free API</span>
        <span className="tag tag-blue">Auto deadline detection</span>
      </div>

      <div className="card">
        <form onSubmit={submit}>
          <div className="field">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label className="field-label" style={{ marginBottom:0 }}>Paste College Notice</label>
              <button type="button" onClick={() => { setNotice(SAMPLE); setSummary(null); setAddedMsg(""); }}
                style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:600 }}>
                Load sample ↗
              </button>
            </div>
            <textarea
              value={notice}
              onChange={e => { setNotice(e.target.value); setError(""); setSummary(null); setAddedMsg(""); }}
              rows={7} placeholder="Paste exam notification, circular, fee notice…"
              className="field-input"
              style={{ resize:"vertical", lineHeight:1.6, fontSize:14 }}
            />
            <div className="field-hint">{notice.length} chars · Model: llama3-70b-8192</div>
          </div>

          {error && <div className="alert-error">⚠ {error}</div>}

          <button type="submit" className="btn-primary" disabled={loading || notice.trim().length < 20}>
            {loading ? <><span className="spinner"/>Analyzing notice...</> : "✦ Generate AI Summary"}
          </button>
        </form>
      </div>

      {/* Summary result */}
      {summary && (
        <div style={{ marginTop:20 }}>

          {/* Header strip */}
          <div style={{
            background:"rgba(240,147,251,0.06)",
            border:"1px solid rgba(240,147,251,0.2)",
            borderRadius:"var(--radius-lg) var(--radius-lg) 0 0",
            padding:"14px 20px",
            display:"flex", alignItems:"center", justifyContent:"space-between"
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:18 }}>✦</span>
              <span style={{ fontWeight:700, color:"var(--accent-3)" }}>AI Summary</span>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace" }}>{summary.department}</span>
              <span className={`tag ${urgMeta.class}`}>{urgMeta.icon} {urgMeta.label}</span>
            </div>
          </div>

          {/* Bullets */}
          <div style={{
            background:"rgba(255,255,255,0.02)",
            border:"1px solid rgba(240,147,251,0.15)",
            borderTop:"none", padding:"20px"
          }}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {summary.bullets?.map((b, i) => (
                <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <span style={{
                    width:26, height:26, borderRadius:"50%", flexShrink:0,
                    background:`rgba(240,147,251,${0.15 + i * 0.05})`,
                    border:"1px solid rgba(240,147,251,0.3)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:700, color:"var(--accent-3)", fontFamily:"'JetBrains Mono',monospace"
                  }}>{i + 1}</span>
                  <p style={{ fontSize:15, lineHeight:1.6, color:"var(--text)", paddingTop:3 }}>{b}</p>
                </div>
              ))}
            </div>

            {/* Action */}
            {summary.action && (
              <div style={{
                marginTop:20, paddingTop:16, borderTop:"1px solid var(--border)",
                display:"flex", gap:10, alignItems:"flex-start"
              }}>
                <span style={{ color:"var(--accent)", fontSize:16 }}>→</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", color:"var(--muted)", marginBottom:4, fontFamily:"'JetBrains Mono',monospace" }}>Action Required</div>
                  <div style={{ fontSize:14, color:"var(--text)" }}>{summary.action}</div>
                </div>
              </div>
            )}
          </div>

          {/* Extracted deadlines */}
          {summary.deadlines?.length > 0 && (
            <div style={{
              background:"rgba(99,179,237,0.04)",
              border:"1px solid rgba(99,179,237,0.15)",
              borderTop:"none", padding:"20px",
              borderRadius:"0 0 var(--radius-lg) var(--radius-lg)"
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>📅 Detected Deadlines ({summary.deadlines.length})</div>
                {student && (
                  <button className="btn-primary" onClick={addAllDeadlines} disabled={addingAll}
                    style={{ width:"auto", padding:"8px 16px", fontSize:13 }}>
                    {addingAll ? <><span className="spinner"/>Adding...</> : `+ Add All to Calendar`}
                  </button>
                )}
              </div>

              {addedMsg && <div className="alert-success" style={{ marginBottom:12 }}>{addedMsg}</div>}

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {summary.deadlines.map((d, i) => (
                  <div key={i} style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    background:"rgba(255,255,255,0.03)", borderRadius:"var(--radius)",
                    padding:"10px 14px", border:"1px solid var(--border)"
                  }}>
                    <span style={{ fontSize:14, fontWeight:600 }}>{d.title}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"var(--accent)" }}>
                      {d.date} {d.time}
                    </span>
                  </div>
                ))}
              </div>

              {!student && (
                <div style={{ marginTop:12, fontSize:12, color:"var(--muted)" }}>
                  💡 Register and connect Google Calendar to add these deadlines automatically.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
