import { WebContainer } from '@webcontainer/api';
import { FileContent } from '../store/useAppStore';

// Singleton pattern to ensure only one WebContainer instance
let webContainerInstance: WebContainer | null = null;
let isBooting = false;

export class WebContainerManager {
  private devServerProcess: any = null;

  async initialize(): Promise<void> {
    // Return existing instance if already booted
    if (webContainerInstance) {
      console.log('Using existing WebContainer instance');
      return;
    }
    
    // Prevent multiple boot attempts
    if (isBooting) {
      console.log('WebContainer is already booting, waiting...');
      // Wait for the current boot process to complete
      while (isBooting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    isBooting = true;
    
    try {
      webContainerInstance = await WebContainer.boot();
      console.log('WebContainer booted successfully');
    } catch (error) {
      console.error('Failed to boot WebContainer:', error);
      throw new Error('Failed to initialize WebContainer. Please ensure you are using a supported browser.');
    } finally {
      isBooting = false;
    }
  }

  private getWebContainer(): WebContainer {
    if (!webContainerInstance) {
      throw new Error('WebContainer not initialized. Call initialize() first.');
    }
    return webContainerInstance;
  }

  async createProject(files: FileContent): Promise<void> {
    const webcontainer = this.getWebContainer();

    try {
      // Convert files to WebContainer format
      const webContainerFiles = this.convertFilesToWebContainerFormat(files);
      
      console.log('Mounting files:', Object.keys(files));
      
      // Debug: Log the package.json content to verify it's valid
      if (files['package.json']) {
        console.log('package.json content type:', typeof files['package.json']);
        console.log('package.json content:', files['package.json']);
        
        const packageJsonContent = typeof files['package.json'] === 'string' 
          ? files['package.json'] 
          : JSON.stringify(files['package.json'], null, 2);
          
        try {
          JSON.parse(packageJsonContent);
          console.log('package.json is valid JSON');
        } catch (e) {
          console.error('package.json is invalid JSON:', e);
          console.error('Raw content:', packageJsonContent);
          throw new Error('Generated package.json is not valid JSON');
        }
      }
      
      // Mount the file system
      await webcontainer.mount(webContainerFiles);
      console.log('Files mounted successfully');
      
      // Verify files were mounted and check package.json content
      const mountedFiles = await webcontainer.fs.readdir('.', { withFileTypes: true });
      console.log('Mounted files verified:', mountedFiles.map(f => f.name));
      
      // Verify package.json was mounted correctly
      if (files['package.json']) {
        const mountedPackageJson = await webcontainer.fs.readFile('package.json', 'utf-8');
        console.log('Mounted package.json content:', mountedPackageJson);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      console.error('Error details:', error);
      throw new Error(`Failed to mount project files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async installDependencies(onOutput?: (data: string) => void): Promise<void> {
    const webcontainer = this.getWebContainer();

    try {
      // Check if package.json exists
      try {
        await webcontainer.fs.readFile('package.json');
      } catch (e) {
        throw new Error('package.json not found. Please ensure files are mounted correctly.');
      }

      const installProcess = await webcontainer.spawn('npm', ['install']);
      
      if (onOutput) {
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            onOutput(data);
          }
        }));
      }

      const exitCode = await installProcess.exit;
      if (exitCode !== 0) {
        throw new Error(`npm install failed with exit code ${exitCode}`);
      }
      
      console.log('Dependencies installed successfully');
    } catch (error) {
      console.error('Failed to install dependencies:', error);
      throw new Error(`Failed to install dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async startDevServer(onOutput?: (data: string) => void): Promise<string> {
    const webcontainer = this.getWebContainer();

    try {
      // Start the dev server
      this.devServerProcess = await webcontainer.spawn('npm', ['run', 'dev']);
      
      if (onOutput) {
        this.devServerProcess.output.pipeTo(new WritableStream({
          write(data) {
            onOutput(data);
          }
        }));
      }

      // Return the preview URL
      const url = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout - please check the logs for errors'));
        }, 45000); // 45 second timeout

        let resolved = false;

        // Listen for server-ready event
        webcontainer.on('server-ready', (port, url) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.log(`Server ready on port ${port}: ${url}`);
            resolve(url);
          }
        });

        // Also check common dev server ports manually
        const checkPorts = [4173, 4200, 8080, 5000, 3001, 8000];
        let checkAttempts = 0;
        const maxAttempts = 20;

        const checkPort = async (port: number) => {
          try {
            // Skip port 3000 to avoid our main app
            if (port === 3000) return;
            
            const response = await fetch(`http://localhost:${port}`, {
              method: 'HEAD',
              mode: 'no-cors'
            });
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              console.log(`Server detected on port ${port}`);
              resolve(`http://localhost:${port}`);
            }
          } catch (e) {
            // Port not ready yet, this is expected
          }
        };

        // Check ports periodically with exponential backoff
        const checkInterval = setInterval(() => {
          checkAttempts++;
          if (checkAttempts > maxAttempts) {
            clearInterval(checkInterval);
            return;
          }

          checkPorts.forEach(checkPort);
          
          // Log progress every 5 attempts
          if (checkAttempts % 5 === 0) {
            console.log(`Waiting for dev server... (attempt ${checkAttempts}/${maxAttempts})`);
          }
        }, 2000);

        // Cleanup interval when promise resolves/rejects
        const originalResolve = resolve;
        const originalReject = reject;
        
        resolve = (value) => {
          clearInterval(checkInterval);
          originalResolve(value);
        };
        
        reject = (reason) => {
          clearInterval(checkInterval);
          originalReject(reason);
        };
      });

      return url;
    } catch (error) {
      console.error('Failed to start dev server:', error);
      throw new Error('Failed to start development server');
    }
  }

  async stopDevServer(): Promise<void> {
    if (this.devServerProcess) {
      try {
        this.devServerProcess.kill();
        this.devServerProcess = null;
        console.log('Dev server stopped');
      } catch (error) {
        console.error('Failed to stop dev server:', error);
      }
    }
  }

  async updateFile(path: string, content: string): Promise<void> {
    const webcontainer = this.getWebContainer();

    try {
      await webcontainer.fs.writeFile(path, content);
      console.log(`File updated: ${path}`);
    } catch (error) {
      console.error(`Failed to update file ${path}:`, error);
      throw new Error(`Failed to update file: ${path}`);
    }
  }

  cleanup(): void {
    if (this.devServerProcess) {
      this.devServerProcess.kill();
      this.devServerProcess = null;
    }
    // Don't cleanup the global WebContainer instance as it might be used by other components
  }

  private convertFilesToWebContainerFormat(files: FileContent): any {
    const webContainerFiles: any = {};

    Object.entries(files).forEach(([path, content]) => {
      const pathParts = path.split('/');
      let current = webContainerFiles;

      pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
          // This is a file - ensure content is properly stringified
          let fileContent: string;
          
          if (typeof content === 'string') {
            fileContent = content;
          } else if (typeof content === 'object' && content !== null) {
            // If it's an object (like package.json), stringify it properly
            fileContent = JSON.stringify(content, null, 2);
          } else {
            fileContent = String(content);
          }
          
          current[part] = {
            file: {
              contents: fileContent
            }
          };
        } else {
          // This is a directory
          if (!current[part]) {
            current[part] = {
              directory: {}
            };
          }
          current = current[part].directory;
        }
      });
    });

    return webContainerFiles;
  }
}