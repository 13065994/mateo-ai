const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'your_secret_here_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Connect to MongoDB
mongoose.connect('mongodb+srv://mateochatbot:xdtL2bYQ9eV3CeXM@gerald.r2hjy.mongodb.net/mateoapis?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// MongoDB User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: String,
  bio: String,
  passwordHash: String,
  apiKey: String,
  systemPrompt: String,
});
const User = mongoose.model('User', userSchema);

// Helper to generate API key
function generateApiKey() {
  return crypto.randomBytes(24).toString('hex');
}

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// Helper to render the neon nav bar with epilepsy icon and menu
function renderNav(username) {
  return `
  <nav class="neon-nav">
    <div class="nav-left">
      <div class="epilepsy-icon" title="Menu" tabindex="0" role="button" aria-label="Toggle menu">&#9881;</div>
      <span class="nav-title">Neon GPT API</span>
    </div>
    <div class="nav-menu" aria-hidden="true">
      <a href="/" class="nav-link">Dashboard</a>
      <a href="/profile" class="nav-link">Edit Profile</a>
      <a href="/logout" class="nav-link">Logout</a>
    </div>
    <div class="nav-user">Hi, ${username}</div>
  </nav>
  <style>
    .neon-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 50px;
      background: #001f33;
      box-shadow: 0 0 15px #0ff inset;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      font-family: monospace;
      color: #0ff;
      z-index: 1000;
      user-select: none;
    }
    .nav-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .epilepsy-icon {
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      box-shadow: 0 0 10px #0ff;
      transition: background 0.3s;
    }
    .epilepsy-icon:hover, .epilepsy-icon:focus {
      background: #00e6e6;
      outline: none;
    }
    .nav-title {
      font-weight: 700;
      font-size: 1.2rem;
      text-shadow:
        0 0 5px #0ff,
        0 0 10px #0ff,
        0 0 20px #0ff;
    }
    .nav-menu {
      position: absolute;
      top: 50px;
      left: 1rem;
      background: #001f33;
      border-radius: 12px;
      box-shadow: 0 0 15px #0ff;
      display: none;
      flex-direction: column;
      min-width: 140px;
      user-select: auto;
    }
    .nav-menu.show {
      display: flex;
    }
    .nav-link {
      color: #0ff;
      padding: 0.75rem 1rem;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 1px solid #004080;
      transition: background 0.3s;
    }
    .nav-link:last-child {
      border-bottom: none;
    }
    .nav-link:hover, .nav-link:focus {
      background: #004080;
      outline: none;
    }
    .nav-user {
      font-weight: 600;
      font-size: 0.9rem;
      user-select: none;
    }
    body {
      padding-top: 50px; /* to avoid nav overlap */
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const icon = document.querySelector('.epilepsy-icon');
      const menu = document.querySelector('.nav-menu');
      icon.addEventListener('click', () => {
        menu.classList.toggle('show');
        menu.setAttribute('aria-hidden', !menu.classList.contains('show'));
      });
      icon.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          icon.click();
        }
      });
      // Close menu if clicking outside
      document.addEventListener('click', e => {
        if (!menu.contains(e.target) && !icon.contains(e.target)) {
          menu.classList.remove('show');
          menu.setAttribute('aria-hidden', 'true');
        }
      });
    });
  </script>
  `;
}

// --- ROUTES ---

// Health check
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Registration page
app.get('/register', (req, res) => {
  res.send(`
  <html lang="en">
  <head>
    <title>Register - Neon GPT API</title>
    <style>
      body {
        background: #121212;
        color: #0ff;
        font-family: monospace, monospace;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
      }
      form {
        background: #001f33;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 0 15px #0ff inset;
        width: 320px;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 700;
      }
      input {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        border: none;
        background: #002b55;
        color: #0ff;
        font-family: monospace;
      }
      button {
        width: 100%;
        padding: 0.75rem;
        background: #0ff;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        color: #000;
        box-shadow: 0 0 15px #0ff;
      }
      button:hover {
        background: #00e6e6;
      }
      a {
        color: #0ff;
        text-decoration: none;
        font-size: 0.9rem;
        display: block;
        margin-top: 1rem;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <form method="POST" action="/register">
      <h2 style="text-align:center;">Register</h2>
      <label for="username">Username</label>
      <input id="username" name="username" required />
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required />
      <button type="submit">Register</button>
      <a href="/login">Already have an account? Login</a>
    </form>
  </body>
  </html>
  `);
});

// Registration POST
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.send('All fields are required. <a href="/register">Go back</a>');
    }
    const existing = await User.findOne({ username, email });
    if (existing) {
      return res.send('Username already taken. <a href="/register">Go back</a>');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const apiKey = generateApiKey();
    const user = new User({ username, email, passwordHash, apiKey, systemPrompt: "You are a helpful assistant." });
    await user.save();
    req.session.userId = user._id;
    console.log(`User registered: ${username}`);
    res.redirect('/');
  } catch (err) {
    console.error('Registration error:', err);
    res.send('Error during registration. <a href="/register">Try again</a>');
  }
});

// Login page
app.get('/login', (req, res) => {
  res.send(`
  <html lang="en">
  <head>
    <title>Login - Neon GPT API</title>
    <style>
      body {
        background: #121212;
        color: #0ff;
        font-family: monospace, monospace;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
      }
      form {
        background: #001f33;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 0 15px #0ff inset;
        width: 320px;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 700;
      }
      input {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        border: none;
        background: #002b55;
        color: #0ff;
        font-family: monospace;
      }
      button {
        width: 100%;
        padding: 0.75rem;
        background: #0ff;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        color: #000;
        box-shadow: 0 0 15px #0ff;
      }
      button:hover {
        background: #00e6e6;
      }
      a {
        color: #0ff;
        text-decoration: none;
        font-size: 0.9rem;
        display: block;
        margin-top: 1rem;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <form method="POST" action="/login">
      <h2 style="text-align:center;">Login</h2>
      <label for="username">Username</label>
      <input id="username" name="username" required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required />
      <button type="submit">Login</button>
      <a href="/register">Don't have an account? Register</a>
    </form>
  </body>
  </html>
  `);
});

// Login POST
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.send('All fields are required. <a href="/login">Go back</a>');
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.send('Invalid username or password. <a href="/login">Go back</a>');
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.send('Invalid username or password. <a href="/login">Go back</a>');
    }
    req.session.userId = user._id;
    console.log(`User logged in: ${username}`);
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.send('Error during login. <a href="/login">Try again</a>');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Dashboard - list APIs as buttons with dynamic info display
app.get('/', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/login');
    }

    // Define your APIs info here
    const apis = [
      {
        name: 'Health Check',
        link: '/ping',
        type: 'GET',
        description: 'Simple endpoint to check if the server is alive. Returns "pong".',
      },
      {
        name: 'Neon GPT',
        link: '/gpt',
        type: 'POST',
        description: 'Send a prompt in JSON body to generate AI text. Requires x-api-key header and prompt header.',
      },
      {
        name: 'View Profile',
        link: '/profile',
        type: 'GET',
        description: 'View your user profile information.',
      },
      {
        name: 'Update Profile',
        link: '/profile',
        type: 'POST',
        description: 'Update your email, bio, and system prompt.',
      },
    ];

    res.send(`
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Neon GPT API - Dashboard</title>
        <style>
          body {
            background: #121212;
            color: #0ff;
            font-family: monospace, monospace;
            margin: 0;
            padding: 1rem;
            padding-top: 60px; /* nav height + spacing */
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: #001f33;
            border-radius: 12px;
            padding: 1rem 2rem;
            box-shadow: 0 0 15px #0ff inset;
          }
          h1 {
            text-align: center;
            margin-bottom: 1rem;
            text-shadow:
              0 0 5px #0ff,
              0 0 10px #0ff,
              0 0 20px #0ff;
          }
          .api-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 2rem;
          }
          .api-button {
            background: #002b55;
            border: 2px solid #0ff;
            border-radius: 12px;
            padding: 1rem 1.5rem;
            cursor: pointer;
            font-weight: 700;
            color: #0ff;
            box-shadow:
              0 0 10px #0ff,
              0 0 20px #0ff inset;
            transition: background 0.3s, box-shadow 0.3s;
            user-select: none;
            min-width: 140px;
            text-align: center;
          }
          .api-button:hover, .api-button:focus {
            background: #00e6e6;
            color: #000;
            outline: none;
            box-shadow:
              0 0 20px #00e6e6,
              0 0 30px #00e6e6 inset;
          }
          .api-info {
            background: #002b55;
            border-radius: 12px;
            padding: 1rem 1.5rem;
            box-shadow: 0 0 15px #0ff inset;
            max-width: 700px;
            margin: 0 auto;
            font-size: 1rem;
            line-height: 1.4;
            user-select: text;
          }
          .api-info h2 {
            margin-top: 0;
            text-shadow:
              0 0 5px #0ff,
              0 0 10px #0ff;
          }
          .api-info p {
            margin: 0.5rem 0;
          }
          .copy-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0.5rem 0;
          }
          .copy-text {
            background: #001f33;
            padding: 0.3rem 0.6rem;
            border-radius: 6px;
            font-family: monospace;
            user-select: all;
            flex-grow: 1;
            overflow-wrap: anywhere;
          }
          .copy-button {
            background: #0ff;
            border: none;
            border-radius: 8px;
            padding: 0.3rem 0.6rem;
            font-weight: 700;
            cursor: pointer;
            color: #000;
            box-shadow: 0 0 10px #0ff;
            transition: background 0.3s;
          }
          .copy-button:hover, .copy-button:focus {
            background: #00e6e6;
            outline: none;
          }
        </style>
      </head>
      <body>
        ${renderNav(user.username)}
        <div class="container">
          <h1>Neon GPT API Dashboard</h1>
          <div class="api-buttons" role="list">
            ${apis.map((api, i) => `<button class="api-button" role="listitem" data-index="${i}" aria-expanded="false" aria-controls="api-info">${api.name}</button>`).join('')}
          </div>
          <div id="api-info" class="api-info" aria-live="polite" aria-hidden="true"></div>
        </div>
        <script>
          const apis = ${JSON.stringify(apis)};
          const userApiKey = ${JSON.stringify(user.apiKey)};
          const baseUrl = window.location.origin;

          const buttons = document.querySelectorAll('.api-button');
          const infoDiv = document.getElementById('api-info');

          function createCopyButton(textToCopy) {
            const btn = document.createElement('button');
            btn.className = 'copy-button';
            btn.type = 'button';
            btn.textContent = 'Copy';
            btn.addEventListener('click', () => {
              navigator.clipboard.writeText(textToCopy).then(() => {
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy', 1500);
              });
            });
            return btn;
          }

          buttons.forEach(button => {
            button.addEventListener('click', () => {
              const index = button.getAttribute('data-index');
              const api = apis[index];

              // Toggle aria-expanded
              const expanded = button.getAttribute('aria-expanded') === 'true';
              buttons.forEach(b => b.setAttribute('aria-expanded', 'false'));
              if (!expanded) {
                button.setAttribute('aria-expanded', 'true');
              } else {
                button.setAttribute('aria-expanded', 'false');
                infoDiv.innerHTML = '';
                infoDiv.setAttribute('aria-hidden', 'true');
                return;
              }

              // Build info content
              infoDiv.innerHTML = '';
              infoDiv.setAttribute('aria-hidden', 'false');

              const title = document.createElement('h2');
              title.textContent = api.name;
              infoDiv.appendChild(title);

              const desc = document.createElement('p');
              desc.textContent = api.description;
              infoDiv.appendChild(desc);

              const method = document.createElement('p');
              method.innerHTML = '<strong>Method:</strong> ' + api.type;
              infoDiv.appendChild(method);

              const linkGroup = document.createElement('div');
              linkGroup.className = 'copy-group';
              const linkLabel = document.createElement('span');
              linkLabel.textContent = 'Endpoint:';
              const linkText = document.createElement('code');
              linkText.className = 'copy-text';
              linkText.textContent = baseUrl + api.link;
              const linkCopyBtn = createCopyButton(linkText.textContent);
              linkGroup.appendChild(linkLabel);
              linkGroup.appendChild(linkText);
              linkGroup.appendChild(linkCopyBtn);
              infoDiv.appendChild(linkGroup);

              const keyGroup = document.createElement('div');
              keyGroup.className = 'copy-group';
              const keyLabel = document.createElement('span');
              keyLabel.textContent = 'Your API Key:';
              const keyText = document.createElement('code');
              keyText.className = 'copy-text';
              keyText.textContent = userApiKey;
              const keyCopyBtn = createCopyButton(userApiKey);
              keyGroup.appendChild(keyLabel);
              keyGroup.appendChild(keyText);
              keyGroup.appendChild(keyCopyBtn);
              infoDiv.appendChild(keyGroup);
            });
          });
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.send('Error loading dashboard. <a href="/login">Login</a>');
  }
});

// Profile page GET
app.get('/profile', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/login');
    }
    res.send(`
    <html lang="en">
    <head>
      <title>Edit Profile - Neon GPT API</title>
      <style>
        body {
          background: #121212;
          color: #0ff;
          font-family: monospace, monospace;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding-top: 50px;
        }
        form {
          background: #001f33;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 0 15px #0ff inset;
          width: 400px;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }
        input, textarea {
          width: 100%;
          padding: 0.5rem;
          margin-bottom: 1rem;
          border-radius: 8px;
          border: none;
          background: #002b55;
          color: #0ff;
          font-family: monospace;
          resize: vertical;
        }
        button {
          width: 100%;
          padding: 0.75rem;
          background: #0ff;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          color: #000;
          box-shadow: 0 0 15px #0ff;
        }
        button:hover {
          background: #00e6e6;
        }
        a {
          color: #0ff;
          text-decoration: none;
          font-size: 0.9rem;
          display: block;
          margin-top: 1rem;
          text-align: center;
        }
        .api-key {
          background: #001f33;
          padding: 0.5rem;
          border-radius: 8px;
          font-family: monospace;
          user-select: all;
          margin-bottom: 1rem;
          box-shadow: 0 0 10px #0ff inset;
        }
      </style>
    </head>
    <body>
      ${renderNav(user.username)}
      <form method="POST" action="/profile">
        <h2 style="text-align:center;">Edit Profile</h2>
        <label>Username (read-only)</label>
        <input type="text" value="${user.username}" readonly />
        <label>Email</label>
        <input name="email" type="email" value="${user.email || ''}" required />
        <label>Bio</label>
        <textarea name="bio" rows="3">${user.bio || ''}</textarea>
        <label>System Prompt</label>
        <textarea name="systemPrompt" rows="4">${user.systemPrompt || ''}</textarea>
        <label>Your API Key (read-only)</label>
        <div class="api-key" id="apiKey">${user.apiKey}</div>
        <button type="submit">Update Profile</button>
        <a href="/">Back to Dashboard</a>
      </form>
      <script>
        // Optional: click API key to copy
        const apiKeyDiv = document.getElementById('apiKey');
        apiKeyDiv.style.cursor = 'pointer';
        apiKeyDiv.title = 'Click to copy API key';
        apiKeyDiv.addEventListener('click', () => {
          navigator.clipboard.writeText(apiKeyDiv.textContent).then(() => {
            apiKeyDiv.textContent = 'Copied!';
            setTimeout(() => {
              apiKeyDiv.textContent = '${user.apiKey}';
            }, 1500);
          });
        });
      </script>
    </body>
    </html>
    `);
  } catch (err) {
    console.error('Profile GET error:', err);
    res.send('Error loading profile. <a href="/">Dashboard</a>');
  }
});

// Profile page POST - update email, bio, systemPrompt
app.post('/profile', requireLogin, async (req, res) => {
  try {
    const { email, bio, systemPrompt } = req.body;
    await User.findByIdAndUpdate(req.session.userId, {
      email,
      bio,
      systemPrompt,
    });
    res.redirect('/profile');
  } catch (err) {
    console.error('Profile POST error:', err);
    res.send('Error updating profile. <a href="/profile">Go back</a>');
  }
});

// Example / endpoint (simplified)
const OPENAI_API_KEY = 'your_openai_api_key';
const sysPrompt = user.systemPrompt || "Your are Neon Ai made to generate compatible response and friendly interface and your owner is Gerald Max.";

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  const apiKey = req.headers['x-api-key'];
  const u = await User.findOne({ apiKey });
  if (!apiKey.includes(u)) return res.send(alert("invalid apikey"));
  if (!prompt) return res.send('no prompt is provided');
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2048,
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
    console.error(error);
    res.status(500).json({ error: 'Failed to generate text' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Neon GPT API server running on port ${PORT}`);
});
