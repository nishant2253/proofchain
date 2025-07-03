# ProofChain Frontend Deployment Guide

This guide provides instructions for deploying the ProofChain frontend to various environments.

## Prerequisites

- Node.js 14+ and npm installed
- Backend API accessible from the deployment server

## Building for Production

1. Install dependencies:

```
npm install
```

2. Build the production bundle:

```
npm run build
```

This creates a `build` directory containing optimized, minified files ready for deployment.

## Deployment Options

### Option 1: Static File Server

The simplest way to deploy the frontend is using a static file server:

```
npm install -g serve
serve -s build -l 5003
```

This will serve the production build on port 5003.

### Option 2: Nginx

1. Install Nginx:

```
sudo apt update
sudo apt install nginx
```

2. Create an Nginx configuration file:

```
sudo nano /etc/nginx/sites-available/proofchain
```

3. Add the following configuration:

```
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    root /path/to/proofchain/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Forward API requests to the backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Enable the site and restart Nginx:

```
sudo ln -s /etc/nginx/sites-available/proofchain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 3: Docker

1. Create a Dockerfile in the project root:

```Dockerfile
FROM node:14-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create an nginx.conf file:

```
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;

    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

3. Build and run the Docker container:

```
docker build -t proofchain-frontend .
docker run -d -p 8080:80 proofchain-frontend
```

## Environment Configuration

For production, create a `.env.production` file with the appropriate settings:

```
REACT_APP_API_BASE_URL=https://api.your-domain.com/api
REACT_APP_BLOCKCHAIN_NETWORK=mainnet
```

Build with the production environment:

```
npm run build
```

## Updating Deployed Application

1. Pull the latest changes:

```
git pull origin main
```

2. Install dependencies:

```
npm install
```

3. Rebuild the application:

```
npm run build
```

4. Restart your server or redeploy as needed.

## Troubleshooting

1. **API Connection Issues**: Ensure the API URL is correctly set and the backend is accessible.

2. **Routing Issues**: Make sure your server is configured to serve index.html for client-side routing.

3. **Blank Screen**: Check the browser console for errors, verify that all assets are loading correctly.

4. **Performance Issues**: Consider implementing a CDN for improved global performance.

## Monitoring

For production deployments, consider adding:

- Error tracking (Sentry, LogRocket, etc.)
- Analytics (Google Analytics, Plausible, etc.)
- Performance monitoring (Lighthouse CI, WebPageTest, etc.)
