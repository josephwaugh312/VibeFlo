# OAuth Callback Configuration for vibeflo.app

This guide explains how to fix the 404 error that occurs when trying to authenticate with OAuth providers like GitHub and Google on your new vibeflo.app domain.

## The Problem

The OAuth authentication is failing with a 404 error because the callback URLs are configured to go to `/api/auth/github/callback` directly on your domain, but the frontend application doesn't have a route for this path.

## The Solution

We've already updated the server-side code to use relative paths for OAuth callbacks. Now you need to update the callback URLs in your OAuth provider settings.

### GitHub OAuth Settings

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select your OAuth App for VibeFlo
3. Update the callback URL:
   - From: `https://vibeflo.app/api/auth/github/callback`
   - To: `https://vibeflo-api.onrender.com/api/auth/github/callback`

4. Click "Update application" to save changes

### Google OAuth Settings

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find and edit your OAuth 2.0 Client ID for VibeFlo
4. Update the Authorized redirect URI:
   - From: `https://vibeflo.app/api/auth/google/callback`
   - To: `https://vibeflo-api.onrender.com/api/auth/google/callback`

5. Click "Save" to apply changes

## Environment Variables to Update

Make sure your server environment variables in Render are set correctly:

```
CLIENT_URL=https://vibeflo.app
GOOGLE_CALLBACK_URL=/api/auth/google/callback
GITHUB_CALLBACK_URL=/api/auth/github/callback
```

## Testing the Fix

1. Redeploy your server application to apply the code changes
2. Try logging in with GitHub or Google on your site
3. You should be redirected to the OAuth provider, then back to your application successfully

## Technical Explanation

The issue occurs because the frontend and backend are deployed separately:

- Frontend is at: `https://vibeflo.app`
- Backend is at: `https://vibeflo-api.onrender.com`

When an OAuth provider tries to redirect to `https://vibeflo.app/api/auth/github/callback`, that route doesn't exist on the frontend. Instead, we need the callback to go directly to your backend server, which then redirects to the frontend's OAuth callback page after successful authentication. 