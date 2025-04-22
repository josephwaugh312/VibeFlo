# VibeFlo Deployment Guide

This guide outlines the steps to deploy the VibeFlo application to various platforms. VibeFlo is a full-stack application with a React frontend and a Node.js/Express backend.

## Prerequisites

Before deployment, ensure you have:

1. A GitHub account with your code pushed to a repository
2. OAuth credentials configured (GitHub, Google)
3. A PostgreSQL database instance
4. Node.js and npm installed on your local machine

## Deployment Options

### Option 1: Deploying to Render (Recommended for Portfolios)

Render is a unified cloud platform that offers free tiers for both static sites and web services, making it ideal for portfolio projects.

#### Deploying the Backend (Server)

1. Sign up for a Render account at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Name: `vibeflo-api`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add environment variables from your `.env` file

5. Create a PostgreSQL database on Render:
   - Go to the Render dashboard and select "New PostgreSQL"
   - Name your database `vibeflo-db`
   - Note the connection string provided

6. Add the database connection string to your Web Service environment variables:
   ```
   DATABASE_URL=your_render_postgres_connection_string
   ```

#### Deploying the Frontend (Client)

1. In the Render dashboard, create a new Static Site
2. Connect your GitHub repository
3. Configure the site:
   - Name: `vibeflo`
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
   - Add environment variables:
     ```
     REACT_APP_API_URL=https://your-backend-service-name.onrender.com/api
     REACT_APP_OAUTH_REDIRECT_URL=https://your-frontend-url.onrender.com/oauth-callback
     ```

4. Update OAuth callback URLs:
   - Update GitHub OAuth app settings in your GitHub Developer settings
   - Update Google OAuth app settings in Google Cloud Console
   - Set callbacks to: `https://your-backend-service-name.onrender.com/api/auth/[provider]/callback`

### Option 2: Deploying to Heroku

#### Deploying the Backend

1. Create a `Procfile` in the project root:
   ```
   web: cd server && npm start
   ```

2. Sign up for Heroku and install the Heroku CLI
3. Login to Heroku: `heroku login`
4. Create a Heroku app: `heroku create vibeflo-api`
5. Add Heroku PostgreSQL addon: `heroku addons:create heroku-postgresql:hobby-dev`
6. Set environment variables:
   ```
   heroku config:set NODE_ENV=production JWT_SECRET=your_secret_key ... (etc)
   ```
7. Push to Heroku: `git push heroku main`

#### Deploying the Frontend

1. Create a separate Heroku app for the frontend: `heroku create vibeflo-client`
2. Set the buildpack: `heroku buildpacks:set https://github.com/mars/create-react-app-buildpack.git`
3. Set environment variables:
   ```
   heroku config:set REACT_APP_API_URL=https://vibeflo-api.herokuapp.com/api
   heroku config:set REACT_APP_OAUTH_REDIRECT_URL=https://vibeflo-client.herokuapp.com/oauth-callback
   ```
4. Deploy: `git subtree push --prefix client heroku main`

### Option 3: Deploying to AWS

For a more robust solution suitable for production environments, AWS offers a complete deployment ecosystem.

#### Backend Deployment with AWS Elastic Beanstalk

1. Create an `.ebextensions` folder in your server directory with configuration files
2. Create an Amazon RDS PostgreSQL instance
3. Configure environment variables in the Elastic Beanstalk console
4. Deploy using the AWS CLI or AWS Elastic Beanstalk CLI

#### Frontend Deployment with AWS Amplify

1. Configure the build settings in the Amplify console
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

## Post-Deployment Steps

After deployment, don't forget to:

1. Test all functionality in the production environment
2. Update OAuth callback URLs in provider developer consoles
3. Set up monitoring (e.g., AWS CloudWatch, Sentry)
4. Configure a custom domain (optional)
5. Set up HTTPS if not automatically provided

## Domain Configuration

If you want to use a custom domain:

1. Purchase a domain from a provider like Namecheap, GoDaddy, or Google Domains
2. Configure DNS settings to point to your deployed application
3. Update environment variables with the new domain
4. Update OAuth callback URLs with the new domain

## Automating Deployment with CI/CD

Consider setting up CI/CD pipelines for automated deployment:

1. GitHub Actions: Add workflow files in `.github/workflows/`
2. CircleCI: Add a `config.yml` file
3. Travis CI: Add a `.travis.yml` file

These pipelines can automate testing and deployment whenever you push changes to your repository.

## Troubleshooting

Common deployment issues and solutions:

1. CORS errors: Ensure your backend is configured to accept requests from your frontend domain
2. OAuth callback issues: Double-check all callback URLs in provider settings
3. Database connection errors: Verify connection strings and credentials
4. Environment variable issues: Ensure all required variables are set in the production environment 