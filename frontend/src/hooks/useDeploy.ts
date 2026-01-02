import { useState, useCallback } from 'react';
import { DeployService, DeployProgress, DeployConfig } from '../services/deploy';
import { FileItem } from '../types';

export interface UseDeployOptions {
  onSuccess?: (repoUrl: string, deployUrl: string) => void;
  onError?: (error: Error) => void;
}

export interface DeployState {
  isDeploying: boolean;
  progress: DeployProgress | null;
  repoUrl: string | null;
  deployUrl: string | null;
  error: string | null;
}

export function useDeploy(options?: UseDeployOptions) {
  const [state, setState] = useState<DeployState>({
    isDeploying: false,
    progress: null,
    repoUrl: null,
    deployUrl: null,
    error: null,
  });

  const deploy = useCallback(async (
    files: FileItem[],
    config: DeployConfig
  ) => {
    setState({
      isDeploying: true,
      progress: { step: 'init', message: 'Starting deployment...', progress: 0 },
      repoUrl: null,
      deployUrl: null,
      error: null,
    });

    try {
      const deployService = new DeployService(config);
      
      const result = await deployService.deploy(files, (progress) => {
        setState(prev => ({
          ...prev,
          progress,
          repoUrl: progress.repoUrl || prev.repoUrl,
          deployUrl: progress.deployUrl || prev.deployUrl,
        }));
      });

      setState(prev => ({
        ...prev,
        isDeploying: false,
        repoUrl: result.repoUrl,
        deployUrl: result.deployUrl,
      }));

      options?.onSuccess?.(result.repoUrl, result.deployUrl);
      
      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isDeploying: false,
        error: error.message,
        progress: { step: 'error', message: error.message, progress: 0, error: error.message },
      }));
      
      options?.onError?.(error);
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      isDeploying: false,
      progress: null,
      repoUrl: null,
      deployUrl: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    deploy,
    reset,
  };
}
