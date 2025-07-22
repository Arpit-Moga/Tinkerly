"""
Framework-specific prompt templates for optimized code generation.
"""

from typing import Dict, Any
from app.models.domain import Framework


class FrameworkTemplates:
    """Advanced framework-specific prompt templates."""
    
    @staticmethod
    def get_generation_template(framework: Framework) -> str:
        """Get framework-specific generation template."""
        templates = {
            Framework.REACT: """
You are an expert React developer. Create a modern React application with TypeScript.

REQUIREMENTS:
- Use React 18+ with functional components and hooks
- Implement TypeScript interfaces for all data structures
- Use modern React patterns (useState, useEffect, custom hooks)
- Include proper error boundaries and loading states
- Follow React best practices and naming conventions
- Use CSS modules or styled-components for styling
- Include proper accessibility attributes
- Implement responsive design principles

STRUCTURE:
- package.json with all necessary dependencies
- src/App.tsx as main component
- src/index.tsx as entry point
- src/components/ for reusable components
- src/hooks/ for custom hooks (if needed)
- src/types/ for TypeScript interfaces
- src/styles/ for styling files

CODING STANDARDS:
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Implement proper error handling
- Use React.memo for performance optimization where appropriate
- Follow the single responsibility principle
""",
            
            Framework.VUE: """
You are an expert Vue.js developer. Create a modern Vue 3 application with TypeScript.

REQUIREMENTS:
- Use Vue 3 with Composition API and <script setup>
- Implement TypeScript interfaces and proper typing
- Use reactive refs and computed properties effectively
- Include proper component lifecycle management
- Follow Vue 3 best practices and naming conventions
- Use CSS modules or scoped styles
- Include proper accessibility attributes
- Implement responsive design principles

STRUCTURE:
- package.json with Vue 3 and TypeScript dependencies
- src/App.vue as main component
- src/main.ts as entry point
- src/components/ for reusable components
- src/composables/ for composition functions
- src/types/ for TypeScript interfaces
- src/styles/ for styling files

CODING STANDARDS:
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Implement proper error handling
- Use defineProps and defineEmits with TypeScript
- Follow the single responsibility principle
""",
            
            Framework.SVELTE: """
You are an expert Svelte developer. Create a modern SvelteKit application with TypeScript.

REQUIREMENTS:
- Use SvelteKit with TypeScript support
- Implement reactive statements and stores effectively
- Use Svelte's built-in transitions and animations
- Include proper component lifecycle management
- Follow Svelte best practices and naming conventions
- Use CSS-in-JS or scoped styles
- Include proper accessibility attributes
- Implement responsive design principles

STRUCTURE:
- package.json with SvelteKit and TypeScript dependencies
- src/app.html as HTML template
- src/routes/+page.svelte as main page
- src/lib/ for reusable components and utilities
- src/stores/ for Svelte stores
- src/types/ for TypeScript interfaces

CODING STANDARDS:
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Implement proper error handling
- Use Svelte stores for state management
- Follow the single responsibility principle
""",
            
            Framework.ANGULAR: """
You are an expert Angular developer. Create a modern Angular application with TypeScript.

REQUIREMENTS:
- Use Angular 17+ with standalone components
- Implement TypeScript interfaces and services
- Use Angular signals and reactive forms
- Include proper dependency injection
- Follow Angular style guide and naming conventions
- Use Angular Material or custom CSS
- Include proper accessibility attributes
- Implement responsive design principles

STRUCTURE:
- package.json with Angular dependencies
- src/main.ts as bootstrap file
- src/app/app.component.ts as main component
- src/app/components/ for feature components
- src/app/services/ for business logic
- src/app/models/ for TypeScript interfaces
- src/app/shared/ for shared utilities

CODING STANDARDS:
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Implement proper error handling
- Use Angular services for data management
- Follow the single responsibility principle
""",
            
            Framework.NODEJS: """
You are an expert Node.js developer. Create a modern Node.js application with TypeScript.

REQUIREMENTS:
- Use Node.js with TypeScript and modern ES modules
- Implement Express.js with proper middleware
- Use async/await for asynchronous operations
- Include proper error handling and logging
- Follow Node.js best practices and naming conventions
- Implement proper security measures
- Include environment configuration
- Use proper database integration (if needed)

STRUCTURE:
- package.json with Node.js and TypeScript dependencies
- src/index.ts as entry point
- src/routes/ for API routes
- src/middleware/ for Express middleware
- src/services/ for business logic
- src/models/ for data models
- src/utils/ for utility functions
- src/config/ for configuration

CODING STANDARDS:
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Implement proper error handling
- Use environment variables for configuration
- Follow the single responsibility principle
"""
        }
        
        return templates.get(framework, templates[Framework.REACT])
    
    @staticmethod
    def get_validation_template(framework: Framework) -> str:
        """Get framework-specific validation template."""
        templates = {
            Framework.REACT: """
You are an expert React code reviewer. Analyze the provided React code for:

TECHNICAL ISSUES:
- Syntax errors and TypeScript type issues
- React-specific anti-patterns (e.g., direct state mutation)
- Missing dependencies in useEffect hooks
- Improper use of hooks (rules of hooks)
- Memory leaks and performance issues

BEST PRACTICES:
- Component composition and reusability
- Proper prop typing and validation
- State management patterns
- Error boundary implementation
- Accessibility compliance (ARIA attributes)

PERFORMANCE:
- Unnecessary re-renders
- Missing React.memo or useMemo optimizations
- Large bundle size issues
- Inefficient data fetching patterns

SECURITY:
- XSS vulnerabilities
- Unsafe HTML rendering
- Improper input validation
""",
            
            Framework.VUE: """
You are an expert Vue.js code reviewer. Analyze the provided Vue code for:

TECHNICAL ISSUES:
- Syntax errors and TypeScript type issues
- Vue-specific anti-patterns
- Improper reactivity usage
- Component lifecycle issues
- Template syntax errors

BEST PRACTICES:
- Component composition and reusability
- Proper prop and emit definitions
- State management with stores
- Proper use of Composition API
- Accessibility compliance

PERFORMANCE:
- Unnecessary reactivity triggers
- Missing computed properties
- Inefficient watchers
- Large bundle size issues

SECURITY:
- XSS vulnerabilities
- Unsafe template rendering
- Improper input validation
""",
            
            Framework.SVELTE: """
You are an expert Svelte code reviewer. Analyze the provided Svelte code for:

TECHNICAL ISSUES:
- Syntax errors and TypeScript type issues
- Svelte-specific anti-patterns
- Improper reactive statements
- Component lifecycle issues
- Store management issues

BEST PRACTICES:
- Component composition and reusability
- Proper prop definitions
- State management with stores
- Proper use of reactive statements
- Accessibility compliance

PERFORMANCE:
- Unnecessary reactive updates
- Missing derived stores
- Inefficient transitions
- Large bundle size issues

SECURITY:
- XSS vulnerabilities
- Unsafe HTML rendering
- Improper input validation
""",
            
            Framework.ANGULAR: """
You are an expert Angular code reviewer. Analyze the provided Angular code for:

TECHNICAL ISSUES:
- Syntax errors and TypeScript type issues
- Angular-specific anti-patterns
- Improper dependency injection
- Component lifecycle issues
- RxJS usage problems

BEST PRACTICES:
- Component architecture and modularity
- Proper service implementation
- State management patterns
- Proper use of Angular features
- Accessibility compliance

PERFORMANCE:
- Change detection issues
- Memory leaks in subscriptions
- Inefficient data binding
- Large bundle size issues

SECURITY:
- XSS vulnerabilities
- Improper sanitization
- Authentication/authorization issues
""",
            
            Framework.NODEJS: """
You are an expert Node.js code reviewer. Analyze the provided Node.js code for:

TECHNICAL ISSUES:
- Syntax errors and TypeScript type issues
- Async/await usage problems
- Error handling issues
- Memory leaks
- Database connection problems

BEST PRACTICES:
- API design and RESTful principles
- Middleware implementation
- Environment configuration
- Logging and monitoring
- Code organization

PERFORMANCE:
- Blocking operations
- Inefficient database queries
- Memory usage issues
- CPU-intensive operations

SECURITY:
- Authentication and authorization
- Input validation and sanitization
- SQL injection vulnerabilities
- Rate limiting and DDoS protection
- Sensitive data exposure
"""
        }
        
        return templates.get(framework, templates[Framework.NODEJS])
    
    @staticmethod
    def get_optimization_suggestions(framework: Framework) -> Dict[str, Any]:
        """Get framework-specific optimization suggestions."""
        suggestions = {
            Framework.REACT: {
                "performance": [
                    "Use React.memo for expensive components",
                    "Implement useMemo for expensive calculations",
                    "Use useCallback for event handlers",
                    "Consider code splitting with React.lazy",
                    "Optimize bundle size with tree shaking"
                ],
                "best_practices": [
                    "Use TypeScript for better type safety",
                    "Implement error boundaries",
                    "Use custom hooks for reusable logic",
                    "Follow the single responsibility principle",
                    "Add proper accessibility attributes"
                ]
            },
            Framework.VUE: {
                "performance": [
                    "Use computed properties for derived state",
                    "Implement v-memo for expensive lists",
                    "Use defineAsyncComponent for code splitting",
                    "Optimize bundle size with tree shaking",
                    "Use shallow refs for large objects"
                ],
                "best_practices": [
                    "Use TypeScript with Vue 3",
                    "Implement proper error handling",
                    "Use composables for reusable logic",
                    "Follow Vue style guide",
                    "Add proper accessibility attributes"
                ]
            },
            Framework.SVELTE: {
                "performance": [
                    "Use derived stores for computed values",
                    "Implement proper reactive statements",
                    "Use dynamic imports for code splitting",
                    "Optimize bundle size with rollup",
                    "Use keyed each blocks for lists"
                ],
                "best_practices": [
                    "Use TypeScript with SvelteKit",
                    "Implement proper error handling",
                    "Use stores for global state",
                    "Follow Svelte conventions",
                    "Add proper accessibility attributes"
                ]
            },
            Framework.ANGULAR: {
                "performance": [
                    "Use OnPush change detection strategy",
                    "Implement trackBy functions for lists",
                    "Use lazy loading for modules",
                    "Optimize bundle size with tree shaking",
                    "Use async pipes for observables"
                ],
                "best_practices": [
                    "Use TypeScript strictly",
                    "Implement proper error handling",
                    "Use services for business logic",
                    "Follow Angular style guide",
                    "Add proper accessibility attributes"
                ]
            },
            Framework.NODEJS: {
                "performance": [
                    "Use connection pooling for databases",
                    "Implement caching strategies",
                    "Use clustering for CPU-intensive tasks",
                    "Optimize database queries",
                    "Use compression middleware"
                ],
                "best_practices": [
                    "Use TypeScript for better type safety",
                    "Implement proper error handling",
                    "Use environment variables",
                    "Follow REST API conventions",
                    "Add proper security measures"
                ]
            }
        }
        
        return suggestions.get(framework, suggestions[Framework.NODEJS])