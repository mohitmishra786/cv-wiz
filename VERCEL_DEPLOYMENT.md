# CV-Wiz: Complete Vercel Deployment Guide

A step-by-step guide to deploy the entire CV-Wiz application on Vercel (frontend + backend as serverless functions).

---

## Table of Contents

1. [Why Vercel for Everything?](#why-vercel-for-everything)
2. [Prerequisites](#prerequisites)
3. [Step 1: Set Up Database (Neon PostgreSQL)](#step-1-set-up-database-neon-postgresql)
4. [Step 2: Set Up Redis (Upstash)](#step-2-set-up-redis-upstash)
5. [Step 3: Get Groq API Key](#step-3-get-groq-api-key)
6. [Step 4: Configure Google OAuth](#step-4-configure-google-oauth)
7. [Step 5: Deploy to Vercel](#step-5-deploy-to-vercel)
8. [Step 6: Update Google OAuth URLs](#step-6-update-google-oauth-urls)
9. [Troubleshooting](#troubleshooting)

---

## Why Vercel for Everything?

**Benefits for small projects:**
- Free hobby tier (perfect for starting out)
- No server management
- Automatic HTTPS
- Global CDN
- Automatic deployments from GitHub

**Limitations to know:**
- Serverless functions have 10-second timeout on free tier
- Limited to 100GB bandwidth/month on free tier
- Python backend would need to be converted to Node.js API routes (already done!)

---

## Prerequisites

Create free accounts on:
- [GitHub](https://github.com) - Host your code
- [Vercel](https://vercel.com) - Hosting
- [Neon](https://neon.tech) - PostgreSQL database  
- [Upstash](https://upstash.com) - Redis cache
- [Groq](https://console.groq.com) - AI API
- [Google Cloud Console](https://console.cloud.google.com) - OAuth

---

## Step 1: Set Up Database (Neon PostgreSQL)

### 1.1 Create Account & Project

1. Go to **[neon.tech](https://neon.tech)**
2. Click **"Sign Up"** (use GitHub for easy login)
3. Click **"Create Project"**
4. Fill in:
   - Project name: `cv-wiz`
   - Database name: `cvwiz`
   - Region: Choose closest to you
5. Click **"Create project"**

### 1.2 Get Connection String

1. On your project dashboard, find **"Connection Details"**
2. Make sure **"Pooled connection"** is selected
3. Copy the connection string (looks like):
   ```
   postgresql://neondb_owner:abc123@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this** - you'll need it as `DATABASE_URL`

---

## Step 2: Set Up Redis (Upstash)

### 2.1 Create Account & Database

1. Go to **[upstash.com](https://upstash.com)**
2. Click **"Sign In"** → use GitHub
3. Click **"Create Database"**
4. Fill in:
   - Name: `cv-wiz-cache`
   - Type: **Regional** (free tier)
   - Region: Same as your Neon database
5. Click **"Create"**

### 2.2 Get Redis URL

1. On your database page, go to **"Details"** tab
2. Copy the **UPSTASH_REDIS_REST_URL** 
3. Also copy **UPSTASH_REDIS_REST_TOKEN**
4. For traditional Redis URL, scroll to find something like:
   ```
   redis://default:xxx@xxx.upstash.io:6379
   ```
5. **Save this** - you'll need it as `REDIS_URL`

---

## Step 3: Get Groq API Key

1. Go to **[console.groq.com](https://console.groq.com)**
2. Sign up with Google or GitHub
3. Go to **"API Keys"** in sidebar
4. Click **"Create API Key"**
5. Name: `cv-wiz`
6. Copy the key (starts with `gsk_`)
7. **Save this** - you'll need it as `GROQ_API_KEY`

---

## Step 4: Configure Google OAuth

### 4.1 Create OAuth Credentials

1. Go to **[Google Cloud Console](https://console.cloud.google.com)**
2. Create a new project or select existing
3. Enable the **Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search "Google+" → Click "Google+ API" → "Enable"
4. Go to **"APIs & Services"** → **"Credentials"**
5. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
6. If asked, configure consent screen:
   - User Type: **External**
   - App name: `CV-Wiz`
   - User support email: Your email
   - Developer email: Your email
   - Click "Save and Continue" through all steps
7. Back to Credentials → Create OAuth client ID:
   - Application type: **Web application**
   - Name: `cv-wiz-web`
   
### 4.2 Get Client ID and Secret

After creating, you'll see:
- **Client ID**: `123456789.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxx`

**Save both** - you'll need them later!

### 4.3 Configure Redirect URIs (after Vercel deploy)

Wait until after you deploy to get your Vercel URL, then come back to add:
- Authorized JavaScript Origins: `https://your-app.vercel.app`
- Authorized Redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

---

## Step 5: Deploy to Vercel

### 5.1 Push Code to GitHub

```bash
cd cv-wiz
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 5.2 Import to Vercel

1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your `cv-wiz` repository
5. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: Click "Edit" → type `frontend` → confirm
   - **Build Command**: `npm run build` (default)
   - **Install Command**: `npm install` (default)

### 5.3 Add Environment Variables

Still on the project setup page, expand **"Environment Variables"** and add these one by one:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `REDIS_URL` | Your Upstash Redis URL |
| `GROQ_API_KEY` | Your Groq API key |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Leave empty for now (Vercel sets automatically) |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |
| `NEXT_PUBLIC_API_URL` | Leave empty (using internal API routes) |

### 5.4 Deploy!

Click **"Deploy"** and wait 2-3 minutes.

### 5.5 Get Your URL

After deployment, Vercel gives you a URL like:
- `cv-wiz-xxx.vercel.app`

Copy this URL!

---

## Step 6: Update Google OAuth URLs

**Important**: Go back to Google Cloud Console now!

1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth client
3. Add under **Authorized JavaScript origins**:
   ```
   https://your-app-name.vercel.app
   ```
4. Add under **Authorized redirect URIs**:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
5. Click **Save**
6. Wait 5 minutes for changes to take effect

---

## Troubleshooting

### "Edge Function size is 1.02 MB"

**Fixed!** We replaced the heavy NextAuth middleware with a lightweight cookie check.

### "Database connection error"

1. Check your `DATABASE_URL` is correct in Vercel settings
2. Make sure you're using the **pooled** connection string from Neon
3. Redeploy after fixing

### "redirect_uri_mismatch" with Google OAuth

1. Make sure you added BOTH URLs to Google Console:
   - JavaScript origin: `https://your-app.vercel.app`
   - Redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
2. Wait 5-10 minutes for changes to propagate

### "Internal server error" on registration

1. Check DATABASE_URL is correct
2. Run Prisma migrations locally first:
   ```bash
   cd frontend
   DATABASE_URL="your_neon_url" npx prisma db push
   ```

### Dark mode looks broken

We use `data-theme` attribute. Make sure ThemeProvider is wrapping your app in `layout.tsx`.

---

## Quick Reference: All Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
GROQ_API_KEY=gsk_xxxxx
NEXTAUTH_SECRET=your-32-character-secret
GOOGLE_CLIENT_ID=123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

---

## Cost Breakdown (Free Tier)

| Service | Free Tier Limit |
|---------|-----------------|
| Vercel | 100GB bandwidth/month, unlimited deployments |
| Neon | 500MB storage, 1 compute hour/day |
| Upstash | 10,000 commands/day |
| Groq | 30 requests/minute, unlimited requests/month |
| Google OAuth | Free forever |

**Total monthly cost: $0** (for hobby/portfolio projects)

---

## Next Steps After Deployment

1. ✅ Test registration and login
2. ✅ Test Google OAuth
3. ✅ Add your profile data
4. ✅ Try generating a resume
5. ⬜ Add custom domain (optional)
6. ⬜ Set up monitoring (optional)
