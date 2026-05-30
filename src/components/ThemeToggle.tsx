import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext.tsx';
import '../styles/ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme} 
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="theme-toggle-icon sun-icon" size={18} />
      ) : (
        <Moon className="theme-toggle-icon moon-icon" size={18} />
      )}
    </button>
  );
};

export default ThemeToggle;
