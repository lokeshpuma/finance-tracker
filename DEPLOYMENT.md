# Deployment Guide for Render

This guide will help you deploy the fin app to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. MongoDB Atlas account with a database cluster
3. Your MongoDB connection string

## Deployment Steps

### 1. Prepare Your Repository

All necessary files are already configured:
- ✅ `render.yaml` - Render deployment configuration
- ✅ `.env.example` - Environment variables template
- ✅ MongoDB connection uses environment variables

### 2. Set Up MongoDB Atlas

1. Go to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Create a cluster if you don't have one
3. Get your connection string from the Atlas dashboard
4. Make sure your IP is whitelisted (or use 0.0.0.0/0 for Render)

### 3. Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to Render Dashboard → New → Blueprint
3. Connect your repository
4. Render will automatically detect `render.yaml` and configure the service
5. Add environment variables in the Render dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `MONGODB_DB_NAME`: `finance` (or your database name)
   - `NODE_ENV`: `production`

#### Option B: Manual Setup

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to Render Dashboard → New → Web Service
3. Connect your repository
4. Configure the service:
   - **Name**: `fin-app` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose a paid plan)
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `MONGODB_DB_NAME`: `finance`
   - `NODE_ENV`: `production`
6. Click "Create Web Service"

### 4. Environment Variables

Make sure to set these environment variables in Render:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=appname
MONGODB_DB_NAME=finance
NODE_ENV=production
```

**Important**: Never commit your `.env` file to git. It's already in `.gitignore`.

### 5. Post-Deployment

After deployment:
1. Check the logs in Render dashboard to ensure the app started successfully
2. Visit your Render URL (e.g., `https://fin-app.onrender.com`)
3. Test the application functionality

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (Render uses Node 18+ by default)

### MongoDB Connection Issues
- Verify your MongoDB URI is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure the database name matches your `MONGODB_DB_NAME` variable

### Runtime Errors
- Check Render logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is properly URL-encoded

## Local Development

For local development:
1. Copy `.env.example` to `.env`
2. Update `.env` with your MongoDB credentials
3. Run `npm install`
4. Run `npm run dev`

## Notes

- The app uses Next.js standalone output mode for optimal deployment
- Render free tier spins down after 15 minutes of inactivity
- Consider upgrading to a paid plan for production use

