import { GitHubService, initGitHub, RepoInfo } from './github';
import { createGitService, GitService } from './git';
import { VercelService, initVercel, DeploymentStatus } from './vercel';
import { FileItem } from '../types';

// Valid lucide-react icon names (common ones)
const VALID_LUCIDE_ICONS = new Set([
  'Menu', 'X', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Search', 'Plus', 'Minus', 
  'Edit', 'Trash2', 'Save', 'Download', 'Upload', 'Share', 'Copy', 'Check',
  'FileText', 'File', 'Folder', 'Image', 'Video', 'Music', 'BookOpen', 'Notebook', 'StickyNote',
  'ListTodo', 'CheckCircle', 'Circle', 'Square', 'CheckSquare', 'Clock', 'Calendar', 'Bell',
  'Github', 'Twitter', 'Facebook', 'Instagram', 'Linkedin', 'Youtube', 'Mail', 'MessageCircle', 'MessageSquare',
  'User', 'Users', 'UserPlus', 'Settings', 'LogIn', 'LogOut', 'Heart', 'Star', 'ThumbsUp',
  'Code', 'Terminal', 'Database', 'Server', 'Wifi', 'Smartphone', 'Monitor', 'Laptop',
  'Home', 'ShoppingCart', 'CreditCard', 'DollarSign', 'MapPin', 'Phone', 'Camera', 'Sun', 'Moon', 'Zap', 'Sparkles',
  'Play', 'Pause', 'SkipBack', 'SkipForward', 'Volume2', 'VolumeX', 'Maximize', 'Minimize',
  'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key', 'Shield', 'AlertCircle', 'AlertTriangle', 'Info',
  'ExternalLink', 'Link', 'Paperclip', 'Bookmark', 'Tag', 'Hash', 'AtSign', 'Globe',
  'Trash', 'Edit2', 'Edit3', 'Pen', 'PenTool', 'Scissors', 'Clipboard', 'ClipboardCheck',
  'MoreHorizontal', 'MoreVertical', 'Grid', 'List', 'Layers', 'Layout', 'Sidebar',
  'Send', 'Inbox', 'Archive', 'Package', 'Gift', 'Award', 'Trophy', 'Target', 'Activity',
  'TrendingUp', 'TrendingDown', 'BarChart', 'PieChart', 'LineChart',
  'Cpu', 'HardDrive', 'Cloud', 'CloudOff', 'RefreshCw', 'RotateCw', 'RotateCcw',
  'ZoomIn', 'ZoomOut', 'Move', 'Crosshair', 'Navigation', 'Compass', 'Map',
  'Coffee', 'Briefcase', 'Building', 'Building2', 'Car', 'Plane', 'Train', 'Bike',
  'Shirt', 'Watch', 'Glasses', 'Headphones', 'Mic', 'MicOff', 'Speaker',
  'Bold', 'Italic', 'Underline', 'Strikethrough', 'AlignLeft', 'AlignCenter', 'AlignRight',
  'Type', 'Heading1', 'Heading2', 'Heading3', 'Quote', 'Code2',
]);

// Fix common issues in generated code
function fixCodeIssues(content: string, filePath: string): { content: string; fixed: boolean; issues: string[] } {
  const issues: string[] = [];
  let fixed = false;
  let fixedContent = content;

  // Only check tsx/jsx files
  if (!filePath.match(/\.(tsx|jsx)$/)) {
    return { content, fixed: false, issues: [] };
  }

  // Fix invalid lucide-react imports
  const lucideImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
  const match = lucideImportRegex.exec(fixedContent);
  
  if (match) {
    const imports = match[1].split(',').map(s => s.trim());
    const invalidIcons: string[] = [];
    const iconReplacements: Record<string, string> = {
      // Common AI mistakes -> correct icons
      'NoteIcon': 'StickyNote',
      'TodoIcon': 'ListTodo', 
      'ArticleIcon': 'FileText',
      'HomeIcon': 'Home',
      'UserIcon': 'User',
      'SearchIcon': 'Search',
      'SettingsIcon': 'Settings',
      'MenuIcon': 'Menu',
      'CloseIcon': 'X',
      'AddIcon': 'Plus',
      'DeleteIcon': 'Trash2',
      'EditIcon': 'Edit',
      'SaveIcon': 'Save',
      'ShareIcon': 'Share',
      'DownloadIcon': 'Download',
      'UploadIcon': 'Upload',
      'CheckIcon': 'Check',
      'StarIcon': 'Star',
      'HeartIcon': 'Heart',
      'MailIcon': 'Mail',
      'PhoneIcon': 'Phone',
      'CalendarIcon': 'Calendar',
      'ClockIcon': 'Clock',
      'BellIcon': 'Bell',
      'CameraIcon': 'Camera',
      'ImageIcon': 'Image',
      'VideoIcon': 'Video',
      'MusicIcon': 'Music',
      'PlayIcon': 'Play',
      'PauseIcon': 'Pause',
      'SunIcon': 'Sun',
      'MoonIcon': 'Moon',
      'GlobeIcon': 'Globe',
      'LinkIcon': 'Link',
      'CodeIcon': 'Code',
      'TerminalIcon': 'Terminal',
      'DatabaseIcon': 'Database',
      'ServerIcon': 'Server',
      'FolderIcon': 'Folder',
      'FileIcon': 'File',
      'CopyIcon': 'Copy',
      'TrashIcon': 'Trash2',
      'ArrowRightIcon': 'ArrowRight',
      'ArrowLeftIcon': 'ArrowLeft',
      'ChevronRightIcon': 'ChevronRight',
      'ChevronLeftIcon': 'ChevronLeft',
      'ChevronDownIcon': 'ChevronDown',
      'ChevronUpIcon': 'ChevronUp',
    };

    for (const icon of imports) {
      const cleanIcon = icon.replace(/\s+as\s+\w+/, '').trim();
      if (!VALID_LUCIDE_ICONS.has(cleanIcon)) {
        invalidIcons.push(cleanIcon);
        // Try to fix it
        if (iconReplacements[cleanIcon]) {
          fixedContent = fixedContent.replace(
            new RegExp(`\\b${cleanIcon}\\b`, 'g'), 
            iconReplacements[cleanIcon]
          );
          fixed = true;
          issues.push(`Replaced invalid icon "${cleanIcon}" with "${iconReplacements[cleanIcon]}"`);
        }
      }
    }

    if (invalidIcons.length > 0 && !fixed) {
      issues.push(`Warning: Invalid lucide-react icons found: ${invalidIcons.join(', ')}`);
    }
  }

  return { content: fixedContent, fixed, issues };
}

// Validate and fix files before deployment
function validateAndFixFiles(files: FileItem[]): { files: FileItem[]; issues: string[] } {
  const allIssues: string[] = [];
  
  const processFile = (item: FileItem): FileItem => {
    if (item.type === 'file' && item.content) {
      const { content, issues } = fixCodeIssues(item.content, item.path);
      allIssues.push(...issues);
      return { ...item, content };
    } else if (item.type === 'folder' && item.children) {
      return { ...item, children: item.children.map(processFile) };
    }
    return item;
  };

  const fixedFiles = files.map(processFile);
  return { files: fixedFiles, issues: allIssues };
}

export interface DeployConfig {
  githubToken: string;
  vercelToken: string;
  projectName: string;
}

export interface DeployProgress {
  step: 'init' | 'creating-repo' | 'syncing' | 'deploying' | 'ready' | 'error';
  message: string;
  progress: number; // 0-100
  repoUrl?: string;
  deployUrl?: string;
  error?: string;
}

export type DeployProgressCallback = (progress: DeployProgress) => void;

export class DeployService {
  private github: GitHubService;
  private vercel: VercelService;
  private git: GitService;
  private projectName: string;

  constructor(config: DeployConfig) {
    this.github = initGitHub(config.githubToken);
    this.vercel = initVercel(config.vercelToken);
    this.git = createGitService(config.projectName);
    this.projectName = config.projectName;
  }

  async deploy(
    files: FileItem[],
    onProgress: DeployProgressCallback
  ): Promise<{ repoUrl: string; deployUrl: string }> {
    let repoInfo: RepoInfo | null = null;

    // Validate and fix files before deployment
    onProgress({
      step: 'init',
      message: 'Validating code...',
      progress: 2,
    });

    const { files: fixedFiles, issues } = validateAndFixFiles(files);
    if (issues.length > 0) {
      console.log('Code fixes applied:', issues);
    }

    try {
      // Step 1: Initialize
      onProgress({
        step: 'init',
        message: 'Authenticating with GitHub and Vercel...',
        progress: 5,
      });

      // Verify both tokens work
      const [ghUser, vercelUser] = await Promise.all([
        this.github.getAuthenticatedUser(),
        this.vercel.getUser(),
      ]);

      console.log('Authenticated as GitHub:', ghUser.login, 'Vercel:', vercelUser.username);

      // Step 2: Create GitHub repo
      onProgress({
        step: 'creating-repo',
        message: `Creating repository ${this.projectName}...`,
        progress: 15,
      });

      // Check if repo already exists
      let isNewRepo = false;
      const repoExists = await this.github.repoExists(ghUser.login, this.projectName);
      if (repoExists) {
        // Use existing repo
        repoInfo = {
          owner: ghUser.login,
          repo: this.projectName,
          fullName: `${ghUser.login}/${this.projectName}`,
          htmlUrl: `https://github.com/${ghUser.login}/${this.projectName}`,
          cloneUrl: `https://github.com/${ghUser.login}/${this.projectName}.git`,
          sshUrl: `git@github.com:${ghUser.login}/${this.projectName}.git`,
        };
        console.log('Using existing repo:', repoInfo.fullName);
      } else {
        repoInfo = await this.github.createRepo(this.projectName, {
          description: `Created with WebAI`,
          isPrivate: false,
        });
        isNewRepo = true;
        console.log('Created repo:', repoInfo.fullName);
      }

      onProgress({
        step: 'creating-repo',
        message: `Repository created: ${repoInfo.fullName}`,
        progress: 25,
        repoUrl: repoInfo.htmlUrl,
      });

      // Step 3: Sync files to GitHub using isomorphic-git
      onProgress({
        step: 'syncing',
        message: 'Initializing git repository...',
        progress: 35,
      });

      // Initialize local git repo
      await this.git.init();

      // Set git config
      this.git.setConfig({
        name: ghUser.login,
        email: `${ghUser.login}@users.noreply.github.com`,
      });

      // Set credentials for push
      this.git.setCredentials({
        username: ghUser.login,
        token: (this.github as any).octokit.auth, // Access the token
      });

      onProgress({
        step: 'syncing',
        message: 'Writing files to git...',
        progress: 45,
      });

      // Write files to the git filesystem
      await this.git.writeFiles(fixedFiles);

      onProgress({
        step: 'syncing',
        message: 'Staging changes...',
        progress: 55,
      });

      // Add remote
      await this.git.addRemote('origin', repoInfo.cloneUrl);

      // Stage all files
      await this.git.addAll();

      onProgress({
        step: 'syncing',
        message: 'Committing changes...',
        progress: 65,
      });

      onProgress({
        step: 'syncing',
        message: 'Pushing to GitHub...',
        progress: 75,
      });

      // Push to GitHub using GitHub Contents API
      // (isomorphic-git push fails in browsers due to CORS)
      await this.github.pushAllFiles(
        repoInfo.owner,
        repoInfo.repo,
        fixedFiles,
        'Initial commit from WebAI',
        isNewRepo
      );

      onProgress({
        step: 'syncing',
        message: 'Files synced to GitHub!',
        progress: 80,
        repoUrl: repoInfo.htmlUrl,
      });

      // Step 4: Create Vercel project and deploy
      onProgress({
        step: 'deploying',
        message: 'Deploying to Vercel...',
        progress: 85,
      });

      // Flatten files for Vercel deployment
      const flattenFilesForVercel = (items: FileItem[]): Array<{ file: string; data: string }> => {
        const result: Array<{ file: string; data: string }> = [];
        for (const item of items) {
          if (item.type === 'file' && item.content !== undefined) {
            const filePath = item.path.startsWith('/') ? item.path.slice(1) : item.path;
            result.push({ file: filePath, data: item.content });
          } else if (item.type === 'folder' && item.children) {
            result.push(...flattenFilesForVercel(item.children));
          }
        }
        return result;
      };

      const vercelFiles = flattenFilesForVercel(fixedFiles);
      console.log('Deploying', vercelFiles.length, 'files to Vercel');

      onProgress({
        step: 'deploying',
        message: `Uploading ${vercelFiles.length} files to Vercel...`,
        progress: 88,
      });

      // Deploy directly to Vercel (no GitHub integration required)
      const deployment = await this.vercel.deployFiles(this.projectName, vercelFiles);
      console.log('Deployment started:', deployment.id);

      onProgress({
        step: 'deploying',
        message: 'Building on Vercel...',
        progress: 92,
      });

      // Wait for deployment to complete
      const finalStatus = await this.vercel.waitForDeployment(
        deployment.id,
        (status: DeploymentStatus) => {
          onProgress({
            step: 'deploying',
            message: `Deployment status: ${status.state}`,
            progress: 94,
            repoUrl: repoInfo!.htmlUrl,
            deployUrl: status.url,
          });
        }
      );

      if (finalStatus.error && !finalStatus.url) {
        // Only throw if there's an error AND no URL
        throw new Error(finalStatus.error);
      }

      // Handle "still building" state - deployment is proceeding, we just didn't wait
      const isStillBuilding = finalStatus.state === 'BUILDING' || finalStatus.state === 'QUEUED';
      
      onProgress({
        step: 'ready',
        message: isStillBuilding ? 'Deployed! Build in progress on Vercel...' : 'Deployment complete!',
        progress: 100,
        repoUrl: repoInfo.htmlUrl,
        deployUrl: finalStatus.url,
      });

      return {
        repoUrl: repoInfo.htmlUrl,
        deployUrl: finalStatus.url || `https://${this.projectName}.vercel.app`,
      };

    } catch (error: any) {
      console.error('Deploy error:', error);
      onProgress({
        step: 'error',
        message: error.message || 'Deployment failed',
        progress: 0,
        error: error.message,
        repoUrl: repoInfo?.htmlUrl,
      });
      throw error;
    }
  }

  // Quick sync without full deployment (just push to existing repo)
  async syncToGitHub(
    files: FileItem[],
    message: string = 'Update from WebAI',
    onProgress: DeployProgressCallback
  ): Promise<void> {
    try {
      onProgress({
        step: 'syncing',
        message: 'Writing files...',
        progress: 20,
      });

      await this.git.writeFiles(files);

      onProgress({
        step: 'syncing',
        message: 'Staging changes...',
        progress: 40,
      });

      await this.git.addAll();

      onProgress({
        step: 'syncing',
        message: 'Committing...',
        progress: 60,
      });

      await this.git.commit(message);

      onProgress({
        step: 'syncing',
        message: 'Pushing...',
        progress: 80,
      });

      await this.git.push();

      onProgress({
        step: 'ready',
        message: 'Synced!',
        progress: 100,
      });
    } catch (error: any) {
      onProgress({
        step: 'error',
        message: error.message,
        progress: 0,
        error: error.message,
      });
      throw error;
    }
  }
}
