# 🚀 Quick Start Deployment

## Deploy in 3 Steps

### Step 1: Deploy Backend to Render (5 minutes)
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo: `Online-Dead-Stock-Register`
4. Configure:
   ```
   Name: dead-stock-register-api
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```
5. Add these **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dead_stock_register
   JWT_SECRET=CHANGE-THIS-TO-A-RANDOM-STRING-MINIMUM-32-CHARS
   JWT_EXPIRES_IN=8h
   ALLOWED_ORIGINS=https://your-app.vercel.app
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. Click **"Create Web Service"**
7. ✅ Copy your backend URL: `https://your-backend.onrender.com`

### Step 2: Deploy Frontend to Vercel (3 minutes)
1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repo
4. Configure:
   ```
   Framework: Vite
   Build Command: npm run build
   Output Directory: build
   ```
5. Add this **Environment Variable**:
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
   ```
   (Use your actual Render URL from Step 1)
6. Click **"Deploy"**
7. ✅ Copy your frontend URL: `https://your-app.vercel.app`

### Step 3: Update Backend CORS (2 minutes)
1. Go back to Render Dashboard
2. Select your backend service
3. Go to **"Environment"** tab
4. Update these variables with your Vercel URL:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app
   FRONTEND_URL=https://your-app.vercel.app
   ```
5. Click **"Save Changes"**
6. ✅ Wait for automatic redeploy

## 🎉 Done! 
Visit your app at: `https://your-app.vercel.app`

---

## 📋 Important Notes

### MongoDB Setup
- Create free MongoDB Atlas account: https://www.mongodb.com/cloud/atlas
- Whitelist all IPs: `0.0.0.0/0` in Network Access
- Get connection string from "Connect" → "Connect your application"

### Security
- **Change JWT_SECRET** to a random 32+ character string
- **Change default passwords** after first login (see `LOGIN_CREDENTIALS.txt`)
- MongoDB password should be strong and URL-encoded

### Testing Deployment
1. Visit backend: `https://your-backend.onrender.com/api/v1/health`
   - Should return: `{"status":"healthy"}`
2. Visit frontend: `https://your-app.vercel.app`
   - Login with default credentials
   - Test QR code scanning

---

## 🐛 Common Issues

**Backend won't start?**
- Check Render logs for errors
- Verify MongoDB connection string
- Ensure JWT_SECRET is set

**CORS errors?**
- Update `ALLOWED_ORIGINS` in Render with your Vercel URL
- Include both: `https://your-app.vercel.app` and `https://your-app-git-main.vercel.app`

**API calls fail?**
- Verify `VITE_API_BASE_URL` in Vercel matches your Render URL
- Check it ends with `/api/v1`

---

## 📚 Full Documentation
- **Complete Guide**: See `DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Troubleshooting**: See DEPLOYMENT_GUIDE.md → Troubleshooting section

---

## 💰 Cost
All FREE for small projects:
- MongoDB Atlas: 512 MB free
- Render: 750 hours/month free
- Vercel: Unlimited projects free

---

## 🔄 Auto-Deploy
Both platforms auto-deploy when you push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

---

**Need Help?** Check DEPLOYMENT_GUIDE.md for detailed instructions!
