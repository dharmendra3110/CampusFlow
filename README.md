# 🎓 CampusFlow v2 — Production Deployment Guide

> Real WhatsApp · Real Google Calendar · Real AI · Real users

---

## 📁 Structure
```
campusflow-v2/
├── backend/
│   ├── server.js              # All endpoints (register, deadline, summarize, chat, auth)
│   ├── package.json
│   ├── .env.example           # All env vars documented
│   └── supabase-schema.sql    # Run this in Supabase SQL Editor
└── frontend/
    └── src/
        ├── App.jsx            # Layout, nav, Google OAuth return handler
        └── pages/
            ├── Register.jsx   # Registration + Google Calendar connect button
            ├── Deadline.jsx   # Add deadlines + live list
            ├── Summarize.jsx  # AI summary + auto deadline extraction
            └── Chat.jsx       # CampusBot AI chatbot
```

---

## 🚀 Step-by-Step Deployment

### STEP 1 — Supabase (Database) ~10 min

1. Go to **https://supabase.com** → Create account → New Project
2. Note your **Project URL** and **service_role API key** (Settings → API)
3. Go to **SQL Editor** → New Query → paste contents of `supabase-schema.sql` → Run

```
Tables created:
  students  (name, phone, gmail, google_tokens, calendar_connected)
  deadlines (title, date, time, student_phone)
```

---

### STEP 2 — Groq API (AI) ~2 min

1. Go to **https://console.groq.com** → Sign up (free, no credit card)
2. API Keys → Create New → Copy key
3. Model used: `llama3-70b-8192` — fastest & smartest free model

---

### STEP 3 — Twilio WhatsApp ~15 min

#### For testing (Sandbox — free, works immediately):
1. **https://twilio.com/console** → Sign up
2. Messaging → Try it out → Send a WhatsApp message
3. From your phone, send: `join <sandbox-word>` to **+1 415 523 8886**
4. Copy your **Account SID** and **Auth Token**
5. `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`

#### For production (Real users — takes 1-2 days approval):
1. Twilio Console → Messaging → Senders → WhatsApp Senders
2. Click **"Request Access"**
   - Business name: CampusFlow
   - Use case: Transactional reminders for students
   - Website: your Vercel URL
3. Wait for Meta approval (usually 24-48 hours)
4. Once approved, update `TWILIO_WHATSAPP_FROM` to your new number

---

### STEP 4 — Google Calendar OAuth2 ~15 min

1. Go to **https://console.cloud.google.com**
2. Create new project → name it "CampusFlow"
3. **APIs & Services → Enable APIs** → search "Google Calendar API" → Enable
4. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: add both:
     - `http://localhost:5000/auth/callback` (for local dev)
     - `https://your-backend.onrender.com/auth/callback` (for production)
5. Download credentials → copy **Client ID** and **Client Secret**
6. **OAuth consent screen** → External → Add your Gmail as test user during development

> The flow: User clicks "Connect Google Calendar" → redirected to Google → approves → redirected back → tokens saved to Supabase → calendar events auto-created from now on.

---

### STEP 5 — Deploy Backend to Render ~10 min

1. Push your `campusflow-v2` folder to GitHub
2. Go to **https://render.com** → New → Web Service
3. Connect your GitHub repo → select `backend/` as root directory
4. Settings:
   - Build command: `npm install`
   - Start command: `node server.js`
   - Environment: Node
5. Add all environment variables from `.env.example`
6. Deploy → copy your URL: `https://campusflow-backend.onrender.com`

---

### STEP 6 — Deploy Frontend to Vercel ~5 min

1. Go to **https://vercel.com** → Import your GitHub repo
2. Root directory: `frontend/`
3. Add environment variable:
   - `VITE_API_URL` = `https://campusflow-backend.onrender.com`
4. Deploy → get your URL: `https://campusflow.vercel.app`
5. Go back to Render → update `FRONTEND_URL` env var to Vercel URL
6. Go back to Google Cloud Console → add your Vercel URL + `/auth/callback` to authorized redirect URIs

---

## 🔑 Complete .env Reference

```env
PORT=5000
FRONTEND_URL=https://campusflow.vercel.app

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...   # service_role key (NOT anon key)

# Groq
GROQ_API_KEY=gsk_xxxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   # sandbox
# TWILIO_WHATSAPP_FROM=whatsapp:+1YOURAPPROVED  # production

# Google Calendar
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=https://campusflow-backend.onrender.com/auth/callback

# Optional n8n
N8N_WEBHOOK_URL=https://xxxx.app.n8n.cloud/webhook/campusflow

# Admin broadcast endpoint
ADMIN_KEY=make-this-a-random-secret
```

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register student, send welcome WhatsApp |
| GET | `/student/:phone` | Get student profile |
| GET | `/auth/google?phone=` | Start Google OAuth flow |
| GET | `/auth/callback` | Google OAuth return handler |
| POST | `/deadline` | Add deadline → WhatsApp + Calendar |
| GET | `/deadlines/:phone` | List student's deadlines |
| POST | `/summarize` | AI notice summary + deadline extraction |
| POST | `/extract-deadlines` | Extract just deadlines from text |
| POST | `/chat` | CampusBot AI chat with student context |
| POST | `/broadcast` | Send summary to ALL students (admin) |
| GET | `/health` | Service status check |

---

## 🤖 AI Improvements in v2

| Feature | v1 | v2 |
|---------|----|----|
| Model | LLaMA 3 8B | **LLaMA 3 70B** (much smarter) |
| Summary | 3 bullets | 3 bullets + urgency + action + dept |
| Deadlines | Manual entry only | **Auto-extracted from notice** |
| Chatbot | None | **Full context-aware CampusBot** |
| Response format | Plain text | **Structured JSON** |

---

## 🎬 User Flow

```
Register → Welcome WhatsApp sent automatically
     ↓
Connect Google Calendar (OAuth2 - one click)
     ↓
Add Deadline → WhatsApp + Calendar event created instantly
     ↓
Paste Notice → AI Summary + Auto-detect deadlines
     ↓
One-click "Add All to Calendar" for extracted deadlines
     ↓
Chat with CampusBot → personalized advice with deadline context
```

---

## 🔐 Security Checklist Before Going Live

- [ ] Move `ADMIN_KEY` to a random 32-char string
- [ ] Enable Supabase Row Level Security (already in schema)
- [ ] Store `google_tokens` encrypted (add `pgcrypto` to Supabase)
- [ ] Add rate limiting: `npm install express-rate-limit`
- [ ] Never expose `SUPABASE_SERVICE_KEY` — server-side only
- [ ] Add Google Cloud Console domain verification
- [ ] Set `TWILIO_WHATSAPP_FROM` to approved business number for production

---

*Ship it. Demo it. Own it. 🚀*
