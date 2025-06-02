const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup (adjust secret and options as needed)
app.use(session({
  secret: 'your_secret_here',
  resave: false,
  saveUninitialized: false,
}));

// MongoDB User schema and model
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  bio: String,
  passwordHash: String, // Assume hashed password stored
  apiKey: String,
  systemPrompt: String,
});
const User = mongoose.model('User', userSchema);

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  next();
}

// Helper to generate API key
function generateApiKey() {
  return crypto.randomBytes(24).toString('hex');
}

// --- ROUTES ---

// 1. Landing page: list available APIs
app.get('/', requireLogin, (req, res) => {
  res.send(`
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Neon GPT API - Dashboard</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap');
          body {
            margin: 0;
            background: radial-gradient(circle at center, #0f0c29, #302b63, #24243e);
            font-family: 'Orbitron', monospace, sans-serif;
            color: #0ff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          nav {
            background: #0ff;
            color: #000;
            display: flex;
            justify-content: center;
            gap: 2rem;
            padding: 1rem 0;
            box-shadow:
              0 0 10px #0ff,
              0 0 20px #0ff;
            font-weight: 700;
            font-size: 1.1rem;
          }
          nav a {
            color: #000;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            background: #00e6e6;
            box-shadow:
              0 0 5px #0ff;
            transition: background-color 0.3s ease;
            position: relative;
          }
          nav a:hover {
            background: #0ff;
            color: #000;
            box-shadow:
              0 0 15px #0ff,
              0 0 30px #0ff;
          }
          nav a.settings-link span {
            position: absolute;
            top: 0;
            right: -8px;
            background: #0ff;
            color: #000;
            font-size: 0.6rem;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 12px;
            box-shadow: 0 0 8px #0ff;
            user-select: none;
          }
          main {
            flex: 1;
            max-width: 700px;
            margin: 2rem auto;
            padding: 0 1rem;
            width: 100%;
          }
          h1 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 2rem;
            text-shadow:
              0 0 10px #0ff,
              0 0 20px #0ff;
          }
          ul.api-list {
            list-style: none;
            padding: 0;
            max-width: 400px;
            margin: 0 auto;
          }
          ul.api-list li {
            background: #001f33;
            margin-bottom: 1rem;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow:
              0 0 15px #0ff inset;
            font-size: 1.2rem;
            cursor: pointer;
            transition: box-shadow 0.3s ease;
          }
          ul.api-list li:hover {
            box-shadow:
              0 0 25px #0ff inset,
              0 0 30px #0ff;
          }
          ul.api-list li a {
            color: #0ff;
            text-decoration: none;
            display: block;
          }
          @media (max-width: 600px) {
            ul.api-list li {
              font-size: 1rem;
              padding: 0.75rem 1rem;
            }
          }
        </style>
      </head>
      <body>
        <nav>
          <a href="/" aria-current="page">APIs</a>
          <a href="/app">GPT API</a>
          <a href="/settings" class="settings-link">
            Settings
            <span>⚙️</span>
          </a>
          <a href="/logout">Logout</a>
        </nav>
        <main>
          <h1>Available APIs</h1>
          <ul class="api-list" role="list">
            <li><a href="/app" tabindex="0">GPT-like AI API</a></li>
            <li><a href="#" tabindex="0" aria-disabled="true" style="opacity:0.5; cursor:not-allowed;">Other API (coming soon)</a></li>
            <li><a href="#" tabindex="0" aria-disabled="true" style="opacity:0.5; cursor:not-allowed;">Another API (coming soon)</a></li>
          </ul>
        </main>
      </body>
    </html>
  `);
});

// 2. GPT API test page
app.get('/app', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/logout');

    res.send(`
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Neon GPT API - Dashboard</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap');
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              background: radial-gradient(circle at center, #0f0c29, #302b63, #24243e);
              font-family: 'Orbitron', monospace, sans-serif;
              color: #0ff;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            nav {
              background: #0ff;
              color: #000;
              display: flex;
              justify-content: center;
              gap: 2rem;
              padding: 1rem 0;
              box-shadow:
                0 0 10px #0ff,
                0 0 20px #0ff;
              font-weight: 700;
              font-size: 1.1rem;
            }
            nav a {
              color: #000;
              text-decoration: none;
              padding: 0.5rem 1rem;
              border-radius: 8px;
              background: #00e6e6;
              box-shadow:
                0 0 5px #0ff;
              transition: background-color 0.3s ease;
              position: relative;
            }
            nav a:hover {
              background: #0ff;
              color: #000;
              box-shadow:
                0 0 15px #0ff,
                0 0 30px #0ff;
            }
            nav a.settings-link span {
              position: absolute;
              top: 0;
              right: -8px;
              background: #0ff;
              color: #000;
              font-size: 0.6rem;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 12px;
              box-shadow: 0 0 8px #0ff;
              user-select: none;
            }
            main {
              flex: 1;
              max-width: 900px;
              margin: 2rem auto;
              padding: 0 1rem;
              width: 100%;
            }
            h1 {
              text-align: center;
              font-size: 2.5rem;
              margin-bottom: 1rem;
              text-shadow:
                0 0 10px #0ff,
                0 0 20px #0ff;
            }
            .apikey-container {
              background: #001f33;
              border: 2px solid #0ff;
              border-radius: 12px;
              padding: 1rem;
              font-family: monospace;
              font-size: 1.2rem;
              text-align: center;
              user-select: all;
              margin-bottom: 2rem;
              cursor: pointer;
              box-shadow:
                0 0 10px #0ff,
                inset 0 0 15px #0ff;
              transition: box-shadow 0.3s ease;
            }
            .apikey-container:hover {
              box-shadow:
                0 0 20px #0ff,
                inset 0 0 25px #0ff;
            }
            label {
              display: block;
              font-weight: 700;
              margin-bottom: 0.5rem;
              font-size: 1.2rem;
              text-shadow: 0 0 10px #0ff;
            }
            textarea {
              width: 100%;
              min-height: 140px;
              padding: 1rem;
              font-size: 1rem;
              border: none;
              border-radius: 12px;
              background: #001f33;
              color: #0ff;
              box-shadow:
                inset 0 0 15px #0ff;
              resize: vertical;
              font-family: 'Orbitron', monospace, sans-serif;
              transition: box-shadow 0.3s ease;
            }
            textarea:focus {
              outline: none;
              box-shadow:
                0 0 20px #0ff,
                inset 0 0 25px #0ff;
            }
            button {
              background: #0ff;
              color: #000;
              border: none;
              padding: 0.75rem 2rem;
              font-size: 1.2rem;
              font-weight: 700;
              border-radius: 12px;
              cursor: pointer;
              margin-top: 1.5rem;
              display: block;
              width: 100%;
              max-width: 320px;
              margin-left: auto;
              margin-right: auto;
              box-shadow:
                0 0 15px #0ff,
                0 0 30px #0ff;
              transition: background-color 0.3s ease;
            }
            button:hover {
              background: #00e6e6;
              box-shadow:
                0 0 25px #0ff,
                0 0 50px #0ff;
            }
            #response {
              margin-top: 2rem;
              background: #001f33;
              border-radius: 12px;
              padding: 1rem 1.5rem;
              box-shadow:
                0 0 15px #0ff inset;
              white-space: pre-wrap;
              font-size: 1rem;
              min-height: 120px;
              color: #0ff;
              font-family: 'Orbitron', monospace, sans-serif;
            }
            #toast {
              visibility: hidden;
              min-width: 250px;
              max-width: 90vw;
              margin-left: -125px;
              background-color: #0ff;
              color: #000;
              text-align: center;
              border-radius: 12px;
              padding: 16px;
              position: fixed;
              z-index: 1000;
              left: 50%;
              bottom: 30px;
              font-size: 17px;
              opacity: 0;
              transition: opacity 0.5s, visibility 0.5s;
              word-wrap: break-word;
              font-weight: 700;
              box-shadow:
                0 0 15px #0ff,
                0 0 30px #0ff;
            }
            #toast.show {
              visibility: visible;
              opacity: 1;
            }
            @media (max-width: 600px) {
              nav {
                gap: 1rem;
                font-size: 1rem;
              }
              button {
                max-width: 100%;
              }
              .apikey-container {
                font-size: 1rem;
                padding: 0.75rem;
              }
              textarea {
                min-height: 120px;
                font-size: 0.95rem;
              }
            }
          </style>
        </head>
        <body>
          <nav>
            <a href="/">APIs</a>
            <a href="/app" aria-current="page">GPT API</a>
            <a href="/settings" class="settings-link">
              Settings
              <span>⚙️</span>
            </a>
            <a href="/logout">Logout</a>
          </nav>
          <main>
            <h1>Welcome to Neon GPT API</h1>
            <p style="text-align:center; font-size:1rem; color:#0ff; margin-bottom:1rem;">
              Your API key (click to copy):
            </p>
            <div class="apikey-container" title="Click to copy your API key" onclick="copyApiKey()">${user.apiKey}</div>
            <label for="prompt">Enter your prompt:</label>
            <textarea id="prompt" placeholder="Type your prompt here..."></textarea>
            <button onclick="generate()">Generate</button>
            <div id="response" aria-live="polite" aria-atomic="true"></div>
          </main>
          <div id="toast" role="alert" aria-live="assertive"></div>

          <script>
            function showToast(message, isError = false) {
              const toast = document.getElementById('toast');
              toast.textContent = message;
              toast.style.backgroundColor = isError ? '#e74c3c' : '#0ff';
              toast.style.color = isError ? '#fff' : '#000';
              toast.className = 'show';
              setTimeout(() => {
                toast.className = toast.className.replace('show', '');
              }, 3000);
            }

            function copyApiKey() {
              const apiKey = document.querySelector('.apikey-container').textContent;
              navigator.clipboard.writeText(apiKey).then(() => {
                showToast('API key copied to clipboard!');
              }).catch(() => {
                showToast('Failed to copy API key', true);
              });
            }

            async function generate() {
              const prompt = document.getElementById('prompt').value.trim();
              if (!prompt) {
                showToast('Please enter a prompt', true);
                return;
              }
              const responseDiv = document.getElementById('response');
              responseDiv.textContent = 'Loading...';

              try {
                const res = await fetch('/generate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': '${user.apiKey}'
                  },
                  body: JSON.stringify({ prompt })
                });
                const data = await res.json();
                if (res.ok) {
                  responseDiv.textContent = data.generatedText;
                  showToast('Response generated successfully');
                } else {
                  responseDiv.textContent = '';
                  showToast(data.error || 'Unknown error', true);
                }
              } catch (err) {
                responseDiv.textContent = '';
                showToast('Request failed: ' + err.message, true);
              }
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.redirect('/logout');
  }
});

// 3. Settings page GET
app.get('/settings', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/logout');

    const systemPrompt = user.systemPrompt || "You are a helpful assistant that provides clear and concise answers.";

    res.send(`
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Neon GPT API - Settings</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap');
            body {
              margin: 0;
              background: radial-gradient(circle at center, #0f0c29, #302b63, #24243e);
              font-family: 'Orbitron', monospace, sans-serif;
              color: #0ff;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            nav {
              background: #0ff;
              color: #000;
              display: flex;
              justify-content: center;
              gap: 2rem;
              padding: 1rem 0;
              box-shadow:
                0 0 10px #0ff,
                0 0 20px #0ff;
              font-weight: 700;
              font-size: 1.1rem;
            }
            nav a {
              color: #000;
              text-decoration: none;
              padding: 0.5rem 1rem;
              border-radius: 8px;
              background: #00e6e6;
              box-shadow:
                0 0 5px #0ff;
              transition: background-color 0.3s ease;
              position: relative;
            }
            nav a:hover {
              background: #0ff;
              color: #000;
              box-shadow:
                0 0 15px #0ff,
                0 0 30px #0ff;
            }
            nav a.settings-link span {
              position: absolute;
              top: 0;
              right: -8px;
              background: #0ff;
              color: #000;
              font-size: 0.6rem;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 12px;
              box-shadow: 0 0 8px #0ff;
              user-select: none;
            }
            main {
              flex: 1;
              max-width: 700px;
              margin: 2rem auto;
              padding: 0 1rem;
              width: 100%;
            }
            h1 {
              text-align: center;
              font-size: 2.5rem;
              margin-bottom: 2rem;
              text-shadow:
                0 0 10px #0ff,
                0 0 20px #0ff;
            }
            form {
              background: #001f33;
              padding: 2rem;
              border-radius: 15px;
              box-shadow:
                0 0 15px #0ff inset;
            }
            label {
              display: block;
              font-weight: 700;
              margin-bottom: 0.5rem;
              font-size: 1.1rem;
              text-shadow: 0 0 10px #0ff;
            }
            input[type="text"], input[type="email"], textarea {
              width: 100%;
              padding: 0.75rem;
              font-size: 1rem;
              border: none;
              border-radius: 12px;
              background: #001f33;
              color: #0ff;
              box-shadow:
                inset 0 0 15px #0ff;
              margin-bottom: 1.5rem;
              font-family: 'Orbitron', monospace, sans-serif;
              resize: vertical;
              transition: box-shadow 0.3s ease;
            }
            input[type="text"]:focus, input[type="email"]:focus, textarea:focus {
              outline: none;
              box-shadow:
                0 0 20px #0ff,
                inset 0 0 25px #0ff;
            }
            .apikey-container {
              background: #001f33;
              border: 2px solid #0ff;
              border-radius: 12px;
              padding: 1rem;
              font-family: monospace;
              font-size: 1.2rem;
              text-align: center;
              user-select: all;
              margin-bottom: 1rem;
              cursor: pointer;
              box-shadow:
                0 0 10px #0ff,
                inset 0 0 15px #0ff;
              transition: box-shadow 0.3s ease;
            }
            .apikey-container:hover {
              box-shadow:
                0 0 20px #0ff,
                inset 0 0 25px #0ff;
            }
            button {
              background: #0ff;
              color: #000;
              border: none;
              padding: 0.75rem 2rem;
              font-size: 1.2rem;
              font-weight: 700;
              border-radius: 12px;
              cursor: pointer;
              margin-top: 1rem;
              box-shadow:
                0 0 15px #0ff,
                0 0 30px #0ff;
              transition: background-color 0.3s ease;
              display: block;
              width: 100%;
              max-width: 320px;
              margin-left: auto;
              margin-right: auto;
            }
            button:hover {
              background: #00e6e6;
              box-shadow:
                0 0 25px #0ff,
                0 0 50px #0ff;
            }
            #toast {
              visibility: hidden;
              min-width: 250px;
              max-width: 90vw;
              margin-left: -125px;
              background-color: #0ff;
              color: #000;
              text-align: center;
              border-radius: 12px;
              padding: 16px;
              position: fixed;
              z-index: 1000;
              left: 50%;
              bottom: 30px;
              font-size: 17px;
              opacity: 0;
              transition: opacity 0.5s, visibility 0.5s;
              word-wrap: break-word;
              font-weight: 700;
              box-shadow:
                0 0 15px #0ff,
                0 0 30px #0ff;
            }
            #toast.show {
              visibility: visible;
              opacity: 1;
            }
            @media (max-width: 600px) {
              nav {
                gap: 1rem;
                font-size: 1rem;
              }
              button {
                max-width: 100%;
              }
              input[type="text"], input[type="email"], textarea {
                font-size: 0.95rem;
              }
            }
          </style>
        </head>
        <body>
          <nav>
            <a href="/">APIs</a>
            <a href="/app">GPT API</a>
            <a href="/settings" class="settings-link" aria-current="page">
              Settings
              <span>⚙️</span>
            </a>
            <a href="/logout">Logout</a>
          </nav>
          <main>
            <h1>Settings</h1>
            <form id="settingsForm">
              <label for="apikey">API Key (click to copy)</label>
              <div class="apikey-container" id="apikey" title="Click to copy your API key">${user.apiKey || 'Not generated yet'}</div>
              <button type="button" id="regenerateBtn">Regenerate API Key</button>

              <label for="username">Username</label>
              <input type="text" id="username" name="username" value="${user.username || ''}" required />

              <label for="email">Email</label>
              <input type="email" id="email" name="email" value="${user.email || ''}" required />

              <label for="bio">Bio</label>
              <textarea id="bio" name="bio" rows="3" placeholder="Tell us about yourself...">${user.bio || ''}</textarea>

              <label for="systemPrompt">System Prompt</label>
              <textarea id="systemPrompt" name="systemPrompt" rows="5" placeholder="System prompt for AI">${systemPrompt}</textarea>

              <button type="submit">Save Settings</button>
            </form>
          </main>
          <div id="toast" role="alert" aria-live="assertive"></div>

          <script>
            const toast = document.getElementById('toast');
            const apikeyDiv = document.getElementById('apikey');
            const regenerateBtn = document.getElementById('regenerateBtn');
            const form = document.getElementById('settingsForm');

            function showToast(message, isError = false) {
              toast.textContent = message;
              toast.style.backgroundColor = isError ? '#e74c3c' : '#0ff';
              toast.style.color = isError ? '#fff' : '#000';
              toast.className = 'show';
              setTimeout(() => {
                toast.className = toast.className.replace('show', '');
              }, 3000);
            }

            apikeyDiv.addEventListener('click', () => {
              const text = apikeyDiv.textContent;
              navigator.clipboard.writeText(text).then(() => {
                showToast('API key copied to clipboard!');
              }).catch(() => {
                showToast('Failed to copy API key', true);
              });
            });

            regenerateBtn.addEventListener('click', async () => {
              regenerateBtn.disabled = true;
              regenerateBtn.textContent = 'Regenerating...';
              try {
                const res = await fetch('/settings/api-key/regenerate', { method: 'POST' });
                if (res.ok) {
                  const data = await res.json();
                  apikeyDiv.textContent = data.apiKey;
                  showToast('API key regenerated!');
                } else {
                  showToast('Failed to regenerate API key', true);
                }
              } catch {
                showToast('Network error during regeneration', true);
              } finally {
                regenerateBtn.disabled = false;
                regenerateBtn.textContent = 'Regenerate API Key';
              }
            });

            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const formData = {
                username: form.username.value.trim(),
                email: form.email.value.trim(),
                bio: form.bio.value.trim(),
                systemPrompt: form.systemPrompt.value.trim(),
              };
              if (!formData.username || !formData.email) {
                showToast('Username and Email are required', true);
                return;
              }
              try {
                const res = await fetch('/settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(formData),
                });
                if (res.ok) {
                  showToast('Settings saved successfully');
                } else {
                  const data = await res.json();
                  showToast(data.error || 'Failed to save settings', true);
                }
              } catch {
                showToast('Network error while saving settings', true);
              }
            });
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.redirect('/logout');
  }
});

// 4. Settings page// 4. Settings page POST (save user info and system prompt)
app.post('/settings', requireLogin, async (req, res) => {
  try {
    const { username, email, bio, systemPrompt } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and Email are required' });
    }
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    user.username = username;
    user.email = email;
    user.bio = bio || '';
    user.systemPrompt = systemPrompt || '';
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Regenerate API key POST
app.post('/settings/api-key/regenerate', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    user.apiKey = generateApiKey();
    await user.save();

    res.json({ apiKey: user.apiKey });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Generate GPT response POST
app.post('/generate', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'API key required' });

    const user = await User.findOne({ apiKey });
    if (!user) return res.status(403).json({ error: 'Invalid API key' });

    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // Here you would integrate with your GPT backend or OpenAI API.
    // For demonstration, we simulate a response:
    const systemPrompt = user.systemPrompt || "You are a helpful assistant that provides clear and concise answers.";
    const generatedText = `Simulated response for prompt: "${prompt}"\n\n[System prompt was: "${systemPrompt}"]`;

    res.json({ generatedText });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI | 'mongodb+srv://mateochatbot:xdtL2bYQ9eV3CeXM@gerald.r2hjy.mongodb.net/mateo-apis?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Neon GPT API server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
