import { FileItem } from '../types';

interface CodeEditorProps {
  file: FileItem | null;
}

export default function CodeEditor({ file }: CodeEditorProps) {
  if (!file || !file.content) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-[#0c0c12]">
        <div className="text-center">
          <div className="text-3xl mb-2">📄</div>
          <p className="text-xs">Select a file to view</p>
        </div>
      </div>
    );
  }

  const getLanguage = (filename: string): string => {
    if (filename.endsWith('.html')) return 'HTML';
    if (filename.endsWith('.css')) return 'CSS';
    if (filename.endsWith('.js')) return 'JavaScript';
    if (filename.endsWith('.json')) return 'JSON';
    return 'Text';
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0c12]">
      {/* File Tab */}
      <div className="h-8 bg-[#0a0a10] border-b border-[#1a1a24] flex items-center px-3">
        <div className="flex items-center gap-1.5 bg-[#0c0c14] px-2 py-0.5 rounded-t border-t border-l border-r border-[#1a1a24] -mb-px">
          <span className="text-[10px]">
            {file.name.endsWith('.html') ? '🌐' :
             file.name.endsWith('.css') ? '🎨' :
             file.name.endsWith('.js') ? '📜' : '📄'}
          </span>
          <span className="text-xs text-gray-300">{file.name}</span>
        </div>
        <span className="ml-auto text-[10px] text-gray-500">{getLanguage(file.name)}</span>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto p-3">
        <pre className="text-xs font-mono leading-relaxed">
          <code className="text-gray-300">{file.content}</code>
        </pre>
      </div>
    </div>
  );
}
