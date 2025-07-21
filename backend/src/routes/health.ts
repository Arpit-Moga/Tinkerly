import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'llm-code-generator-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

router.get('/ready', (req, res) => {
  // Check if all required services are available
  const checks = {
    geminiApi: !!process.env.GEMINI_API_KEY,
    server: true
  };

  const isReady = Object.values(checks).every(Boolean);

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'Ready' : 'Not Ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

export { router as healthRouter };