# Deployment Guide

## Step 1: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository and the `backend` folder
4. Railway will auto-detect the Node.js app
5. Go to "Variables" tab and add:
   ```
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.vercel.app
   API_KEY=your-secure-api-key-here
   ADMIN_KEY=your-secure-admin-key-here
   ```
6. Deploy - Railway will give you a URL like `https://your-app.up.railway.app`
7. Test: Visit `https://your-app.up.railway.app/api/health`

## Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-app.up.railway.app/api
   ```
6. Click "Deploy"

## Step 3: Update CORS

1. Go back to Railway dashboard
2. Update `CORS_ORIGIN` variable to your Vercel URL:
   ```
   CORS_ORIGIN=https://your-project.vercel.app
   ```
3. Redeploy the backend

## Step 4: Test

1. Visit your Vercel URL
2. Test all features:
   - Dashboard loads
   - Products list works
   - Portfolios CRUD works
   - Settings save correctly

---

## Environment Variables Reference

### Backend (Railway)
| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Default: 5000 |
| `CORS_ORIGIN` | Yes | Your Vercel frontend URL |
| `API_KEY` | Recommended | Protects API from unauthorized access |
| `ADMIN_KEY` | Recommended | Protects reset/restore endpoints |

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Your Railway backend URL + `/api` |

---

## Generating Secure Keys

Run this in your terminal to generate secure random keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate one for `API_KEY` and one for `ADMIN_KEY`.
