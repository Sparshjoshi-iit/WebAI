import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Builder from './components/Builder';

const STORAGE_KEY = 'webai-project';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'builder'>('landing');
  const [initialPrompt, setInitialPrompt] = useState('');

  // Check for saved project on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.files && parsed.files.length > 0) {
          setInitialPrompt(parsed.prompt || 'Restored project');
          setCurrentPage('builder');
        }
      }
    } catch (e) {
      console.error('Failed to check saved state:', e);
    }
  }, []);

  const handleStartBuilding = (prompt: string) => {
    // Clear any existing saved project when starting fresh
    localStorage.removeItem(STORAGE_KEY);
    setInitialPrompt(prompt);
    setCurrentPage('builder');
  };

  const handleBackToHome = () => {
    setCurrentPage('landing');
    setInitialPrompt('');
  };

  if (currentPage === 'landing') {
    return <LandingPage onStartBuilding={handleStartBuilding} />;
  }

  return <Builder initialPrompt={initialPrompt} onBackToHome={handleBackToHome} />;
}
