# Deployment Guide

This guide covers deploying the LLM Code Generator to various hosting platforms.

## 🚀 Quick Deploy Options

### Frontend Deployment

#### Vercel (Recommended)
1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from frontend directory
   cd frontend
   vercel
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add: `VITE_GEMINI_API_KEY` = your_gemini_api_key
   - Add: `VITE_BACKEND_URL` = your_backend_url

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `frontend`

#### Netlify
1. **Deploy via Git**
   - Connect your repository to Netlify
   - Set build directory to `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

2. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add: `VITE_GEMINI_API_KEY` = your_gemini_api_key
   - Add: `VITE_BACKEND_URL` = your_backend_url

### Backend Deployment

#### Railway (Recommended)
1. **Deploy via CLI**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

2. **Configure Environment Variables**
   ```bash
   railway variables set GEMINI_API_KEY=your_gemini_api_key
   railway variables set FRONTEND_URL=your_frontend_url
   railway variables set NODE_ENV=production
   ```

#### Render
1. **Create Web Service**
   - Connect your repository
   - Set root directory to `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

2. **Environment Variables**
   - Add: `GEMINI_API_KEY` = your_gemini_api_key
   - Add: `FRONTEND_URL` = your_frontend_url
   - Add: `NODE_ENV` = production

#### Heroku
1. **Deploy via Git**
   ```bash
   # Create Heroku app
   heroku create your-app-name
   
   # Set buildpack for backend
   heroku buildpacks:set heroku/nodejs
   
   # Configure environment variables
   heroku config:set GEMINI_API_KEY=your_gemini_api_key
   heroku config:set FRONTEND_URL=your_frontend_url
   heroku config:set NODE_ENV=production
   
   # Deploy
   git subtree push --prefix backend heroku main
   ```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_BACKEND_URL=https://your-backend-url.com
```

#### Backend (.env)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=https://your-frontend-url.com
NODE_ENV=production
PORT=3001
```

### CORS Configuration

Update `backend/src/index.ts` for production:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.com',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## 📦 Docker Deployment (Optional)

### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - VITE_BACKEND_URL=http://localhost:3001
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - FRONTEND_URL=http://localhost:3000
      - NODE_ENV=production
```

## 🔍 Health Checks

### Backend Health Check
```bash
curl https://your-backend-url.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "service": "llm-code-generator-backend",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0"
}
```

### Frontend Health Check
- Visit your frontend URL
- Check browser console for errors
- Verify WebContainer initialization

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify FRONTEND_URL in backend environment
   - Check CORS configuration in backend
   - Ensure protocol (http/https) matches

2. **WebContainer Issues**
   - Ensure HTTPS for production (required for WebContainers)
   - Check browser compatibility
   - Verify COOP/COEP headers

3. **API Key Issues**
   - Verify Gemini API key is correct
   - Check API key permissions
   - Ensure environment variables are set

4. **Build Failures**
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Verify all dependencies are installed

### Performance Optimization

1. **Frontend**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement code splitting
   - Optimize bundle size

2. **Backend**
   - Enable response compression
   - Implement request rate limiting
   - Add response caching
   - Monitor memory usage

## 📊 Monitoring

### Recommended Tools
- **Frontend**: Vercel Analytics, Google Analytics
- **Backend**: Railway Metrics, Render Metrics
- **Errors**: Sentry, LogRocket
- **Performance**: Lighthouse, Web Vitals

### Custom Monitoring
```typescript
// Add to backend for custom metrics
app.use('/api/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  });
});
```

## 🔐 Security Considerations

1. **API Keys**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **CORS**
   - Restrict origins to known domains
   - Avoid wildcard origins in production

3. **Rate Limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

4. **Input Validation**
   - Validate all user inputs
   - Sanitize prompts before sending to LLM
   - Implement request size limits