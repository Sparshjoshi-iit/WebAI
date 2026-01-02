export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  framework: string | null;
}

export interface VercelDeployment {
  id: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  readyState: string;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  alias?: string[];
}

export interface DeploymentStatus {
  state: VercelDeployment['state'];
  url?: string;
  error?: string;
}

export class VercelService {
  private token: string;
  private baseUrl = 'https://api.vercel.com';

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Get current user
  async getUser(): Promise<{ username: string; email: string; name: string }> {
    const data = await this.fetch<{ user: { username: string; email: string; name: string } }>('/v2/user');
    return data.user;
  }

  // Create a new project (without GitHub linking)
  async createProject(options: {
    name: string;
    framework?: string;
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
  }): Promise<VercelProject> {
    const data = await this.fetch<VercelProject>('/v10/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        framework: options.framework || 'vite',
        buildCommand: options.buildCommand,
        outputDirectory: options.outputDirectory,
        installCommand: options.installCommand,
      }),
    });

    return data;
  }

  // Deploy files directly to Vercel (no GitHub required)
  async deployFiles(
    projectName: string,
    files: Array<{ file: string; data: string }>,
  ): Promise<VercelDeployment> {
    // Step 1: Create file uploads
    const uploadedFiles: Array<{ file: string; sha: string; size: number }> = [];

    for (const { file, data } of files) {
      // Calculate SHA1 hash of the file content
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Upload the file
      await fetch('https://api.vercel.com/v2/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/octet-stream',
          'x-vercel-digest': sha,
        },
        body: data,
      });

      uploadedFiles.push({
        file,
        sha,
        size: dataBuffer.length,
      });
    }

    // Step 2: Create the deployment with the uploaded files
    const deployment = await this.fetch<VercelDeployment>('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify({
        name: projectName,
        files: uploadedFiles,
        projectSettings: {
          framework: 'vite',
        },
        target: 'production',
      }),
    });

    return deployment;
  }

  // Get project by name
  async getProject(name: string): Promise<VercelProject | null> {
    try {
      return await this.fetch<VercelProject>(`/v9/projects/${name}`);
    } catch (error: any) {
      // Handle various "not found" error messages from Vercel API
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('404') || msg.includes('not found') || msg.includes('not_found')) {
        return null;
      }
      throw error;
    }
  }

  // Delete a project
  async deleteProject(projectId: string): Promise<void> {
    await this.fetch(`/v9/projects/${projectId}`, { method: 'DELETE' });
  }

  // Trigger a deployment from GitHub
  async createDeployment(options: {
    name: string; // project name
    gitSource: {
      type: 'github';
      ref: string; // branch name
      repoId: string | number;
    };
  }): Promise<VercelDeployment> {
    const data = await this.fetch<VercelDeployment>('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        gitSource: options.gitSource,
        target: 'production',
      }),
    });

    return data;
  }

  // Get deployment status
  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.fetch<VercelDeployment>(`/v13/deployments/${deploymentId}`);
  }

  // Get latest deployment for a project
  async getLatestDeployment(projectName: string): Promise<VercelDeployment | null> {
    const data = await this.fetch<{ deployments: VercelDeployment[] }>(
      `/v6/deployments?projectId=${projectName}&limit=1&target=production`
    );
    return data.deployments[0] || null;
  }

  // Poll deployment until ready or failed
  async waitForDeployment(
    deploymentId: string, 
    onStatusChange?: (status: DeploymentStatus) => void,
    maxWaitMs: number = 120000 // 2 minutes - after this, return "still building" instead of error
  ): Promise<DeploymentStatus> {
    const startTime = Date.now();
    let lastDeployment: VercelDeployment | null = null;
    
    while (Date.now() - startTime < maxWaitMs) {
      const deployment = await this.getDeployment(deploymentId);
      lastDeployment = deployment;
      
      // URL is available once deployment starts, even while building
      const deployUrl = deployment.url ? `https://${deployment.url}` : undefined;
      
      const status: DeploymentStatus = {
        state: deployment.state,
        url: deployUrl,
      };

      onStatusChange?.(status);

      if (deployment.state === 'READY') {
        return status;
      }

      if (deployment.state === 'ERROR' || deployment.state === 'CANCELED') {
        return { ...status, error: `Deployment ${deployment.state.toLowerCase()}` };
      }

      // Wait 3 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Timeout - but deployment might still be building
    // Return success with the URL (deployment will complete in background)
    if (lastDeployment?.url) {
      return { 
        state: 'BUILDING' as any, 
        url: `https://${lastDeployment.url}`,
      };
    }

    return { state: 'ERROR', error: 'Deployment timed out' };
  }

  // List all projects
  async listProjects(): Promise<VercelProject[]> {
    const data = await this.fetch<{ projects: VercelProject[] }>('/v9/projects');
    return data.projects;
  }
}

// Singleton management
let vercelService: VercelService | null = null;

export function initVercel(token: string): VercelService {
  vercelService = new VercelService(token);
  return vercelService;
}

export function getVercel(): VercelService | null {
  return vercelService;
}

export function clearVercel(): void {
  vercelService = null;
}
