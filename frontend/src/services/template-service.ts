import { Framework, FileContent } from '../store/useAppStore';

export class TemplateService {
  getTemplate(framework: Framework): FileContent {
    switch (framework) {
      case 'react':
        return this.getReactTemplate();
      case 'vue':
        return this.getVueTemplate();
      case 'svelte':
        return this.getSvelteTemplate();
      case 'angular':
        return this.getAngularTemplate();
      case 'nodejs':
        return this.getNodejsTemplate();
      default:
        return {};
    }
  }

  private getReactTemplate(): FileContent {
    return {
      'package.json': JSON.stringify({
        name: 'react-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite --port 4173 --host 0.0.0.0',
          build: 'tsc && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/react': '^18.2.66',
          '@types/react-dom': '^18.2.22',
          '@vitejs/plugin-react': '^4.2.1',
          autoprefixer: '^10.4.19',
          postcss: '^8.4.38',
          tailwindcss: '^3.4.3',
          typescript: '^5.4.5',
          vite: '^5.2.0'
        }
      }, null, 2),
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
    host: '0.0.0.0',
    cors: true,
    strictPort: true
  }
})`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ['src'],
        references: [{ path: './tsconfig.node.json' }]
      }, null, 2),
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to React!
        </h1>
        <p className="text-gray-600">
          Your React application is ready to be customized.
        </p>
      </div>
    </div>
  )
}

export default App`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`
    };
  }

  private getVueTemplate(): FileContent {
    return {
      'package.json': JSON.stringify({
        name: 'vue-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite --port 4173 --host 0.0.0.0',
          build: 'vue-tsc && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          vue: '^3.4.21'
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^5.0.4',
          '@vue/tsconfig': '^0.5.1',
          autoprefixer: '^10.4.19',
          postcss: '^8.4.38',
          tailwindcss: '^3.4.3',
          typescript: '^5.4.5',
          vite: '^5.2.0',
          'vue-tsc': '^2.0.6'
        }
      }, null, 2),
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      'vite.config.ts': `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 4173,
    host: '0.0.0.0',
    cors: true,
    strictPort: true
  }
})`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}`,
      'src/main.ts': `import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')`,
      'src/App.vue': `<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-md">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">
        Welcome to Vue!
      </h1>
      <p class="text-gray-600">
        Your Vue application is ready to be customized.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Your Vue component logic here
</script>`,
      'src/style.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`
    };
  }

  private getSvelteTemplate(): FileContent {
    return {
      'package.json': JSON.stringify({
        name: 'svelte-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite dev --port 4173 --host 0.0.0.0',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          '@sveltejs/kit': '^2.5.7'
        },
        devDependencies: {
          '@sveltejs/adapter-auto': '^3.2.0',
          '@sveltejs/vite-plugin-svelte': '^3.1.0',
          autoprefixer: '^10.4.19',
          postcss: '^8.4.38',
          svelte: '^4.2.15',
          tailwindcss: '^3.4.3',
          typescript: '^5.4.5',
          vite: '^5.2.0',
          '@sveltejs/adapter-static': '^3.0.1'
        }
      }, null, 2),
      'vite.config.js': `import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 4173,
    host: '0.0.0.0',
    cors: true,
    strictPort: true
  }
});`,
      'src/app.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>`,
      'src/routes/+layout.svelte': `<script>
  import '../app.css';
</script>

<slot />`,
      'src/routes/+page.svelte': `<div class="min-h-screen bg-gray-100 flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold text-gray-900 mb-4">
      Welcome to Svelte!
    </h1>
    <p class="text-gray-600">
      Your Svelte application is ready to be customized.
    </p>
  </div>
</div>`,
      'src/app.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`
    };
  }

  private getAngularTemplate(): FileContent {
    return {
      'package.json': JSON.stringify({
        name: 'angular-app',
        version: '0.0.0',
        scripts: {
          dev: 'ng serve --host 0.0.0.0 --port 4200 --disable-host-check',
          build: 'ng build',
          watch: 'ng build --watch --configuration development',
          test: 'ng test'
        },
        dependencies: {
          '@angular/animations': '^17.3.0',
          '@angular/common': '^17.3.0',
          '@angular/compiler': '^17.3.0',
          '@angular/core': '^17.3.0',
          '@angular/forms': '^17.3.0',
          '@angular/platform-browser': '^17.3.0',
          '@angular/platform-browser-dynamic': '^17.3.0',
          '@angular/router': '^17.3.0',
          rxjs: '~7.8.0',
          tslib: '^2.3.0',
          'zone.js': '~0.14.0'
        },
        devDependencies: {
          '@angular-devkit/build-angular': '^17.3.0',
          '@angular/cli': '~17.3.0',
          '@angular/compiler-cli': '^17.3.0',
          '@types/jasmine': '~5.1.0',
          autoprefixer: '^10.4.19',
          jasmine: '~5.1.0',
          postcss: '^8.4.38',
          tailwindcss: '^3.4.3',
          typescript: '~5.4.0'
        }
      }, null, 2),
      'src/index.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Angular App</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>`,
      'src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent)
  .catch(err => console.error(err));`,
      'src/app/app.component.ts': `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-md">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Angular!
        </h1>
        <p class="text-gray-600">
          Your Angular application is ready to be customized.
        </p>
      </div>
    </div>
  \`,
  styles: []
})
export class AppComponent {
  title = 'angular-app';
}`,
      'src/styles.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`
    };
  }

  private getNodejsTemplate(): FileContent {
    return {
      'package.json': JSON.stringify({
        name: 'nodejs-app',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'tsx watch --clear-screen=false src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js'
        },
        dependencies: {
          express: '^4.19.2',
          cors: '^2.8.5'
        },
        devDependencies: {
          '@types/express': '^4.17.21',
          '@types/cors': '^2.8.17',
          '@types/node': '^20.12.7',
          tsx: '^4.7.2',
          typescript: '^5.4.5'
        }
      }, null, 2),
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          outDir: './dist',
          rootDir: './src'
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      }, null, 2),
      'src/index.ts': `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Node.js API!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'nodejs-app',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Server running on http://0.0.0.0:\${PORT}\`);
  console.log(\`📱 Health check: http://0.0.0.0:\${PORT}/api/health\`);
});`
    };
  }
}