# GitHub OAuth Setup Guide

The 404 error you're seeing means the GitHub OAuth app isn't properly configured. Here's how to fix it:

## 🔧 **Step 1: Create GitHub OAuth App**

1. **Go to GitHub:**
   - Visit [github.com](https://github.com)
   - Click your profile picture → **Settings**
   - Scroll down to **Developer settings** (left sidebar)
   - Click **OAuth Apps**

2. **Create New OAuth App:**
   - Click **"New OAuth App"**
   - Fill in the details:
     - **Application name:** `Water Tracker App`
     - **Homepage URL:** `https://your-project.supabase.co` (your Supabase URL)
     - **Authorization callback URL:** `https://your-project.supabase.co/auth/v1/callback`
   - Click **"Register application"**

3. **Copy Credentials:**
   - Copy the **Client ID**
   - Generate and copy the **Client Secret**

## 🔧 **Step 2: Configure Supabase**

1. **Go to Supabase Dashboard:**
   - Visit [supabase.com](https://supabase.com)
   - Open your project
   - Go to **Authentication** → **Providers**

2. **Enable GitHub Provider:**
   - Find **GitHub** in the list
   - Toggle **Enable GitHub provider**
   - Enter your GitHub OAuth credentials:
     - **Client ID:** (from GitHub)
     - **Client Secret:** (from GitHub)
   - Click **Save**

## 🔧 **Step 3: Test the Flow**

1. **Try GitHub OAuth again**
2. **Check console logs** for any errors
3. **Should redirect properly** to GitHub and back

## 🚨 **Common Issues & Solutions**

### **Issue: 404 Error on GitHub**
**Cause:** Wrong callback URL in GitHub OAuth app
**Solution:** Make sure callback URL is exactly: `https://your-project.supabase.co/auth/v1/callback`

### **Issue: "Invalid redirect URI"**
**Cause:** Supabase and GitHub URLs don't match
**Solution:** Double-check both URLs match exactly

### **Issue: "Application not found"**
**Cause:** GitHub OAuth app not created or wrong Client ID
**Solution:** Verify GitHub OAuth app exists and Client ID is correct

## 🔄 **Alternative: Use Email Authentication**

If you want to skip GitHub OAuth for now:

1. **Click "Use Email Instead"** on the login screen
2. **Use email/password** authentication
3. **Configure later** when you have time

## 📋 **Quick Checklist**

- [ ] GitHub OAuth app created
- [ ] Callback URL set correctly
- [ ] Supabase GitHub provider enabled
- [ ] Client ID and Secret entered in Supabase
- [ ] Tested the flow

## 🆘 **Still Having Issues?**

If you're still getting errors:

1. **Check console logs** - Look for specific error messages
2. **Verify URLs** - Make sure they match exactly
3. **Try email auth** - Use the fallback option
4. **Check Supabase logs** - Look in Authentication → Logs

The email authentication will work immediately while you set up GitHub OAuth!
