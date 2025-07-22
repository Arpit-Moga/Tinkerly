# LLM Code Generator - Python Backend

Python backend implementation using FastAPI and LangChain for the LLM Code Generator project.

## Setup

1. **Create virtual environment:**
   ```bash
   cd backend_python
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Gemini API key
   ```

4. **Run the development server:**
   ```bash
   python run.py
   ```

The API will be available at:
- API: http://localhost:3001
- Documentation: http://localhost:3001/docs
- Health check: http://localhost:3001/health

## Project Structure

```
backend_python/
├── app/
│   ├── config/          # Configuration and settings
│   ├── core/            # Core components (DI, exceptions)
│   ├── models/          # Pydantic models
│   └── main.py          # FastAPI application
├── requirements.txt     # Python dependencies
├── run.py              # Development server runner
└── README.md           # This file
```

## Phase 2 Status

✅ **Completed:**
- Basic FastAPI application setup
- Pydantic models for requests/responses
- Configuration management with environment variables
- Dependency injection container with services
- Exception handling
- CORS middleware
- Health check endpoint
- Structured logging
- **LangChain Gemini provider implementation**
- **Service layer with abstractions**
- **API endpoints for code generation and validation**
- **Streaming support for real-time generation**

## API Endpoints

### Core Features
- `POST /api/v1/generate/` - Generate code with caching
- `POST /api/v1/generate/validate` - Validate code with caching
- `POST /api/v1/stream/` - Stream code generation

### Provider Management
- `GET /api/v1/providers/available` - List available LLM providers
- `GET /api/v1/providers/current` - Get current provider info

### Monitoring & Health
- `GET /health` - Basic health check
- `GET /api/v1/monitoring/health/detailed` - Detailed health check
- `GET /api/v1/monitoring/metrics` - Application metrics
- `GET /api/v1/monitoring/performance` - Performance statistics
- `GET /docs` - API documentation

## Phase 3 Status

✅ **Completed:**
- **Advanced Prompt Engineering** - Framework-specific templates and optimization
- **Intelligent Caching Layer** - Redis with Memory fallback, smart cache keys
- **Performance Monitoring** - System metrics, health checks, performance stats
- **Enhanced Service Architecture** - Dependency injection with all services
- **Framework-Specific Optimization** - Tailored prompts for each framework
- **Cache-Aware Generation** - Automatic caching of expensive operations

🎯 **Advanced Features:**
- Framework-specific prompt templates for React, Vue, Svelte, Angular, Node.js
- Intelligent cache key generation based on request parameters
- Redis-based caching with automatic Memory fallback
- Comprehensive health monitoring and metrics
- Performance optimization suggestions per framework
- Advanced error handling and recovery