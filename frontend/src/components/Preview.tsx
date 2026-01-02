interface PreviewProps {
  html: string;
}

export default function Preview({ html }: PreviewProps) {
  if (!html) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50">
        <div className="text-center">
          <div className="text-3xl mb-2">👁️</div>
          <p className="text-xs text-gray-500">Preview will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Preview Header */}
      <div className="h-8 bg-[#0a0a10] border-b border-[#1a1a24] flex items-center px-3">
        <span className="text-xs text-gray-400">Preview</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" title="Live" />
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-white">
        <iframe
          srcDoc={html}
          title="Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}
