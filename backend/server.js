const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function callGroq(messages, maxTokens = 600, jsonMode = false) {
  const body = {
    model: 'llama3-70b-8192',
    messages,
    max_tokens: maxTokens,
    temperature: 0.3,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    body,
    { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 20000 }
  );
  return res.data.choices[0].message.content.trim();
}

async function sendTelegram(chatId, message) {
  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    { chat_id: chatId, text: message, parse_mode: 'Markdown' }
  );
}

async function createCalendarEvent(googleTokens, event) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials(googleTokens);
  client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await supabase.from('students')
        .update({ google_tokens: { ...googleTokens, ...tokens } })
        .eq('gmail', event.gmail);
    }
  });
  const calendar = google.calendar({ version: 'v3', auth: client });
  return calendar.events.insert({
    calendarId: 'primary',
    resource: {
      summary: event.title,
      description: `CampusFlow deadline reminder for ${event.studentName}`,
      start: { dateTime: `${event.date}T${event.time}:00`, timeZone: 'Asia/Kolkata' },
      end:   { dateTime: `${event.date}T${event.time}:00`, timeZone: 'Asia/Kolkata' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 1440 },
        ],
      },
      colorId: '11',
    },
  });
}

// TELEGRAM WEBHOOK
app.post('/telegram-webhook', async (req, res) => {
  const message = req.body.message;
  if (!message) return res.sendStatus(200);
  const chatId   = message.chat.id;
  const username = message.from.username;
  const text     = message.text;

  if (text === '/start') {
    const { data } = await supabase.from('students')
      .update({ telegram_chat_id: chatId })
      .eq('telegram_username', username)
      .select().single();

    if (data) {
      await sendTelegram(chatId,
        `👋 Welcome to *CampusFlow*, ${data.name}!\n\n` +
        `You're now connected. You'll receive deadline reminders here.\n\n` +
        `_Built for CMRIT students_ 🎓`
      );
    } else {
      await sendTelegram(chatId,
        `👋 Hi! Please register first at:\n${process.env.FRONTEND_URL}\n\nThen send /start again.`
      );
    }
  }
  res.sendStatus(200);
});

// AUTH
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: req.query.telegramUsername,
  });
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state: telegramUsername } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    await supabase.from('students')
      .update({ google_tokens: tokens, calendar_connected: true })
      .eq('telegram_username', telegramUsername);
    res.redirect(`${process.env.FRONTEND_URL}?calendar=connected&user=${telegramUsername}`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}?calendar=error`);
  }
});

// REGISTER
app.post('/register', async (req, res) => {
  const { name, telegramUsername, gmail } = req.body;
  if (!name || !telegramUsername || !gmail)
    return res.status(400).json({ error: 'All fields required.' });

  const username = telegramUsername.replace(/^@/, '');
  const { data, error } = await supabase
    .from('students')
    .upsert({ name, telegram_username: username, gmail }, { onConflict: 'telegram_username' })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    success: true,
    student: data,
    message: `Registered! Now open Telegram, search @${process.env.TELEGRAM_BOT_USERNAME} and send /start to activate reminders.`
  });
});

app.get('/student/:username', async (req, res) => {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, telegram_username, telegram_chat_id, gmail, calendar_connected, created_at')
    .eq('telegram_username', req.params.username)
    .single();
  if (error) return res.status(404).json({ error: 'Student not found.' });
  res.json({ student: data });
});

// DEADLINE
app.post('/deadline', async (req, res) => {
  const { title, date, time, telegramUsername } = req.body;
  if (!title || !date || !time || !telegramUsername)
    return res.status(400).json({ error: 'All fields required.' });

  const username = telegramUsername.replace(/^@/, '');
  const { data: student, error: sErr } = await supabase
    .from('students').select('*').eq('telegram_username', username).single();
  if (sErr) return res.status(404).json({ error: 'Student not found. Please register first.' });

  const { data: deadline, error: dErr } = await supabase
    .from('deadlines')
    .insert({ title, date, time, student_username: username, student_name: student.name })
    .select().single();
  if (dErr) return res.status(500).json({ error: dErr.message });

  const results = { deadline, telegram: false, calendar: false };

  if (student.telegram_chat_id) {
    try {
      await sendTelegram(student.telegram_chat_id,
        `🚨 *Deadline Added — CampusFlow*\n\n` +
        `📌 *${title}*\n` +
        `📅 Date: ${date}\n` +
        `⏰ Time: ${time}\n\n` +
        `Good luck, ${student.name}! 💪`
      );
      results.telegram = true;
    } catch (e) {
      console.warn('Telegram send failed:', e.message);
    }
  }

  if (student.calendar_connected && student.google_tokens) {
    try {
      await createCalendarEvent(student.google_tokens, {
        title, date, time, gmail: student.gmail, studentName: student.name,
      });
      results.calendar = true;
    } catch (e) {
      console.warn('Calendar event failed:', e.message);
    }
  }

  if (process.env.N8N_WEBHOOK_URL) {
    axios.post(process.env.N8N_WEBHOOK_URL, {
      ...deadline, studentName: student.name, telegramUsername: username,
    }).catch(() => {});
  }

  const telegramMsg = results.telegram
    ? ' Telegram sent ✅'
    : student.telegram_chat_id ? ' Telegram failed ⚠️' : ' (Send /start to bot first)';

  res.json({
    success: true,
    message: `Deadline saved!${telegramMsg}${results.calendar ? ' Calendar event created ✅' : ''}`,
    results,
  });
});

app.get('/deadlines/:username', async (req, res) => {
  const { data, error } = await supabase
    .from('deadlines').select('*')
    .eq('student_username', req.params.username)
    .order('date', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deadlines: data });
});

// SUMMARIZE
app.post('/summarize', async (req, res) => {
  const { notice } = req.body;
  if (!notice || notice.trim().length < 20)
    return res.status(400).json({ error: 'Notice too short.' });

  const prompt = `You are an AI assistant for engineering college students in India.
Analyze this college notice and respond with ONLY valid JSON:
{
  "bullets": ["point 1", "point 2", "point 3"],
  "deadlines": [{"title": "event", "date": "YYYY-MM-DD", "time": "HH:MM"}],
  "action": "What the student must DO",
  "urgency": "LOW|MEDIUM|HIGH",
  "department": "which dept/all students"
}
Rules: exactly 3 bullets, extract all dates (use ${new Date().getFullYear()} if year missing), urgency HIGH = within 7 days.
Notice: """${notice}"""`;

  try {
    const raw = await callGroq([{ role: 'user', content: prompt }], 600, true);
    const parsed = JSON.parse(raw);
    res.json({ success: true, summary: parsed, extractedDeadlines: parsed.deadlines || [] });
  } catch (err) {
    console.error('Summarize error:', err.message);
    res.json({
      success: true,
      summary: {
        bullets: [
          'Important notice received — read the full text carefully.',
          'Check for any deadlines or dates mentioned in the notice.',
          'Contact your faculty or department office for clarification.',
        ],
        deadlines: [], action: 'Review the notice.', urgency: 'MEDIUM', department: 'All students',
      },
      extractedDeadlines: [],
    });
  }
});

app.post('/extract-deadlines', async (req, res) => {
  const { notice } = req.body;
  const prompt = `Extract deadlines from this notice. Return ONLY a JSON array:
[{"title": "event", "date": "YYYY-MM-DD", "time": "HH:MM"}]
Use ${new Date().getFullYear()} if year missing. Use "09:00" if no time. Return [] if none.
Notice: "${notice}"`;
  try {
    const raw = await callGroq([{ role: 'user', content: prompt }], 400, true);
    const deadlines = JSON.parse(raw);
    res.json({ success: true, deadlines: Array.isArray(deadlines) ? deadlines : [] });
  } catch {
    res.json({ success: true, deadlines: [] });
  }
});

// CHAT
const chatHistories = {};

app.post('/chat', async (req, res) => {
  const { message, telegramUsername } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required.' });

  let deadlineContext = 'No deadlines registered yet.';
  if (telegramUsername) {
    const { data } = await supabase
      .from('deadlines').select('title, date, time')
      .eq('student_username', telegramUsername.replace(/^@/, ''))
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true }).limit(10);
    if (data?.length)
      deadlineContext = data.map(d => `• ${d.title} — ${d.date} at ${d.time}`).join('\n');
  }

  const key = telegramUsername || 'guest';
  if (!chatHistories[key]) chatHistories[key] = [];
  chatHistories[key].push({ role: 'user', content: message });
  if (chatHistories[key].length > 20) chatHistories[key] = chatHistories[key].slice(-20);

  const systemPrompt = `You are CampusBot, a friendly AI assistant for engineering college students in India.
Today: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
Student's upcoming deadlines:\n${deadlineContext}
Be friendly, concise, actionable. Use Indian college context. Under 100 words unless asked for detail.`;

  try {
    const reply = await callGroq([{ role: 'system', content: systemPrompt }, ...chatHistories[key]], 300);
    chatHistories[key].push({ role: 'assistant', content: reply });
    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ error: 'Chat failed: ' + err.message });
  }
});

// BROADCAST
app.post('/broadcast', async (req, res) => {
  const { summary, adminKey } = req.body;
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: 'Unauthorized.' });

  const { data: students } = await supabase
    .from('students').select('name, telegram_chat_id')
    .not('telegram_chat_id', 'is', null);

  const results = [];
  for (const student of students || []) {
    try {
      await sendTelegram(student.telegram_chat_id,
        `📢 *Notice Summary — CampusFlow*\n\n${summary}\n\n_Sent to all registered students_`
      );
      results.push({ name: student.name, sent: true });
    } catch (e) {
      results.push({ name: student.name, sent: false, error: e.message });
    }
    await new Promise(r => setTimeout(r, 200));
  }
  res.json({ success: true, sent: results.filter(r => r.sent).length, total: students.length });
});

// HEALTH
app.get('/health', (req, res) => res.json({
  status: 'ok', version: '2.0.0',
  services: {
    supabase:  !!process.env.SUPABASE_URL,
    groq:      !!process.env.GROQ_API_KEY,
    telegram:  !!process.env.TELEGRAM_BOT_TOKEN,
    google:    !!process.env.GOOGLE_CLIENT_ID,
  }
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 CampusFlow v2 running on port ${PORT}`));
