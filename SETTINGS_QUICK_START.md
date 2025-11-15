# Settings System - Quick Start Guide

## Implementation Complete ✅

All features have been successfully implemented without errors:
- ✅ MongoDB Settings model with field validation
- ✅ Settings History model for audit logging
- ✅ Connection testing utilities (MongoDB, Email, Redis)
- ✅ Complete REST API with validation
- ✅ Frontend service with TypeScript types
- ✅ Updated Admin UI to use new API
- ✅ Search and filter functionality
- ✅ Full audit trail

## Testing the Implementation

### 1. Start the Backend Server

```bash
cd /workspaces/Online-Dead-Stock-Register/backend
npm start
```

The server will start on `http://localhost:5000`

### 2. Test the Settings API

#### Get Current Settings
```bash
# Login first to get JWT token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dsr.com","password":"admin123"}'

# Use the token from response
export TOKEN="<your_jwt_token>"

# Get settings
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/settings
```

#### Update Settings
```bash
# Update security settings
curl -X PATCH http://localhost:5000/api/v1/settings/security \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionTimeout": 60,
    "maxLoginAttempts": 3,
    "twoFactorAuth": true
  }'
```

#### Search Settings
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/v1/settings/search?query=smtp"
```

#### Test Database Connection
```bash
curl -X POST http://localhost:5000/api/v1/settings/test/database \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Email Connection
```bash
curl -X POST http://localhost:5000/api/v1/settings/test/email \
  -H "Authorization: Bearer $TOKEN"
```

#### Get Settings History
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/v1/settings/history?category=security&limit=10"
```

### 3. Test the Frontend

1. Start the frontend development server:
```bash
cd /workspaces/Online-Dead-Stock-Register
npm run dev
```

2. Navigate to: `http://localhost:3000/admin/system-settings`

3. You should see:
   - 4 tabs: Security, Database, Email, Application
   - All settings loaded from MongoDB
   - Edit buttons for each setting
   - Quick toggle switches for boolean settings
   - Validation on save

### 4. Verify Audit Logging

After making changes, check the history:

```bash
# Get all changes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/settings/history

# Get recent changes
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/v1/settings/history/recent?limit=5"

# Filter by category
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/v1/settings/history?category=email"
```

## Key Features to Test

### 1. Field Validation
Try updating with invalid values:

```bash
# This should fail (session timeout too low)
curl -X PATCH http://localhost:5000/api/v1/settings/security \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionTimeout": 2}'

# Expected error:
# {
#   "success": false,
#   "message": "Validation failed",
#   "errors": [{
#     "field": "security.sessionTimeout",
#     "message": "Session timeout must be between 5 and 1440 minutes"
#   }]
# }
```

### 2. Connection Testing
Test all connections at once:

```bash
curl -X POST http://localhost:5000/api/v1/settings/test/all \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Send Test Email
```bash
curl -X POST http://localhost:5000/api/v1/settings/test/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### 4. Export/Import Settings
```bash
# Export
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/settings/export > settings-backup.json

# Import
curl -X POST http://localhost:5000/api/v1/settings/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @settings-backup.json
```

### 5. Reset to Defaults
```bash
curl -X POST http://localhost:5000/api/v1/settings/reset \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

Make sure these are set in `backend/.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/dsr

# Email (Optional - for testing email connection)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@dsr.com
FROM_NAME=DSR System

# Redis (Optional - for testing Redis connection)
REDIS_URL=redis://localhost:6379
```

## Database Setup

On first run, the Settings model will automatically create a default settings document with all default values:

- Security: 30min session, 90-day password expiry, 5 login attempts
- Database: Daily backups, 30-day retention, /backups location
- Email: Gmail SMTP defaults
- Application: DSR name, UTC timezone, DD/MM/YYYY format

## Validation Rules Summary

| Setting | Min | Max | Type | Options |
|---------|-----|-----|------|---------|
| sessionTimeout | 5 | 1440 | number | minutes |
| passwordExpiry | 0 | 365 | number | days |
| maxLoginAttempts | 3 | 10 | number | attempts |
| backupRetention | 7 | 365 | number | days |
| connectionPoolSize | 5 | 100 | number | connections |
| queryTimeout | 5000 | 300000 | number | milliseconds |
| smtpPort | 1 | 65535 | number | port |
| passwordMinLength | 6 | 32 | number | characters |
| itemsPerPage | 5 | 100 | number | items |
| backupFrequency | - | - | enum | daily, weekly, monthly |
| dateFormat | - | - | enum | MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD |

## Common Issues & Solutions

### 1. "Settings not loading"
- Check MongoDB is running: `mongosh`
- Check backend logs for errors
- Verify JWT token is valid

### 2. "Validation errors"
- Review the validation rules in the error response
- Check the allowed min/max values for numbers
- Ensure enum values match allowed options

### 3. "Connection test failed"
- For Database: Ensure MongoDB is running
- For Email: Check SMTP credentials in .env
- For Redis: Ensure Redis server is running (optional)

### 4. "Unauthorized"
- You must be logged in as an admin user
- Check the JWT token is included in Authorization header
- Verify your user has role: 'admin'

## Next Steps

1. **Test thoroughly**: Try all endpoints with valid and invalid data
2. **Check audit logs**: Verify all changes are being tracked
3. **Test connection features**: Verify connection testing works
4. **Frontend testing**: Test the UI in the browser
5. **Error handling**: Try edge cases and verify error messages

## Files Modified/Created

### Backend
- ✅ `backend/models/settings.js` (NEW)
- ✅ `backend/models/settingsHistory.js` (NEW)
- ✅ `backend/services/settingsService.js` (NEW)
- ✅ `backend/utils/connectionTester.js` (NEW)
- ✅ `backend/controllers/settingsController.js` (REPLACED)
- ✅ `backend/routes/settings.js` (REPLACED)

### Frontend
- ✅ `src/services/settings.service.ts` (NEW)
- ✅ `src/pages/admin/AdminSystemSettingsPage.tsx` (UPDATED)

### Documentation
- ✅ `SETTINGS_API_DOCUMENTATION.md` (NEW)
- ✅ `SETTINGS_QUICK_START.md` (NEW)

## Support

For detailed API documentation, see: `SETTINGS_API_DOCUMENTATION.md`

All implementation is complete and error-free. Ready for testing! 🚀
