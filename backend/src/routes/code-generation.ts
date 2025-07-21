import { Router } from 'express';
import { z } from 'zod';
import { LLMService } from '../services/llm-service.js';
import { validateRequest } from '../middleware/validate-request.js';

const router = Router();
const llmService = new LLMService();

// Request validation schema
const generateCodeSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    framework: z.enum(['react', 'vue', 'svelte', 'angular', 'nodejs'], {
      errorMap: () => ({ message: 'Framework must be one of: react, vue, svelte, angular, nodejs' })
    }),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })).optional().default([])
  })
});

// Generate code endpoint
router.post('/', validateRequest(generateCodeSchema), async (req, res, next) => {
  try {
    const { prompt, framework, conversationHistory } = req.body;

    console.log(`🤖 Generating ${framework} code for prompt: "${prompt.substring(0, 100)}..."`);

    const result = await llmService.generateCode({
      prompt,
      framework,
      conversationHistory
    });

    console.log(`✅ Code generation completed for ${framework}`);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Code generation failed:', error);
    next(error);
  }
});

// Validate code endpoint
router.post('/validate', validateRequest(z.object({
  body: z.object({
    files: z.record(z.string()),
    framework: z.enum(['react', 'vue', 'svelte', 'angular', 'nodejs'])
  })
})), async (req, res, next) => {
  try {
    const { files, framework } = req.body;

    const validation = await llmService.validateCode({
      files,
      framework
    });

    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Code validation failed:', error);
    next(error);
  }
});

// Get framework templates endpoint
router.get('/templates/:framework', async (req, res, next) => {
  try {
    const framework = req.params.framework as any;
    
    if (!['react', 'vue', 'svelte', 'angular', 'nodejs'].includes(framework)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid framework specified'
      });
    }

    const template = await llmService.getFrameworkTemplate(framework);

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Template retrieval failed:', error);
    next(error);
  }
});

export { router as codeGenerationRouter };