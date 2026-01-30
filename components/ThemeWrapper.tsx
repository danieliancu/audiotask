
import React from 'react';

interface ThemeWrapperProps {
  theme: 'light' | 'dark' | 'emerald' | 'sunset';
  children: React.ReactNode;
}

const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ theme, children }) => {
  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-slate-900 text-slate-100 selection:bg-blue-500/30';
      case 'emerald':
        return 'bg-emerald-950 text-emerald-50 selection:bg-emerald-500/30';
      case 'sunset':
        return 'bg-orange-950 text-orange-50 selection:bg-orange-500/30';
      default:
        return 'bg-slate-50 text-slate-900 selection:bg-blue-100';
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${getThemeClasses()}`}>
      {children}
    </div>
  );
};

export default ThemeWrapper;
