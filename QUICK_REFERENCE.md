# Quick Reference Card - Asset Management System

## 🚀 Development Commands

### Start Backend Server
```bash
cd backend
node server.js
```
Server: http://localhost:5000  
API Docs: http://localhost:5000/api-docs

### Start Frontend
```bash
npm start
```
Frontend: http://localhost:3000

### View Logs
```bash
# Application logs
tail -f backend/logs/application-YYYY-MM-DD.log

# Error logs
tail -f backend/logs/error-YYYY-MM-DD.log

# PM2 logs (production)
pm2 logs asset-management-api
```

---

## 📦 Package Management

### Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

### Update Dependencies
```bash
npm audit fix
```

---

## 🔐 Environment Setup

### Development
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
```

### Production
```bash
cd backend
cp .env.production.example .env
# Edit .env with production settings
# Generate secrets: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🎯 Key Environment Variables

```env
# Required for Production
NODE_ENV=production
JWT_SECRET=<generated-128-char-secret>
MONGODB_URI=<your-mongodb-atlas-url>
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<your-app-password>
CORS_ORIGIN=https://yourdomain.com
```

---

## 👤 Default Admin Login

**Email:** admin@company.com  
**Password:** Password@123  
**Role:** ADMIN

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `README.md` | Project overview |
| `PRODUCTION_DEPLOYMENT_GUIDE.md` | Complete deployment guide |
| `FINAL_IMPLEMENTATION_COMPLETE.md` | Implementation summary |
| `COMPREHENSIVE_PROJECT_STATUS.md` | Feature status |
| `TEST_ACCOUNTS.md` | All test credentials |

---

## 🔧 Production Commands

### PM2 Process Management
```bash
# Start application
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs asset-management-api

# Restart
pm2 restart asset-management-api

# Stop
pm2 stop asset-management-api
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/assetmanagement-error.log
```

### SSL Certificate (Let's Encrypt)
```bash
# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## 🗄️ Database Commands

### MongoDB Atlas
- Access: https://cloud.mongodb.com
- Database: Asset Management
- Collections: 18 (users, assets, vendors, etc.)

### Local MongoDB
```bash
# Start MongoDB
sudo systemctl start mongod

# Connect
mongosh
use assetdb
db.users.find()
```

### Backup & Restore
```bash
# Backup
mongodump --uri="<mongodb-uri>" --out=./backup

# Restore
mongorestore --uri="<mongodb-uri>" ./backup
```

---

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000  # Windows
sudo lsof -i :5000            # Linux

# Check logs
cat backend/logs/error-*.log
```

### Database Connection Failed
```bash
# Test connection
mongosh "<your-mongodb-uri>"

# Check MongoDB Atlas network access
# Add your IP to whitelist
```

### Frontend Can't Connect to Backend
```bash
# Check CORS settings in backend/.env
CORS_ORIGIN=http://localhost:3000

# Check API URL in frontend .env
REACT_APP_API_URL=http://localhost:5000
```

---

## 📊 API Endpoints (Quick Reference)

### Authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register
- GET `/api/auth/me` - Get current user

### Users
- GET `/api/users` - List all users
- POST `/api/users` - Create user
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

### Assets
- GET `/api/assets` - List all assets
- POST `/api/assets` - Create asset
- PUT `/api/assets/:id` - Update asset
- DELETE `/api/assets/:id` - Delete asset

### Vendors
- GET `/api/vendors` - List all vendors
- POST `/api/vendors` - Create vendor
- PUT `/api/vendors/:id` - Update vendor
- DELETE `/api/vendors/:id` - Delete vendor

### Dashboard
- GET `/api/dashboard/stats` - Dashboard statistics
- GET `/api/vendor/dashboard/stats` - Vendor dashboard

**Full API Documentation:** http://localhost:5000/api-docs

---

## 🛡️ Security Best Practices

### Production Checklist
- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (128+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW)
- [ ] Enable Fail2Ban
- [ ] Set CORS_ORIGIN to your domain
- [ ] Enable MongoDB authentication
- [ ] Regular security updates
- [ ] Review logs daily

---

## 📞 Support

### Log Locations
- Application: `backend/logs/application-*.log`
- Errors: `backend/logs/error-*.log`
- PM2: `~/.pm2/logs/`
- Nginx: `/var/log/nginx/`

### Common Issues
1. **400 Bad Request** - Check request payload format
2. **401 Unauthorized** - Check JWT token
3. **404 Not Found** - Verify API endpoint URL
4. **500 Server Error** - Check server logs
5. **CORS Error** - Check CORS_ORIGIN setting

---

## 🎯 Quick Deploy to Production

```bash
# 1. Clone repository
git clone <your-repo-url>
cd asset-management-system

# 2. Install dependencies
cd backend && npm install --production
cd .. && npm install && npm run build

# 3. Configure environment
cd backend
cp .env.production.example .env
nano .env  # Edit with production values

# 4. Start with PM2
pm2 start ecosystem.config.js
pm2 save

# 5. Configure Nginx (see PRODUCTION_DEPLOYMENT_GUIDE.md)

# 6. Obtain SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# 7. Enable firewall
sudo ufw enable
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**Full Guide:** See `PRODUCTION_DEPLOYMENT_GUIDE.md`

---

## 📈 Monitoring

### Check Application Health
```bash
# Health endpoint
curl http://localhost:5000/api/health

# Server status
pm2 status

# Memory usage
pm2 monit
```

### View Recent Activity
```bash
# Last 50 log lines
tail -50 backend/logs/application-*.log

# Follow logs in real-time
tail -f backend/logs/application-*.log

# PM2 logs
pm2 logs --lines 100
```

---

## 🔄 Update & Maintenance

### Update Application Code
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
cd backend && npm install
cd .. && npm install

# Rebuild frontend
npm run build

# Restart backend
pm2 restart asset-management-api
```

### Update System Packages
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm audit fix
```

---

## 💾 Backup & Recovery

### Automated Daily Backup
```bash
# Backup script location
~/backup-db.sh

# Manual backup
mongodump --uri="<mongodb-uri>" --out=./backup-$(date +%Y-%m-%d)

# Restore from backup
mongorestore --uri="<mongodb-uri>" ./backup-YYYY-MM-DD
```

### Backup Locations
- Database: `/home/assetmgmt/backups/`
- Uploads: `backend/uploads/`
- Logs: `backend/logs/`

---

**Version:** 1.0.0 (Production Ready)  
**Last Updated:** 2025  
**Status:** ✅ 100% Complete  

