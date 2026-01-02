import { useState } from 'react';

interface LandingPageProps {
  onStartBuilding: (prompt: string) => void;
}

export default function LandingPage({ onStartBuilding }: LandingPageProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onStartBuilding(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 border border-indigo-500/20 rounded-full animate-pulse" />
      <div className="absolute top-40 right-32 w-20 h-20 border border-purple-500/20 rotate-45" />
      <div className="absolute bottom-40 left-40 w-16 h-16 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-lg rotate-12" />
      <div className="absolute top-1/3 right-20 w-24 h-24 border border-cyan-500/10 rounded-2xl -rotate-12" />
      <div className="absolute bottom-32 right-1/4 w-12 h-12 bg-indigo-500/10 rounded-full" />
      
      {/* Gradient Accent Lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-indigo-500/50 to-transparent" />
      <div className="absolute bottom-0 left-1/3 w-px h-24 bg-gradient-to-t from-purple-500/30 to-transparent" />
      <div className="absolute bottom-0 right-1/3 w-px h-20 bg-gradient-to-t from-cyan-500/30 to-transparent" />

      {/* Subtle Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo/Badge */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-[#111118] border border-[#222233] rounded-full px-3 py-1.5">
            <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">⚡</span>
            </div>
            <span className="text-gray-400 text-xs font-medium">WebAI Builder v1.0</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-3">
          <span className="text-white">Build </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">anything</span>
          <span className="text-white"> with AI</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-sm md:text-base text-center mb-8 max-w-md">
          Describe your idea and watch it come to life. No coding required.
        </p>

        {/* Input Box */}
        <div className="w-full max-w-lg">
          <div className="bg-[#0d0d14] border border-[#1a1a2a] rounded-xl p-3 shadow-xl">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              className="w-full bg-transparent text-white text-sm placeholder-gray-600 resize-none outline-none min-h-[50px] mb-3"
              rows={2}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">G</span>
                  </div>
                  <span>Groq</span>
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
              >
                <span>Generate</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <span className="text-gray-600 text-xs mr-1">Try:</span>
          {['Todo App', 'Portfolio', 'Dashboard', 'Calculator'].map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(`Create a ${example.toLowerCase()}`)}
              className="bg-[#111118] hover:bg-[#161622] border border-[#222233] hover:border-[#333344] rounded-full px-3 py-1 text-gray-400 hover:text-white text-xs transition-all"
            >
              {example}
            </button>
          ))}
        </div>

        {/* Bottom Links */}
        <div className="absolute bottom-6 flex items-center gap-4 text-xs text-gray-600">
          <a href="#" className="hover:text-gray-400 transition-colors">Documentation</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-400 transition-colors">GitHub</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-400 transition-colors">Examples</a>
        </div>
      </div>
    </div>
  );
}
