// Simple test endpoint to check if basic registration works
const express = require('express');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());

app.post('/api/auth/register', (req, res) => {
  console.log('=== SIMPLE TEST REGISTRATION ===');
  console.log('Request body:', req.body);
  
  const { full_name, email, password, department, role } = req.body;
  
  console.log('Fields received:');
  console.log('- full_name:', full_name);
  console.log('- email:', email);
  console.log('- password:', password ? '[PRESENT]' : '[MISSING]');
  console.log('- department:', department);
  console.log('- role:', role);
  
  if (!full_name || !email || !password || !department) {
    const missing = [];
    if (!full_name) missing.push('full_name');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!department) missing.push('department');
    
    return res.status(400).json({
      message: `Missing fields: ${missing.join(', ')}`,
      received: { full_name, email, password: !!password, department, role }
    });
  }
  
  return res.status(201).json({
    message: 'Test registration successful',
    user: { email, role: role || 'employee' }
  });
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));