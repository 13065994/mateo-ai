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
mongoose.connect('mongodb://localhost:27017/neongpt', {
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
    const existing = await User.findOne({ username });
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

// Dashboard - list APIs and user info
app.get('/', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/login');
    }
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
              padding: 0              padding: 1rem;
            }
            h1 {
              text-align: center;
              margin-bottom: 1rem;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: #001f33;
              border-radius: 12px;
              padding: 1rem 2rem;
              box-shadow: 0 0 15px #0ff inset;
            }
            .api-list {
              margin-top: 1rem;
            }
            .api-list h2 {
              margin-bottom: 0.5rem;
            }
            .api-list ul {
              list-style: none;
              padding-left: 0;
            }
            .api-list li {
              margin-bottom: 0.5rem;
              background: #002b55;
              padding: 0.5rem 1rem;
              border-radius: 8px;
              cursor: pointer;
              transition: background 0.3s;
            }
            .api-list li:hover {
              background: #004080;
            }
            .user-info {
              margin-top: 1rem;
              background: #002b55;
              padding: 1rem;
              border-radius: 12px;
            }
            .user-info p {
              margin: 0.3rem 0;
            }
            a.button {
              display: inline-block;
              margin-top: 1rem;
              padding: 0.5rem 1rem;
              background: #0ff;
              color: #000;
              font-weight: 700;
              border-radius: 12px;
              text-decoration: none;
              box-shadow: 0 0 15px #0ff;
              transition: background 0.3s;
            }
            a.button:hover {
              background: #00e6e6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Neon GPT API Dashboard</h1>
            <div class="user-info">
              <p><strong>Username:</strong> ${user.username}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>API Key:</strong> <code>${user.apiKey}</code></p>
              <p><strong>Bio:</strong> ${user.bio || 'No bio set'}</p>
              <p><strong>System Prompt:</strong> ${user.systemPrompt || 'Default prompt'}</p>
              <a href="/logout" class="button">Logout</a>
            </div>
            <div class="api-list">
              <h2>Available APIs</h2>
              <ul>
                <li>GET /ping - Health check</li>
                <li>POST /generate - Generate text (requires x-api-key header)</li>
                <li>GET /profile - View your profile</li>
                <li>POST /profile - Update your profile</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.send('Error loading dashboard. <a href="/login">Login</a>');
  }
});

// Profile GET
app.get('/profile', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/login');
    }
    res.send(`
      <html lang="en">
      <head>
        <title>Profile - Neon GPT API</title>
        <style>
          body {
            background: #121212;
            color: #0ff;
            font-family: monospace, monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
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
        <form method="POST" action="/profile">
          <h2 style="text-align:center;">Edit Profile</h2>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" value="${user.email || ''}" required />
          <label for="bio">Bio</label>
          <textarea id="bio" name="bio" rows="3">${user.bio || ''}</textarea>
          <label for="systemPrompt">System Prompt</label>
          <textarea id="systemPrompt" name="systemPrompt" rows="3">${user.systemPrompt || ''}</textarea>
          <button type="submit">Save</button>
          <a href="/" style="text-align:center; display:block; margin-top:1rem;">Back to Dashboard</a>
        </form>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Profile GET error:', err);
    res.send('Error loading profile. <a href="/">Dashboard</a>');
  }
});

// Profile POST - update user info
app.post('/profile', requireLogin, async (req, res) => {
  try {
    const { email, bio, systemPrompt } = req.body;
    await User.findByIdAndUpdate(req.session.userId, { email, bio, systemPrompt });
    res.redirect('/');
  } catch (err) {
    console.error('Profile POST error:', err);
    res.send('Error updating profile. <a href="/profile">Try again</a>');
  }
});

// Generate endpoint (dummy example)
app.post('/generate', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required in x-api-key header' });
    }
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(403).json({ error: 'Invalid API key' });
    }
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    // Dummy response - replace with actual AI generation logic
    const generatedText = `You asked: "${prompt}". This is a dummy response from Neon GPT API.`;
    res.json({ generatedText });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal server error');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Neon GPT API server running on port ${PORT}`);
});
