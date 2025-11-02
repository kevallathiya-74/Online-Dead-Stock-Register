# Deployment Guide

## Project Deployment Overview
This guide will help you deploy:
- **Backend** → Render (https://render.com)
- **Frontend** → Vercel (https://vercel.com)

---

## 📋 Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **MongoDB Atlas Account** - For production database (https://www.mongodb.com/cloud/atlas)
3. **Render Account** - For backend hosting (https://render.com)
4. **Vercel Account** - For frontend hosting (https://vercel.com)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user with password
4. Whitelist all IP addresses (0.0.0.0/0) for production
5. Get your connection string (it should look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dead_stock_register?retryWrites=true&w=majority
   ```

---

## 🚀 Step 2: Deploy Backend to Render

### Method 1: Using Render Dashboard (Recommended)

1. **Login to Render**: https://dashboard.render.com

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository: `Online-Dead-Stock-Register`

3. **Configure Web Service**:
   ```
   Name: dead-stock-register-api
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Choose Plan**: Free (or paid if needed)

5. **Add Environment Variables** (Click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dead_stock_register
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-CHANGE-THIS
   JWT_EXPIRES_IN=8h
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   FRONTEND_URL=https://your-vercel-app.vercel.app
   EMAIL_SERVICE=gmail
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   MAX_FILE_SIZE=10485760
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

6. **Deploy**: Click "Create Web Service"

7. **Wait for deployment** (takes 2-5 minutes)

8. **Copy your backend URL**: Will be something like:
   ```
   https://dead-stock-register-api.onrender.com
   ```

### Method 2: Using render.yaml (Alternative)

If you prefer infrastructure as code:
1. The `backend/render.yaml` file is already configured
2. In Render dashboard, use "Blueprint" deployment
3. Point to your repository and the `render.yaml` file

---

## 🎨 Step 3: Deploy Frontend to Vercel

1. **Login to Vercel**: https://vercel.com/login

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Import your GitHub repository: `Online-Dead-Stock-Register`
   - Vercel will auto-detect it's a Vite project

3. **Configure Project**:
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

4. **Add Environment Variables**:
   Click "Environment Variables" and add:
   ```
   VITE_API_BASE_URL=https://your-render-backend-url.onrender.com/api/v1
   VITE_NODE_ENV=production
   VITE_APP_NAME=Dead Stock Register
   VITE_APP_VERSION=1.0.0
   ```
   
   ⚠️ **Important**: Replace `your-render-backend-url.onrender.com` with your actual Render backend URL from Step 2

5. **Deploy**: Click "Deploy"

6. **Wait for deployment** (takes 1-3 minutes)

7. **Your app will be live** at:
   ```
   https://your-project-name.vercel.app
   ```

---

## 🔄 Step 4: Update Backend ALLOWED_ORIGINS

After Vercel deployment:

1. Go back to **Render Dashboard**
2. Select your backend service
3. Go to "Environment" tab
4. Update `ALLOWED_ORIGINS` and `FRONTEND_URL`:
   ```
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
5. Save changes (this will trigger a redeployment)

---

## ✅ Step 5: Verify Deployment

1. **Test Backend**:
   - Visit: `https://your-backend.onrender.com/api/v1/health`
   - Should return: `{"status":"healthy"}`

2. **Test Frontend**:
   - Visit: `https://your-app.vercel.app`
   - Try to login with default credentials from `LOGIN_CREDENTIALS.txt`
   - Test QR code scanning functionality

3. **Check CORS**:
   - Open browser console (F12)
   - Login to the app
   - Look for any CORS errors
   - If you see CORS errors, verify `ALLOWED_ORIGINS` in Render

---

## 🔐 Security Checklist

- [ ] Changed default JWT_SECRET to a strong random string (32+ characters)
- [ ] Updated MongoDB connection string with strong password
- [ ] Set up MongoDB Atlas IP whitelist (or use 0.0.0.0/0 for any IP)
- [ ] Configured CORS with specific frontend URL (not wildcard *)
- [ ] Changed default user passwords after first deployment
- [ ] Enabled MongoDB Atlas backup (recommended)
- [ ] Set up email service for notifications (optional)

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check Render logs: Dashboard → Service → Logs
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

**Problem**: 502 Bad Gateway
- Backend is probably still deploying (wait 2-5 minutes)
- Check Render logs for errors

**Problem**: Database connection failed
- Verify MongoDB Atlas connection string
- Check MongoDB Atlas Network Access (whitelist 0.0.0.0/0)
- Ensure database user has correct permissions

### Frontend Issues

**Problem**: API calls fail (Network Error)
- Verify `VITE_API_BASE_URL` is correct in Vercel
- Check browser console for CORS errors
- Ensure backend `ALLOWED_ORIGINS` includes Vercel URL

**Problem**: Build fails on Vercel
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Try building locally: `npm run build`

**Problem**: 404 on page refresh
- The `vercel.json` rewrites should handle this
- Ensure `vercel.json` is in root directory

### CORS Issues

**Problem**: CORS error in browser console
1. Go to Render → Environment Variables
2. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-vercel-app-git-main.vercel.app
   ```
3. Add preview URLs if needed
4. Save and wait for redeployment

---

## 📱 Mobile & QR Code Testing

1. **Access on mobile**: Visit your Vercel URL on mobile device
2. **Test QR Scanner**: Use device camera to scan QR codes
3. **Camera permissions**: Ensure browser allows camera access

---

## 🔄 Continuous Deployment

### Automatic Deployments

Both platforms support automatic deployments:

- **Vercel**: Auto-deploys on every push to `main` branch
- **Render**: Auto-deploys on every push to `main` branch

To deploy:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both services will automatically rebuild and deploy!

---

## 💰 Cost Estimate

### Free Tier Limits:
- **MongoDB Atlas Free**: 512 MB storage, unlimited connections
- **Render Free**: 750 hours/month, services sleep after 15 min inactivity
- **Vercel Free**: 100 GB bandwidth, unlimited projects

### Paid Options (if needed):
- **MongoDB Atlas**: $9/month (Shared cluster) to $57/month (Dedicated)
- **Render**: $7/month (Basic) to $25/month (Standard)
- **Vercel**: $20/month (Pro)

---

## 📞 Support & Resources

- **Render Documentation**: https://render.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/

---

## 🎉 Success!

Your Dead Stock Register application is now deployed and accessible worldwide!

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.onrender.com/api/v1
- **API Docs**: https://your-backend.onrender.com/api-docs

---

## 📝 Post-Deployment Tasks

1. **Update README.md** with live URLs
2. **Create admin users** using the seeding scripts
3. **Test all functionality**:
   - User login/registration
   - Asset CRUD operations
   - QR code generation & scanning
   - File uploads
   - Reports generation
4. **Set up monitoring** (optional):
   - Render: Built-in metrics
   - Vercel: Analytics dashboard
5. **Configure custom domain** (optional):
   - Render: Custom domain in settings
   - Vercel: Domains tab in project settings

---

## 🔄 Updating After Deployment

To update your deployed application:

1. Make changes locally
2. Test thoroughly: `npm run build` and `npm run preview`
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
4. Both Render and Vercel will automatically redeploy!

---

**Need Help?** Check the troubleshooting section or review the logs in Render/Vercel dashboards.
