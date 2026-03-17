import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SUGGESTIONS = [
  "When is my next deadline?",
  "How do I study for internals?",
  "What should I do 2 days before an exam?",
  "How to write a good lab record?",
  "Motivate me, I'm stressed 😅",
];

export default function Chat({ student }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: student
        ? `Hey ${student.name.split(" ")[0]}! 👋 I'm CampusBot — your AI study assistant. I know your upcoming deadlines and I'm here to help. Ask me anything!`
        : "Hey! 👋 I'm CampusBot. Register first so I can see your deadlines and give personalized advice. For now, ask me anything!",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/chat`, { message: msg, telegramUsername: student?.telegram_username });
      setMessages(m => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Sorry, I'm having trouble connecting right now. Make sure the backend is running!" }]);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-title">CampusBot</div>
      <p className="page-sub">
        Your AI study assistant — knows your deadlines, answers questions,
        and keeps you on track.
      </p>

      {/* Chat window */}
      <div style={{
        background:"rgba(255,255,255,0.02)",
        border:"1px solid var(--border)",
        borderRadius:"var(--radius-lg)",
        height:420, overflowY:"auto",
        padding:"20px", display:"flex", flexDirection:"column", gap:12
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{
                width:28, height:28, borderRadius:"50%", flexShrink:0,
                background:"linear-gradient(135deg, var(--accent), var(--accent-3))",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, marginRight:8, marginTop:2
              }}>⬡</div>
            )}
            <div style={{
              maxWidth:"75%",
              background: m.role === "user"
                ? "linear-gradient(135deg, rgba(99,179,237,0.2), rgba(118,227,176,0.1))"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${m.role === "user" ? "rgba(99,179,237,0.2)" : "var(--border)"}`,
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
              padding:"12px 16px",
              fontSize:14, lineHeight:1.6,
              color: m.role === "user" ? "var(--accent)" : "var(--text)",
              whiteSpace:"pre-wrap"
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{
              width:28, height:28, borderRadius:"50%",
              background:"linear-gradient(135deg, var(--accent), var(--accent-3))",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:13
            }}>⬡</div>
            <div style={{
              background:"rgba(255,255,255,0.04)", border:"1px solid var(--border)",
              borderRadius:"4px 16px 16px 16px", padding:"12px 16px"
            }}>
              <span style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width:6, height:6, borderRadius:"50%",
                    background:"var(--muted)", display:"inline-block",
                    animation:`bounce 1s ease-in-out ${i * 0.15}s infinite`
                  }}/>
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"12px 0", scrollbarWidth:"none" }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)} disabled={loading}
            style={{
              flexShrink:0, padding:"7px 14px",
              background:"rgba(255,255,255,0.04)", border:"1px solid var(--border)",
              borderRadius:100, color:"var(--muted)", fontSize:13, fontFamily:"'Syne',sans-serif",
              cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s"
            }}
            onMouseEnter={e => { e.target.style.borderColor = "rgba(99,179,237,0.3)"; e.target.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--muted)"; }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display:"flex", gap:10, marginTop:4 }}>
        <input
          className="field-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask anything about your studies, deadlines, exams…"
          style={{ flex:1 }}
          disabled={loading}
        />
        <button className="btn-primary" onClick={() => send()} disabled={loading || !input.trim()}
          style={{ width:"auto", padding:"12px 20px" }}>
          ↑
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
