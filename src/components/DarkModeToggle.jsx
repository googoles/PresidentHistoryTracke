import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleToggle = () => {
    console.log('Dark mode toggle clicked, current mode:', isDarkMode);
    console.log('Document classes before toggle:', document.documentElement.className);
    toggleDarkMode();
    // Check after a short delay
    setTimeout(() => {
      console.log('Document classes after toggle:', document.documentElement.className);
    }, 100);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-slate-400">
        {isDarkMode ? 'Dark' : 'Light'}
      </span>
      <button
        onClick={handleToggle}
        className={`p-2 rounded-lg transition-colors duration-300 ${
          isDarkMode
            ? 'bg-slate-700 text-amber-400 hover:bg-slate-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default DarkModeToggle;