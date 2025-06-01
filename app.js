const express = require('express');
const session = require('express-session');
const axios = require('axios');
const crypto = require('crypto');
const fetch = require('node-fetch');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

const RECAPTCHA_SECRET = 'your_recaptcha_secret_key';

const users = {
  user: {
    username: 'user',
    password: 'pass',
    email: 'user@example.com',
    bio: 'Hello! I am a user.',
    apiKey: generateApiKey(),
  }
};

function generateApiKey() {
  return crypto.randomBytes(24).toString('hex');
}

function requireLogin(req, res, next) {
  if (!req.session.loggedIn || !req.session.username) {
    return res.redirect('/');
  }
  next();
}

function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  const user = Object.values(users).find(u => u.apiKey === apiKey);
  if (!user) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  req.user = user;
  next();
}

app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect('/app');
  }
  res.send(`
    <html>
      <head>
        <title>Login</title>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      </head>
      <body>
        <h1>Login</h1>
        <form method="POST" action="/login">
          <label>Username: <input name="username" /></label><br/>
          <label>Password: <input type="password" name="password" /></label><br/>
          <div class="g-recaptcha" data-sitekey="your_recaptcha_site_key"></div><br/>
          <button type="submit">Login</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/login', async (req, res) => {
  const { username, password, 'g-recaptcha-response': captchaResponse } = req.body;

  if (!captchaResponse) {
    return res.send('Please complete the CAPTCHA. <a href="/">Try again</a>');
  }

  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${captchaResponse}`;
  try {
    const captchaVerifyResponse = await fetch(verifyUrl, { method: 'POST' });
    const captchaResult = await captchaVerifyResponse.json();
    if (!captchaResult.success) {
      return res.send('CAPTCHA verification failed. <a href="/">Try again</a>');
    }
  } catch {
    return res.send('CAPTCHA verification error. <a href="/">Try again</a>');
  }

  const user = users[username];
  if (user && user.password === password) {
    req.session.loggedIn = true;
    req.session.username = username;
    return res.redirect('/app');
  }
  res.send('Invalid credentials. <a href="/">Try again</a>');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/app', requireLogin, (req, res) => {
  const user = users[req.session.username];
  res.send(`
    <html>
      <head>
        <title>GPT-like AI API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          textarea { width: 100%; height: 100px; }
          button { padding: 10px 20px; font-size: 16px; }
          #response { margin-top: 20px; white-space: pre-wrap; }
          nav a { margin-right: 15px; }
          .apikey { background: #eee; padding: 10px; font-family: monospace; }
          #toast {
            visibility: hidden;
            min-width: 250px;
            margin-left: -125px;
            background-color: #333;
            color: #fff;
            text-align: center;
            border-radius: 8px;
            padding: 16px;
            position: fixed;
            z-index: 1000;
            left: 50%;
            bottom: 30px;
            font-size: 17px;
            opacity: 0;
            transition: opacity 0.5s, visibility 0.5s;
          }
          #toast.show {
            visibility: visible;
            opacity: 1;
          }
        </style>
      </head>
      <body>
        <nav>
          <a href="/app">API Test</a>
          <a href="/profile">Profile</a>
          <a href="/logout">Logout</a>
        </nav>
        <h1>Welcome to the GPT-like AI API</h1>
        <p>Your API key (use this in <code>x-api-key</code> header):</p>
        <div class="apikey">${user.apiKey}</div>
        <h2>Try it here:</h2>
        <textarea id="prompt" placeholder="Enter your prompt here..."></textarea><br/>
        <button onclick="generate()">Generate</button>
        <div id="response"></div>
        <div id="toast"></div>

        <script>
          function showToast(message, isError = false) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.backgroundColor = isError ? '#e74c3c' : '#27ae60';
            toast.className = 'show';
            setTimeout(() => {
              toast.className = toast.className.replace('show', '');
            }, 3000);
          }

          async function generate() {
            const prompt = document.getElementById('prompt').value;
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
});

// Profile page and update handlers omitted for brevity, add as needed

const OPENAI_API_KEY = 'your_openai_api_key_here';

app.post('/generate', requireApiKey, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const systemPrompt = "You are a helpful assistant that provides clear and concise answers.";

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const generatedText = response.data.choices[0].message.content;
    res.json({ generatedText });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate text' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GPT-like AI API running on port ${PORT}`);
});
