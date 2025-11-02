# Quick Deployment Checklist

## Before You Start
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas account created
- [ ] Database connection string ready
- [ ] Render account created
- [ ] Vercel account created

## Backend Deployment (Render)
1. [ ] Login to Render Dashboard
2. [ ] Create New Web Service
3. [ ] Connect GitHub repository
4. [ ] Configure service:
   - Name: `dead-stock-register-api`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. [ ] Add environment variables (see DEPLOYMENT_GUIDE.md)
6. [ ] Deploy and wait for completion
7. [ ] Copy backend URL: `https://__________.onrender.com`
8. [ ] Test health endpoint: `/api/v1/health`

## Frontend Deployment (Vercel)
1. [ ] Login to Vercel
2. [ ] Import GitHub repository
3. [ ] Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `build`
4. [ ] Add environment variable:
   - `VITE_API_BASE_URL` = Your Render backend URL + `/api/v1`
5. [ ] Deploy
6. [ ] Copy Vercel URL: `https://__________.vercel.app`

## Post-Deployment
1. [ ] Update Render `ALLOWED_ORIGINS` with Vercel URL
2. [ ] Update Render `FRONTEND_URL` with Vercel URL
3. [ ] Test login functionality
4. [ ] Test QR code scanning
5. [ ] Verify all API calls work
6. [ ] Check browser console for errors

## URLs (Fill these in)
```
Frontend: https://_________________________.vercel.app
Backend:  https://_________________________.onrender.com
API Docs: https://_________________________.onrender.com/api-docs
```

## Default Login Credentials
Check `LOGIN_CREDENTIALS.txt` for default user accounts.
**Change passwords immediately after first login!**

---
For detailed instructions, see: **DEPLOYMENT_GUIDE.md**
