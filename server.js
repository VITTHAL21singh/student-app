const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Security middleware settings
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Serves your index.html frontend code automatically from the public folder
app.use(express.static(path.join(__dirname, 'public'))); 

// Helper function to safely read data.json
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { students: [] };
  }
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content || '{"students": []}');
  } catch (error) {
    console.error("Error reading JSON file database:", error);
    return { students: [] };
  }
}

// Helper function to safely write updates to data.json
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing data to JSON storage layer:", error);
  }
}

// ==========================================
// 🌐 ROUTE 1: GET ALL RECORDS
// ==========================================
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// ==========================================
// 🌐 ROUTE 2: HANDLE NEW USER REGISTRATIONS
// ==========================================
app.post('/api/submit', (req, res) => {
  const body = req.body;

  if (!body || !body.username) {
    return res.status(400).json({ success: false, error: 'Username/Login ID is required' });
  }

  const data = readData();
  if (!Array.isArray(data.students)) {
    data.students = [];
  }

  // Prevent duplicate usernames for registrations
  const duplicate = data.students.find(
    (s) => s.username === body.username && s.type === 'registration'
  );
  
  if (duplicate && body.type === 'registration') {
    return res.status(409).json({ success: false, error: 'This username is already taken!' });
  }

  const entry = {
    id: Date.now(),
    submittedAt: new Date().toISOString(),
    ...body
  };

  data.students.push(entry);
  writeData(data);

  res.status(201).json({ success: true, data: entry });
});

// ==========================================
// 🌐 ROUTE 3: PROCESS SECURE LOGIN VALIDATIONS
// ==========================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  const data = readData();
  
  // Look for a registered user profile that matches both inputs perfectly
  const account = data.students.find(s => 
    s.username === username && 
    s.password === password && 
    s.type === 'registration'
  );

  if (!account) {
    return res.status(401).json({ success: false, error: 'Invalid username or password configuration' });
  }

  // Return a success payload (hide the password string for safety)
  const { password: _password, ...userWithoutPassword } = account;
  res.status(200).json({ 
    success: true, 
    user: userWithoutPassword
  });
});

// ==========================================
// 🚀 INITIATE PORT HOOK LOOP
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 NABHA DIGITAL LEARNING SYSTEM BACKEND ONLINE`);
  console.log(`🔗 Interface Localhost address: http://127.0.0.1:${PORT}`);
  console.log(`=========================================`);
});
