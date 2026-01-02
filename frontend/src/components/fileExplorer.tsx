import { FileItem } from '../types';

interface FileExplorerProps {
  files: FileItem[];
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  onToggleFolder: (path: string) => void;
}

export default function FileExplorer({
  files,
  selectedFile,
  onSelectFile,
  onToggleFolder,
}: FileExplorerProps) {
  const renderItem = (item: FileItem, depth: number = 0) => {
    const isSelected = selectedFile?.path === item.path;

    return (
      <div key={item.path}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-[#16161e] ${
            isSelected ? 'bg-[#1a1a24] text-white' : 'text-gray-400'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              onToggleFolder(item.path);
            } else {
              onSelectFile(item);
            }
          }}
        >
          {item.type === 'folder' ? (
            <>
              <span className="text-[10px]">{item.isOpen ? '📂' : '📁'}</span>
              <span className="text-xs">{item.name}</span>
            </>
          ) : (
            <>
              <span className="text-[10px]">
                {item.name.endsWith('.html') ? '🌐' :
                 item.name.endsWith('.css') ? '🎨' :
                 item.name.endsWith('.js') ? '📜' :
                 item.name.endsWith('.json') ? '📋' : '📄'}
              </span>
              <span className="text-xs">{item.name}</span>
            </>
          )}
        </div>
        {item.type === 'folder' && item.isOpen && item.children && (
          <div>
            {item.children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0f]">
      <div className="px-2 py-2 border-b border-[#1a1a24]">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Files</h3>
      </div>
      <div className="py-1">
        {files.map((file) => renderItem(file))}
      </div>
    </div>
  );
}
