# CV-Wiz Deployment Guide

A step-by-step guide to deploy CV-Wiz to Vercel (frontend) and Railway/Render (backend).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Configure Google OAuth](#step-1-configure-google-oauth)
3. [Step 2: Set Up Database (Neon PostgreSQL)](#step-2-set-up-database-neon-postgresql)
4. [Step 3: Set Up Redis (Upstash)](#step-3-set-up-redis-upstash)
5. [Step 4: Get Groq API Key](#step-4-get-groq-api-key)
6. [Step 5: Deploy Frontend to Vercel](#step-5-deploy-frontend-to-vercel)
7. [Step 6: Deploy Backend to Railway](#step-6-deploy-backend-to-railway)
8. [Step 7: Update Environment Variables](#step-7-update-environment-variables)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, you'll need accounts on:
- [GitHub](https://github.com) (to host your code)
- [Vercel](https://vercel.com) (free frontend hosting)
- [Neon](https://neon.tech) (free PostgreSQL database)
- [Upstash](https://upstash.com) (free Redis cache)
- [Groq](https://console.groq.com) (free LLM API)
- [Google Cloud Console](https://console.cloud.google.com) (for OAuth)

---

## Step 1: Configure Google OAuth

> [!IMPORTANT]
> This step fixes the "redirect_uri_mismatch" error you're seeing.

### 1.1 Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (cv-wiz)

### 1.2 Configure Authorized JavaScript Origins

Click **"+ Add URI"** under "Authorized JavaScript origins" and add:

**For Local Development:**
```
http://localhost:3000
```

**For Production (after you get your Vercel URL):**
```
https://your-app-name.vercel.app
```

### 1.3 Configure Authorized Redirect URIs

Click **"+ Add URI"** under "Authorized redirect URIs" and add:

**For Local Development:**
```
http://localhost:3000/api/auth/callback/google
```

**For Production:**
```
https://your-app-name.vercel.app/api/auth/callback/google
```

### 1.4 Save Changes

Click **"Save"** at the bottom. Changes may take 5 minutes to a few hours to take effect.

![Google OAuth URIs Configuration](file:///Users/chessman/.gemini/antigravity/brain/a09a7784-289a-40d9-bf24-22cc23f00b80/uploaded_image_1_1768995301240.png)

---

## Step 2: Set Up Database (Neon PostgreSQL)

### 2.1 Create a Neon Account

1. Go to [Neon](https://neon.tech) and sign up (free tier available)
2. Click **"Create a project"**
3. Name it: `cv-wiz`
4. Select the closest region to you
5. Click **"Create project"**

### 2.2 Get Connection String

1. After project creation, you'll see your connection details
2. Copy the **Connection string** (it looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Save this as your `DATABASE_URL`

### 2.3 Initialize the Database

Once you have the DATABASE_URL, run these commands locally:

```bash
cd frontend
DATABASE_URL="your_connection_string" npx prisma db push
```

This creates all the necessary tables.

---

## Step 3: Set Up Redis (Upstash)

### 3.1 Create an Upstash Account

1. Go to [Upstash](https://upstash.com) and sign up
2. Click **"Create Database"**
3. Name: `cv-wiz-cache`
4. Type: **Regional**
5. Region: Select closest to you
6. Click **"Create"**

### 3.2 Get Redis URL

1. Go to your database details
2. Scroll to **"REST API"** section
3. Copy the **UPSTASH_REDIS_REST_URL** (format: `https://xxx.upstash.io`)
4. Also copy **UPSTASH_REDIS_REST_TOKEN**

For the backend, you need the standard Redis URL format. Look for:
```
redis://default:password@xxx.upstash.io:6379
```

Save this as your `REDIS_URL`.

---

## Step 4: Get Groq API Key

### 4.1 Create a Groq Account

1. Go to [Groq Console](https://console.groq.com)
2. Sign up with Google or GitHub
3. Go to **API Keys**
4. Click **"Create API Key"**
5. Name it: `cv-wiz`
6. Copy the key (starts with `gsk_...`)

Save this as your `GROQ_API_KEY`.

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Push Code to GitHub

First, make sure your code is on GitHub:

```bash
cd cv-wiz
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 5.2 Import to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import"** next to your `cv-wiz` repository
4. Set **Root Directory** to: `frontend`
5. Framework: Next.js (auto-detected)

### 5.3 Configure Environment Variables

Click **"Environment Variables"** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | `pzbB0urM2KTe7NgDF47Vx7QKK7hj9h2lL/b155AOynU=` (or generate new with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` (update after first deploy) |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `NEXT_PUBLIC_API_URL` | Your backend URL (add after deploying backend) |

### 5.4 Deploy

Click **"Deploy"** and wait for the build to complete.

### 5.5 Get Your Vercel URL

After deployment, copy your URL (e.g., `cv-wiz-xyz.vercel.app`).

**Go back to Step 1.2 and 1.3** to add your production URL to Google OAuth settings!

---

## Step 6: Deploy Backend to Railway

### 6.1 Create Railway Account

1. Go to [Railway](https://railway.app) and sign up with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `cv-wiz` repository

### 6.2 Configure the Service

1. Click on your service
2. Go to **"Settings"** tab
3. Set **Root Directory** to: `backend`
4. Set **Start Command** to:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### 6.3 Add Environment Variables

Go to **"Variables"** tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `REDIS_URL` | Your Upstash Redis URL |
| `GROQ_API_KEY` | Your Groq API key |
| `NEXTAUTH_SECRET` | Same as frontend |
| `NEXTAUTH_URL` | Your Vercel frontend URL |
| `FRONTEND_API_URL` | Your Vercel frontend URL |

### 6.4 Deploy

Railway will automatically deploy. Get your backend URL from the **"Settings"** → **"Domains"** section.

---

## Step 7: Update Environment Variables

After both services are deployed, you need to update some URLs:

### 7.1 Update Vercel (Frontend)

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_API_URL` to your Railway backend URL

### 7.2 Update Railway (Backend)

1. Go to your Railway project → **Variables**
2. Ensure `FRONTEND_API_URL` is set to your Vercel URL

### 7.3 Update Google OAuth

Go back to Google Cloud Console and add your production URLs:

**Authorized JavaScript Origins:**
```
https://your-app.vercel.app
```

**Authorized Redirect URIs:**
```
https://your-app.vercel.app/api/auth/callback/google
```

### 7.4 Redeploy Both Services

After updating environment variables, redeploy both services for changes to take effect.

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Cause:** Google OAuth doesn't recognize the redirect URL.

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add the exact redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Wait 5 minutes and try again

### "Database connection error"

**Cause:** Invalid DATABASE_URL or database not initialized.

**Fix:**
1. Verify your Neon connection string is correct
2. Run `npx prisma db push` locally with the correct DATABASE_URL
3. Check if tables were created in Neon dashboard

### "User not found" on Login

**Cause:** Email signup failed or user doesn't exist.

**Fix:**
1. Register a new account first
2. Check database for user entries
3. Ensure database migrations ran successfully

### "CORS error" when calling Backend

**Cause:** Backend doesn't allow frontend origin.

**Fix:** Add your Vercel URL to the CORS origins in `backend/app/main.py`:
```python
origins = [
    "http://localhost:3000",
    "https://your-app.vercel.app",  # Add this
]
```

### WeasyPrint "cannot load library" Error

**Cause:** Missing system dependencies for PDF generation.

**Fix for Mac:**
```bash
brew install glib pango
```

**Fix for Railway/Production:**
Add a `Dockerfile` or use a Python image with these dependencies pre-installed.

---

## Quick Reference: All Environment Variables

### Frontend (.env)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=679408732126-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
GROQ_API_KEY=gsk_...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
FRONTEND_API_URL=http://localhost:3000
```

---

## Summary

1. ✅ Configure Google OAuth with correct redirect URIs
2. ✅ Set up Neon PostgreSQL database
3. ✅ Set up Upstash Redis cache
4. ✅ Get Groq API key
5. ✅ Deploy frontend to Vercel
6. ✅ Deploy backend to Railway
7. ✅ Update environment variables with production URLs
8. ✅ Add production URLs to Google OAuth

Your CV-Wiz application should now be live!
