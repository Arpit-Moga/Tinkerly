import { Router } from 'express';
import { z } from 'zod';
import { LLMService } from '../services/llm-service.js';
import { validateRequest } from '../middleware/validate-request.js';

const router = Router();
const llmService = new LLMService();

// Request validation schema for streaming
const generateCodeStreamSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    framework: z.enum(['react', 'vue', 'svelte', 'angular', 'nodejs'], {
      errorMap: () => ({ message: 'Framework must be one of: react, vue, svelte, angular, nodejs' })
    }),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })).optional().default([]),
    currentFiles: z.record(z.string()).optional().default({})
  })
});

// Streaming code generation endpoint
router.post('/', validateRequest(generateCodeStreamSchema), async (req, res, next) => {
  try {
    const { prompt, framework, conversationHistory, currentFiles } = req.body;

    console.log(`🤖 Streaming ${framework} code generation for prompt: "${prompt.substring(0, 100)}..."`);

    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    try {
      const result = await llmService.generateCodeWithStreaming({
        prompt,
        framework,
        conversationHistory,
        currentFiles
      }, (chunk: string) => {
        // Filter out code blocks and JSON from streaming to avoid UI issues
        if (!chunk.includes('```') && !chunk.includes('{') && !chunk.includes('}') && chunk.trim().length > 0) {
          res.write(`data: ${JSON.stringify({ type: 'message_chunk', content: chunk })}\n\n`);
        }
      });

      // Send files
      res.write(`data: ${JSON.stringify({ type: 'files', files: result.files })}\n\n`);

      // Send completion
      res.write(`data: ${JSON.stringify({ 
        type: 'done', 
        suggestions: result.suggestions || [] 
      })}\n\n`);

      console.log(`✅ Streaming code generation completed for ${framework}`);
    } catch (error) {
      console.error('❌ Streaming code generation failed:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Generation failed' 
      })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('❌ Streaming endpoint error:', error);
    next(error);
  }
});

export { router as streamingRouter };