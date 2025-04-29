# OAuth Configuration Fix Guide

## Problem: Redirect URI Mismatch Errors

You're experiencing the following errors:
- GitHub: "The redirect_uri is not associated with this application."
- Google: "Error 400: redirect_uri_mismatch"

These errors occur because the OAuth providers are being sent redirect URIs that don't match what's configured in their developer consoles.

## Solution

### Step 1: Update GitHub OAuth App Settings

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select your OAuth App for VibeFlo
3. Under "Authorization callback URL", enter:
   ```
   https://vibeflo-api.onrender.com/api/auth/github/callback
   ```
4. Click "Update application" to save changes

### Step 2: Update Google OAuth Settings

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find and edit your OAuth 2.0 Client ID for VibeFlo
4. Under "Authorized redirect URIs", add:
   ```
   https://vibeflo-api.onrender.com/api/auth/google/callback
   ```
5. Click "Save" to apply changes

### Step 3: Check Server Environment Variables

Make sure these environment variables are set correctly in your Render dashboard for the server:

1. Go to your Render dashboard
2. Select your VibeFlo API service
3. Navigate to "Environment" tab
4. Add or update these variables:
   ```
   CLIENT_URL=https://vibeflo.app
   GOOGLE_CALLBACK_URL=/api/auth/google/callback
   GITHUB_CALLBACK_URL=/api/auth/github/callback
   ```
5. Click "Save Changes" and trigger a redeploy

### Step 4: Update Login Page URLs (Already Done)

We've already updated the OAuth URLs in the Login page to point directly to the API server:
```jsx
<a href={`https://vibeflo-api.onrender.com/api/auth/google`}>
<a href={`https://vibeflo-api.onrender.com/api/auth/github`}>
```

### Step 5: Clear Cache and Test

1. In your browser, clear the cache and cookies for vibeflo.app
2. Try logging in with GitHub or Google again
3. You should now be correctly redirected to the OAuth provider and back to your application

## Technical Explanation

The issue stems from a mismatch between:
1. The callback URL in the OAuth provider settings
2. The callback URL being sent in the OAuth request

In OAuth flows, the provider checks this to prevent malicious sites from stealing auth tokens. Each provider must be explicitly configured with the exact callback URL that your application will use.

Since you're now hosting your API at https://vibeflo-api.onrender.com, all OAuth callbacks must go to this domain, not to vibeflo.app. 