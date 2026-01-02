import { useState } from 'react';
import { DeployProgress } from '../services/deploy';
import { FileItem } from '../types';
import { useDeploy } from '../hooks/useDeploy';

interface DeployPanelProps {
  files: FileItem[];
  projectName: string;
  onClose: () => void;
}

const STORAGE_KEYS = {
  GITHUB_TOKEN: 'webai-github-token',
  VERCEL_TOKEN: 'webai-vercel-token',
};

export default function DeployPanel({ files, projectName, onClose }: DeployPanelProps) {
  const [githubToken, setGithubToken] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN) || ''
  );
  const [vercelToken, setVercelToken] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.VERCEL_TOKEN) || ''
  );
  const [repoName, setRepoName] = useState(
    projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').substring(0, 50)
  );
  const [saveTokens, setSaveTokens] = useState(true);

  const { isDeploying, progress, repoUrl, deployUrl, error, deploy, reset } = useDeploy({
    onSuccess: (repo, url) => {
      console.log('Deployed successfully:', repo, url);
    },
    onError: (err) => {
      console.error('Deploy failed:', err);
    },
  });

  const handleDeploy = async () => {
    if (!githubToken || !vercelToken || !repoName) return;

    // Save tokens if requested
    if (saveTokens) {
      localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, githubToken);
      localStorage.setItem(STORAGE_KEYS.VERCEL_TOKEN, vercelToken);
    }

    await deploy(files, {
      githubToken,
      vercelToken,
      projectName: repoName,
    });
  };

  const getStepIcon = (step: DeployProgress['step']) => {
    switch (step) {
      case 'init':
        return '🔑';
      case 'creating-repo':
        return '📁';
      case 'syncing':
        return '🔄';
      case 'deploying':
        return '🚀';
      case 'ready':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d0d14] border border-[#1a1a2a] rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a2a]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <h2 className="text-lg font-semibold text-white">Deploy to Production</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            disabled={isDeploying}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Display */}
          {progress && (
            <div className="bg-[#111118] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getStepIcon(progress.step)}</span>
                <span className="text-white font-medium">{progress.message}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-[#1a1a2a] rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    progress.step === 'error' 
                      ? 'bg-red-500' 
                      : progress.step === 'ready' 
                        ? 'bg-green-500' 
                        : 'bg-indigo-500'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              {/* URLs */}
              {(repoUrl || deployUrl) && (
                <div className="space-y-2 pt-2">
                  {repoUrl && (
                    <a 
                      href={repoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      <span className="truncate">{repoUrl}</span>
                    </a>
                  )}
                  {deployUrl && (
                    <a 
                      href={deployUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 22.525H0l12-21.05 12 21.05z"/>
                      </svg>
                      <span className="truncate">{deployUrl}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && !isDeploying && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
              
              {/* Special message for GitHub integration error */}
              {error.toLowerCase().includes('github integration') && (
                <div className="mt-3 p-3 bg-[#111118] rounded-lg">
                  <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ One-time setup required:</p>
                  <p className="text-gray-400 text-xs mb-2">
                    You need to connect your GitHub account to Vercel first.
                  </p>
                  <a
                    href="https://vercel.com/integrations/github"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Install GitHub Integration →
                  </a>
                  <p className="text-gray-500 text-xs mt-2">
                    After installing, come back and try deploying again.
                  </p>
                </div>
              )}
              
              <button 
                onClick={reset}
                className="mt-2 text-xs text-red-300 hover:text-white transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Form - Only show when not deploying and not complete */}
          {!isDeploying && progress?.step !== 'ready' && (
            <>
              {/* GitHub Token */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">
                  GitHub Personal Access Token
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo,delete_repo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-indigo-400 hover:text-indigo-300"
                  >
                    Get one →
                  </a>
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-[#111118] border border-[#1a1a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Vercel Token */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">
                  Vercel Access Token
                  <a 
                    href="https://vercel.com/account/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-indigo-400 hover:text-indigo-300"
                  >
                    Get one →
                  </a>
                </label>
                <input
                  type="password"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  placeholder="xxxxxxxxxx"
                  className="w-full bg-[#111118] border border-[#1a1a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Repository Name */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">Repository Name</label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="my-awesome-project"
                  className="w-full bg-[#111118] border border-[#1a1a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-gray-600">
                  This will create github.com/you/{repoName} and {repoName}.vercel.app
                </p>
              </div>

              {/* Save Tokens Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveTokens}
                  onChange={(e) => setSaveTokens(e.target.checked)}
                  className="rounded bg-[#111118] border-[#1a1a2a] text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-400">Save tokens for next time</span>
              </label>
            </>
          )}

          {/* Success State */}
          {progress?.step === 'ready' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {progress.message?.includes('in progress') ? 'Deployment Started!' : 'Deployment Complete!'}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {progress.message?.includes('in progress') 
                  ? 'Your app is being built. The URL will be ready in 1-2 minutes.' 
                  : 'Your app is live and ready to share'}
              </p>
              
              <div className="flex gap-2 justify-center">
                <a
                  href={deployUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
                >
                  {progress.message?.includes('in progress') ? 'Check Deployment' : 'Visit Site'}
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#111118] hover:bg-[#1a1a2a] text-white rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isDeploying && progress?.step !== 'ready' && (
          <div className="flex justify-end gap-2 p-4 border-t border-[#1a1a2a]">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#111118] hover:bg-[#1a1a2a] text-white rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeploy}
              disabled={!githubToken || !vercelToken || !repoName}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <span>🚀</span>
              Deploy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
