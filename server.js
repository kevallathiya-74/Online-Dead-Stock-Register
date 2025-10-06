const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Import route files
const assetRoutes = require('./routes/assets');
const userRoutes = require('./routes/users');
const txnRoutes = require('./routes/transactions');
const approvalRoutes = require('./routes/approvals');
const auditRoutes = require('./routes/auditLogs');
const docRoutes = require('./routes/documents');
const vendorRoutes = require('./routes/vendors');
const maintRoutes = require('./routes/maintenance');
const authRoutes = require('./routes/auth');

app.use('/api/assets', assetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', txnRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/auditlogs', auditRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/maintenance', maintRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));