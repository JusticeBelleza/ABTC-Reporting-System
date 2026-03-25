# Deployment Guide
**ABTC Reporting System – Abra Provincial Health Office**

This document provides step-by-step instructions for IT administrators to build and deploy the ABTC Reporting System. 

The system utilizes a modern serverless architecture:
* **Frontend Hosting:** Hostinger (Static Web Hosting)
* **Backend & Database:** Supabase (Managed PostgreSQL)
* **Build Tool:** Vite / React

---

## Prerequisites

Before deploying updates to the system, ensure you have the following:
* Node.js (v18.0 or higher)
* Access to the Supabase Dashboard (for database management and API keys)
* Access to Hostinger hPanel or FTP credentials

---

## Step 1: Environment Configuration

The application requires environment variables to securely connect to Supabase. **Never commit these keys to public repositories.**

1. In the root directory, create a `.env` file
2. Add the following variables:

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-secure-anon-key

---

## Step 2: Build the Application

Compile and optimize the React app before deployment.

1. Open your terminal in VSCode and run:
   npm install
   npm run build
2. After building, a dist folder will be generated containing the production-ready files.

---

## Step 3: Deploy to Hostinger

Method A: Hostinger File Manager (hPanel)

1. Log in to Hostinger and navigate to the hPanel.
2. Go to Websites and click Manage.
3. Open the File Manager.
4. Navigate to the public_html directory.
5. Delete the old files (do not delete the folder itself).
6. Upload the contents of your local dist folder into the public_html directory.

Method B: FTP (FileZilla)

1. Connect using your FTP credentials.
2. Navigate to /domains/yourdomain.com/public_html.
3. Upload the contents of your local dist folder, overwriting existing files.

Important: SPA Routing Configuration

Since the app uses React Router, you must configure fallback routing so direct URL visits don't break.

Create an .htaccess file inside your public_html directory with the following code:

   <IfModule mod_rewrite.c>
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   </IfModule>

Tip: You can place this .htaccess file inside your project's public folder before running npm run build, and Vite will automatically include it in your dist folder.

Deployment Complete

Your ABTC Reporting System should now be live and fully functional.