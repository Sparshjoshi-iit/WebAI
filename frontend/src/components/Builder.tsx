import { useState, useEffect, useRef } from 'react';
import ChatPanel from './chatPanel';
import FileExplorer from './fileExplorer';
import CodeEditor from './codeEditor';
import { PreviewFrame } from './PreviewFrame';
import StepsPanel from './StepsPanel';
import DeployPanel from './DeployPanel';
import { Message, FileItem, Step, StepType } from '../types';
import { parseXml } from '../steps';
import { BACKEND_URL } from '../config';
import { useWebContainer } from '../hooks/useWebContainer';
import { FileSystemTree } from '@webcontainer/api';

interface BuilderProps {
  initialPrompt: string;
  onBackToHome: () => void;
}

const STORAGE_KEY = 'webai-project';

// Load saved state from localStorage
function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load saved state:', e);
  }
  return null;
}

export default function Builder({ initialPrompt, onBackToHome }: BuilderProps) {
  const savedState = loadSavedState();
  const [messages, setMessages] = useState<Message[]>(savedState?.messages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>(savedState?.files || []);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [steps, setSteps] = useState<Step[]>(savedState?.steps?.map((s: Step) => ({ ...s, status: 'completed' })) || []);
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string}[]>(savedState?.llmMessages || []);
  const [templateSet, setTemplateSet] = useState(savedState?.templateSet || false);
  const [showDeployPanel, setShowDeployPanel] = useState(false);
  const hasInitialized = useRef(savedState ? true : false); // Skip init if we have saved state
  const webContainer = useWebContainer();

  // Convert FileItem[] to WebContainer FileSystemTree
  const createMountStructure = (files: FileItem[]): FileSystemTree => {
    const mountStructure: FileSystemTree = {};

    const processFile = (file: FileItem, isRootFolder: boolean): void => {
      if (file.type === 'folder') {
        // For folders, recursively process children
        if (isRootFolder) {
          // Root level folders
          mountStructure[file.name] = {
            directory: file.children 
              ? Object.fromEntries(
                  file.children.map(child => {
                    const processChild = (f: FileItem): any => {
                      if (f.type === 'folder') {
                        return {
                          directory: f.children 
                            ? Object.fromEntries(f.children.map(c => [c.name, processChild(c)]))
                            : {}
                        };
                      }
                      return { file: { contents: f.content || '' } };
                    };
                    return [child.name, processChild(child)];
                  })
                )
              : {}
          };
        }
      } else {
        // For files at root level
        if (isRootFolder) {
          mountStructure[file.name] = {
            file: {
              contents: file.content || ''
            }
          };
        }
      }
    };

    files.forEach(file => processFile(file, true));
    return mountStructure;
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (files.length > 0 || messages.length > 0) {
      const stateToSave = {
        files,
        messages,
        steps,
        llmMessages,
        templateSet,
        prompt: initialPrompt
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [files, messages, steps, llmMessages, templateSet, initialPrompt]);

  // Track the last mounted files hash to avoid unnecessary re-mounts
  const [lastMountedHash, setLastMountedHash] = useState<string>("");

  // Mount files to WebContainer when files change and all steps are completed
  useEffect(() => {
    const allStepsCompleted = steps.length > 0 && steps.every(s => s.status === 'completed');
    
    if (webContainer && files.length > 0 && allStepsCompleted) {
      const mountStructure = createMountStructure(files);
      const currentHash = JSON.stringify(mountStructure);
      
      // Only mount if files have actually changed
      if (currentHash !== lastMountedHash) {
        console.log('Mounting files to WebContainer:', Object.keys(mountStructure));
        webContainer.mount(mountStructure).then(() => {
          console.log('Files mounted successfully');
          setLastMountedHash(currentHash);
        });
      }
    }
  }, [webContainer, files, steps, lastMountedHash]);

  // Effect to process pending steps and build file structure
  // This follows the reference flow: watch steps, process pending ones, update files
  useEffect(() => {
    const pendingSteps = steps.filter(({ status }) => status === "pending");
    if (pendingSteps.length === 0) return;

    // Deep clone files to avoid mutation issues
    const cloneFiles = (items: FileItem[]): FileItem[] => {
      return items.map(item => ({
        ...item,
        children: item.children ? cloneFiles(item.children) : undefined
      }));
    };

    let newFiles = cloneFiles(files);

    pendingSteps.forEach(step => {
      if (step?.type === StepType.CreateFile && step.path) {
        // Remove leading slash if present and filter empty parts
        const pathParts = step.path.split("/").filter(x => x.length > 0);
        
        // Navigate/create the folder structure and add/update the file
        let currentLevel = newFiles;
        let currentPath = "";

        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          currentPath = `${currentPath}/${part}`;
          const isLastPart = i === pathParts.length - 1;

          if (isLastPart) {
            // This is the file - find or create it
            const existingFileIndex = currentLevel.findIndex(x => x.path === currentPath);
            if (existingFileIndex !== -1) {
              // Update existing file content
              console.log('Updating file:', currentPath);
              currentLevel[existingFileIndex] = {
                ...currentLevel[existingFileIndex],
                content: step.code
              };
            } else {
              // Create new file
              console.log('Creating file:', currentPath);
              currentLevel.push({
                name: part,
                type: 'file',
                path: currentPath,
                content: step.code
              });
            }
          } else {
            // This is a folder - find or create it
            let folder = currentLevel.find(x => x.path === currentPath && x.type === 'folder');
            if (!folder) {
              // Create the folder
              console.log('Creating folder:', currentPath);
              folder = {
                name: part,
                type: 'folder',
                path: currentPath,
                children: [],
                isOpen: true
              };
              currentLevel.push(folder);
            }
            // Navigate into folder's children
            if (!folder.children) {
              folder.children = [];
            }
            currentLevel = folder.children;
          }
        }
      }
    });

    console.log('Files after processing pending steps:', newFiles.length, 'files at root');
    setFiles(newFiles);
    
    // Mark all pending steps as completed
    setSteps(prevSteps => prevSteps.map((s: Step) => ({
      ...s,
      status: "completed" as const
    })));
  }, [steps]);

  // Auto-select first file when files change
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      const findFirstFile = (items: FileItem[]): FileItem | null => {
        for (const item of items) {
          if (item.type === 'file') return item;
          if (item.children) {
            const found = findFirstFile(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      const firstFile = findFirstFile(files);
      if (firstFile) setSelectedFile(firstFile);
    }
  }, [files, selectedFile]);

  // Initialize project - follows reference flow
  async function init() {
    setIsLoading(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: initialPrompt,
    };
    setMessages([userMessage]);

    try {
      // Step 1: Get template type (react/node) and initial prompts
      const templateResponse = await fetch(`${BACKEND_URL}/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: initialPrompt.trim() }),
      });

      if (!templateResponse.ok) {
        throw new Error('Failed to get template');
      }

      const { prompts, uiPrompts } = await templateResponse.json();
      setTemplateSet(true);

      // Parse uiPrompts to get initial file structure steps (BEFORE calling /chat)
      // This gives the user immediate feedback with the base template
      if (uiPrompts && uiPrompts[0]) {
        const initialSteps = parseXml(uiPrompts[0]).map((step: Step) => ({
          ...step,
          status: "pending" as const
        }));
        setSteps(initialSteps);
      }

      // Add assistant message about setting up
      const setupMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '🔍 Setting up your project template...',
      };
      setMessages(prev => [...prev, setupMessage]);

      // Step 2: Call chat with prompts + user prompt
      const chatMessages = [...prompts, initialPrompt].map(content => ({
        role: "user" as const,
        content,
      }));

      const chatResponse = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to generate code');
      }

      const { response } = await chatResponse.json();
      
      console.log('AI Response:', response);
      console.log('Response length:', response?.length);

      // Parse AI response to get additional steps
      const newSteps = parseXml(response).map((step: Step) => ({
        ...step,
        status: "pending" as const
      }));
      
      console.log('Parsed new steps:', newSteps.length, newSteps.map(s => s.title));

      // Add new steps to existing ones
      setSteps(prev => [...prev, ...newSteps]);

      // Update LLM message history for context
      setLlmMessages([
        ...chatMessages,
        { role: "assistant" as const, content: response }
      ]);

      // Update UI with assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: response || 'Project created! Check the files on the left.',
      };
      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to connect to backend'}. Make sure the backend is running on port 3001.`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle follow-up messages - maintains full conversation context
  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Add new user message to LLM history
      const newLlmMessage = { role: "user" as const, content };
      const updatedLlmMessages = [...llmMessages, newLlmMessage];

      const chatResponse = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedLlmMessages }),
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to get response');
      }

      const { response } = await chatResponse.json();

      // Update LLM message history
      setLlmMessages([
        ...updatedLlmMessages,
        { role: "assistant" as const, content: response }
      ]);

      // Parse response for new steps
      const newSteps = parseXml(response).map((step: Step) => ({
        ...step,
        status: "pending" as const
      }));

      // Add new steps (they will be processed by the useEffect)
      if (newSteps.length > 0) {
        setSteps(prev => [...prev, ...newSteps]);
      }

      // Add assistant message to UI
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'Done! Check the updated files.',
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to connect'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear saved state and go home
  const handleBackToHome = () => {
    localStorage.removeItem(STORAGE_KEY);
    onBackToHome();
  };

  // Initialize on mount
  useEffect(() => {
    if (initialPrompt && !hasInitialized.current) {
      hasInitialized.current = true;
      init();
    }
  }, [initialPrompt]);

  return (
    <div className="h-screen flex flex-col bg-[#08080c]">
      {/* Header */}
      <header className="h-11 bg-[#0d0d14] border-b border-[#1a1a2a] flex items-center px-4">
        <button
          onClick={handleBackToHome}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors mr-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
            <span className="text-white text-xs">⚡</span>
          </div>
          <h1 className="text-sm font-medium text-white">WebAI</h1>
        </div>
        <div className="ml-4 text-xs text-gray-500 truncate max-w-md">
          {initialPrompt}
        </div>
        <div className="ml-auto flex gap-1.5">
          {!templateSet && (
            <span className="text-xs text-yellow-500 animate-pulse mr-2">Setting up...</span>
          )}
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
            className="px-3 py-1 rounded text-xs bg-[#111118] text-gray-400 hover:text-white hover:bg-red-600/20 transition-colors"
            title="Clear project and start fresh"
          >
            New
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#111118] text-gray-400 hover:text-white'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#111118] text-gray-400 hover:text-white'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setShowDeployPanel(true)}
            disabled={files.length === 0 || isLoading}
            className="px-3 py-1 rounded text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Deploy to GitHub + Vercel"
          >
            <span>🚀</span>
            Deploy
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[320px] border-r border-[#1a1a2a] flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
            />
          </div>
          {/* Steps Panel */}
          {steps.length > 0 && (
            <div className="h-[200px] border-t border-[#1a1a2a]">
              <StepsPanel steps={steps} />
            </div>
          )}
        </div>

        {/* File Explorer */}
        {files.length > 0 && (
          <div className="w-[180px] border-r border-[#1a1a2a] bg-[#0a0a10]">
            <FileExplorer
              files={files}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onToggleFolder={(path) => {
                const toggleFolder = (items: FileItem[]): FileItem[] => {
                  return items.map(item => {
                    if (item.path === path && item.type === 'folder') {
                      return { ...item, isOpen: !item.isOpen };
                    }
                    if (item.children) {
                      return { ...item, children: toggleFolder(item.children) };
                    }
                    return item;
                  });
                };
                setFiles(toggleFolder(files));
              }}
            />
          </div>
        )}

        {/* Code Editor / Preview */}
        <div className="flex-1 bg-[#0a0a10]">
          {activeTab === 'code' ? (
            <CodeEditor file={selectedFile} />
          ) : (
            lastMountedHash ? (
              <PreviewFrame webContainer={webContainer} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                {steps.length > 0 ? 'Building files...' : 'Waiting for code generation...'}
              </div>
            )
          )}
        </div>
      </div>

      {/* Deploy Panel Modal */}
      {showDeployPanel && (
        <DeployPanel
          files={files}
          projectName={initialPrompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'webai-project'}
          onClose={() => setShowDeployPanel(false)}
        />
      )}
    </div>
  );
}
