import { WebContainer } from '@webcontainer/api';
import { useEffect, useState } from 'react';

// Module-level state to persist across component remounts
let hasStartedInstall = false;
let cachedUrl = '';

// Export function to reset state (called when starting new project)
export function resetPreviewState() {
  hasStartedInstall = false;
  cachedUrl = '';
}

interface PreviewFrameProps {
  webContainer: WebContainer | undefined;
}

export function PreviewFrame({ webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState(cachedUrl);
  const [status, setStatus] = useState<'idle' | 'installing' | 'starting' | 'ready' | 'error'>(
    cachedUrl ? 'ready' : 'idle'
  );
  const [error, setError] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    // Clean up ANSI codes and only show meaningful lines
    const cleaned = msg.replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (cleaned && !cleaned.includes('press h') && !cleaned.includes('➜')) {
      setLogs(prev => [...prev.slice(-8), cleaned]); // Keep last 8 lines
    }
  };

  useEffect(() => {
    // If already have URL, we're done
    if (cachedUrl) {
      setUrl(cachedUrl);
      setStatus('ready');
      return;
    }
    
    if (!webContainer || hasStartedInstall) return;
    
    async function startDevServer() {
      hasStartedInstall = true;
      
      try {
        // Register server-ready listener BEFORE starting dev server
        webContainer!.on('server-ready', (port, serverUrl) => {
          console.log('Server ready on port', port, 'URL:', serverUrl);
          cachedUrl = serverUrl;
          setUrl(serverUrl);
          setStatus('ready');
        });

        setStatus('installing');
        addLog('Starting npm install...');
        
        const installProcess = await webContainer!.spawn('npm', ['install']);
        
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('[npm install]', data);
            addLog(data);
          }
        }));

        const installExitCode = await installProcess.exit;
        
        if (installExitCode !== 0) {
          throw new Error(`npm install failed with exit code ${installExitCode}`);
        }

        addLog('Starting dev server...');
        setStatus('starting');
        
        const devProcess = await webContainer!.spawn('npm', ['run', 'dev']);
        
        devProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('[dev server]', data);
            addLog(data);
          }
        }));

      } catch (err) {
        console.error('Error starting dev server:', err);
        setError(err instanceof Error ? err.message : 'Failed to start server');
        setStatus('error');
      }
    }

    startDevServer();
  }, [webContainer]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#0c0c12]">
      {status === 'idle' && (
        <div className="text-center text-gray-400">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-xs">Waiting for files...</p>
        </div>
      )}
      {(status === 'installing' || status === 'starting') && (
        <div className="text-center text-gray-400 w-full max-w-md px-4">
          <div className="text-3xl mb-2 animate-spin">
            {status === 'installing' ? '📦' : '🚀'}
          </div>
          <p className="text-xs font-medium">
            {status === 'installing' ? 'Installing dependencies...' : 'Starting dev server...'}
          </p>
          <p className="text-[10px] text-gray-500 mt-1 mb-3">
            {status === 'installing' ? 'This may take 30-60 seconds' : 'Bundling your app...'}
          </p>
          
          {/* Terminal output */}
          <div className="bg-[#0a0a0f] border border-[#1a1a24] rounded p-2 text-left max-h-32 overflow-y-auto">
            <div className="font-mono text-[9px] text-gray-500 space-y-0.5">
              {logs.length === 0 && <div className="animate-pulse">Initializing...</div>}
              {logs.map((log, i) => (
                <div key={i} className="truncate">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center text-red-400">
          <div className="text-3xl mb-2">❌</div>
          <p className="text-xs">Error: {error}</p>
        </div>
      )}
      {status === 'ready' && url && (
        <iframe 
          width="100%" 
          height="100%" 
          src={url} 
          className="border-0"
        />
      )}
    </div>
  );
}
