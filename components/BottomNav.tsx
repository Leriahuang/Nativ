import React from 'react';
import { Search, Notebook, Mic2, Settings } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: AppTab.Search, label: 'Search', icon: Search },
    { id: AppTab.Notebook, label: 'Notebook', icon: Notebook },
    { id: AppTab.Improv, label: 'Improv', icon: Mic2 },
    { id: AppTab.Settings, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 flex items-start justify-around px-4 z-50 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center space-y-1 w-1/4 transition-all active:scale-95"
          >
            <Icon 
              className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-[#FFD60A] fill-[#FFD60A]/10' : 'text-gray-400'}`} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? 'text-[#1C1C1E]' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;