import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import LightningFS from '@isomorphic-git/lightning-fs';
import { FileItem } from '../types';

// Initialize the filesystem
const fs = new LightningFS('webai-fs');
const pfs = fs.promises;

export interface GitConfig {
  name: string;
  email: string;
}

export interface GitCredentials {
  username: string;
  token: string;
}

export interface GitStatus {
  staged: string[];
  modified: string[];
  untracked: string[];
}

export class GitService {
  private dir: string;
  private credentials: GitCredentials | null = null;
  private config: GitConfig | null = null;

  constructor(projectName: string) {
    // Use project name as directory
    this.dir = `/${projectName.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
  }

  setCredentials(credentials: GitCredentials) {
    this.credentials = credentials;
  }

  setConfig(config: GitConfig) {
    this.config = config;
  }

  private onAuth = () => {
    if (!this.credentials) {
      throw new Error('Git credentials not set');
    }
    return {
      username: this.credentials.token, // Use token as username for HTTPS
      password: 'x-oauth-basic',
    };
  };

  // Initialize a new git repo
  async init(): Promise<void> {
    try {
      // Clean up existing directory
      await this.cleanup();
      
      // Create directory
      await pfs.mkdir(this.dir, { recursive: true } as any);
      
      // Initialize repo
      await git.init({ fs, dir: this.dir, defaultBranch: 'main' });
      
      console.log('Git repo initialized at', this.dir);
    } catch (error) {
      console.error('Failed to init git repo:', error);
      throw error;
    }
  }

  // Cleanup existing directory
  private async cleanup(): Promise<void> {
    try {
      await this.deleteRecursive(this.dir);
    } catch (e) {
      // Directory might not exist, ignore
    }
  }

  private async deleteRecursive(path: string): Promise<void> {
    try {
      const stat = await pfs.stat(path);
      if (stat.isDirectory()) {
        const entries = await pfs.readdir(path);
        for (const entry of entries) {
          await this.deleteRecursive(`${path}/${entry}`);
        }
        await pfs.rmdir(path);
      } else {
        await pfs.unlink(path);
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Safely create directory, ignoring if it already exists
  private async mkdirSafe(dirPath: string): Promise<void> {
    const parts = dirPath.split('/').filter(p => p.length > 0);
    let currentPath = '';
    
    for (const part of parts) {
      currentPath = `${currentPath}/${part}`;
      try {
        await pfs.mkdir(currentPath);
      } catch (e: any) {
        // Ignore EEXIST errors - directory already exists
        if (e.code !== 'EEXIST' && e.message !== 'EEXIST') {
          throw e;
        }
      }
    }
  }

  // Write files to the git filesystem
  async writeFiles(files: FileItem[]): Promise<void> {
    const writeFile = async (item: FileItem) => {
      const filePath = `${this.dir}${item.path}`;
      
      if (item.type === 'folder') {
        await this.mkdirSafe(filePath);
        if (item.children) {
          for (const child of item.children) {
            await writeFile(child);
          }
        }
      } else if (item.content !== undefined) {
        // Ensure parent directory exists
        const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
        if (parentDir) {
          await this.mkdirSafe(parentDir);
        }
        await pfs.writeFile(filePath, item.content, 'utf8');
      }
    };

    for (const file of files) {
      await writeFile(file);
    }
  }

  // Add all files to staging
  async addAll(): Promise<void> {
    await git.add({ fs, dir: this.dir, filepath: '.' });
  }

  // Add specific file
  async add(filepath: string): Promise<void> {
    const relativePath = filepath.startsWith('/') ? filepath.slice(1) : filepath;
    await git.add({ fs, dir: this.dir, filepath: relativePath });
  }

  // Commit changes
  async commit(message: string): Promise<string> {
    if (!this.config) {
      throw new Error('Git config not set');
    }

    const sha = await git.commit({
      fs,
      dir: this.dir,
      message,
      author: {
        name: this.config.name,
        email: this.config.email,
      },
    });

    console.log('Committed:', sha);
    return sha;
  }

  // Add remote
  async addRemote(name: string, url: string): Promise<void> {
    await git.addRemote({ fs, dir: this.dir, remote: name, url });
  }

  // Push to remote
  async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    if (!this.credentials) {
      throw new Error('Git credentials not set');
    }

    await git.push({
      fs,
      http,
      dir: this.dir,
      remote,
      ref: branch,
      onAuth: this.onAuth,
    });

    console.log('Pushed to', remote, branch);
  }

  // Full sync: add all, commit, and push
  async sync(message: string = 'Update from WebAI'): Promise<void> {
    await this.addAll();
    await this.commit(message);
    await this.push();
  }

  // Get current status
  async status(): Promise<GitStatus> {
    const matrix = await git.statusMatrix({ fs, dir: this.dir });
    
    const staged: string[] = [];
    const modified: string[] = [];
    const untracked: string[] = [];

    for (const [filepath, head, workdir, stage] of matrix) {
      if (head === 0 && workdir === 2 && stage === 0) {
        untracked.push(filepath);
      } else if (head === 1 && workdir === 2 && stage === 1) {
        modified.push(filepath);
      } else if (stage === 2 || stage === 3) {
        staged.push(filepath);
      }
    }

    return { staged, modified, untracked };
  }

  // Get log
  async log(depth: number = 10): Promise<Array<{ oid: string; message: string; author: string }>> {
    const commits = await git.log({ fs, dir: this.dir, depth });
    return commits.map(commit => ({
      oid: commit.oid,
      message: commit.commit.message,
      author: commit.commit.author.name,
    }));
  }

  getDir(): string {
    return this.dir;
  }
}

// Factory function
export function createGitService(projectName: string): GitService {
  return new GitService(projectName);
}
