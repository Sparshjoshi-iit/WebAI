import { Octokit } from '@octokit/rest';
import { FileItem } from '../types';

export interface GitHubConfig {
  token: string;
  username?: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
}

export class GitHubService {
  private octokit: Octokit;
  private username: string | null = null;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getAuthenticatedUser(): Promise<{ login: string; name: string | null; avatar_url: string }> {
    const { data } = await this.octokit.users.getAuthenticated();
    this.username = data.login;
    return {
      login: data.login,
      name: data.name,
      avatar_url: data.avatar_url,
    };
  }

  async createRepo(name: string, options?: { 
    description?: string; 
    isPrivate?: boolean;
    autoInit?: boolean;
  }): Promise<RepoInfo> {
    // Sanitize repo name
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);

    const { data } = await this.octokit.repos.createForAuthenticatedUser({
      name: sanitizedName,
      description: options?.description || 'Created with WebAI',
      private: options?.isPrivate ?? false,
      auto_init: options?.autoInit ?? false, // Don't auto-init, we'll push our own files
    });

    return {
      owner: data.owner.login,
      repo: data.name,
      fullName: data.full_name,
      htmlUrl: data.html_url,
      cloneUrl: data.clone_url,
      sshUrl: data.ssh_url,
    };
  }

  async repoExists(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({ owner, repo });
      return true;
    } catch (error: any) {
      if (error.status === 404) return false;
      throw error;
    }
  }

  async deleteRepo(owner: string, repo: string): Promise<void> {
    await this.octokit.repos.delete({ owner, repo });
  }

  // Create or update a single file in the repo
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<void> {
    const contentEncoded = btoa(unescape(encodeURIComponent(content)));
    
    await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: contentEncoded,
      sha,
    });
  }

  // Get file SHA (needed for updates)
  async getFileSha(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(data) && data.type === 'file') {
        return data.sha;
      }
      return null;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  // Push all files to the repo using the Contents API
  // This is simpler than using Git directly for initial pushes
  async pushAllFiles(
    owner: string, 
    repo: string, 
    files: FileItem[], 
    message: string = 'Update from WebAI',
    isNewRepo: boolean = false
  ): Promise<void> {
    const flatFiles = this.flattenFiles(files);
    
    for (const file of flatFiles) {
      if (file.content !== undefined) {
        const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;
        // Skip SHA lookup for new repos - files definitely don't exist yet
        const sha = isNewRepo ? null : await this.getFileSha(owner, repo, path);
        await this.createOrUpdateFile(owner, repo, path, file.content, message, sha || undefined);
      }
    }
  }

  // Flatten nested FileItem structure to a list of files with paths
  private flattenFiles(items: FileItem[]): FileItem[] {
    const result: FileItem[] = [];
    
    for (const item of items) {
      if (item.type === 'file') {
        result.push(item);
      } else if (item.type === 'folder' && item.children) {
        result.push(...this.flattenFiles(item.children));
      }
    }
    
    return result;
  }

  getUsername(): string | null {
    return this.username;
  }
}

// Singleton for managing GitHub connection
let githubService: GitHubService | null = null;

export function initGitHub(token: string): GitHubService {
  githubService = new GitHubService(token);
  return githubService;
}

export function getGitHub(): GitHubService | null {
  return githubService;
}

export function clearGitHub(): void {
  githubService = null;
}
