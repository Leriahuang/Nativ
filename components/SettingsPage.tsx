import React from 'react';
import { Globe, Book, LogOut, Heart, Github } from 'lucide-react';
import { LearningLanguage } from '../types';

interface SettingsPageProps {
  language: LearningLanguage;
  setLanguage: (lang: LearningLanguage) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ language, setLanguage }) => {
  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-4xl font-black text-[#1C1C1E]">Settings</h1>
        <p className="text-gray-500">Configure your experience.</p>
      </header>

      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest px-1">Language Pair</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Globe className="w-6 h-6 text-[#007AFF]" />
              </div>
              <div>
                <p className="font-bold">Learning Language</p>
                <p className="text-sm text-gray-500">Target for searches & reviews</p>
              </div>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as LearningLanguage)}
              className="bg-gray-100 px-4 py-2 rounded-xl font-bold text-sm focus:ring-2 focus:ring-[#FFD60A]"
            >
              <option value="French">French</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>

          <div className="flex justify-between items-center border-t pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-50 rounded-2xl">
                <Book className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="font-bold">Base Language</p>
                <p className="text-sm text-gray-500">English</p>
              </div>
            </div>
            <span className="font-bold text-sm text-gray-400">English</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest px-1">About Nativ</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <button className="w-full flex justify-between items-center py-2 group">
             <div className="flex items-center space-x-4">
                <Heart className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Premium Membership</span>
             </div>
             <span className="text-xs font-bold text-[#FFD60A] bg-[#FFD60A]/10 px-2 py-1 rounded">Active</span>
          </button>
          <button className="w-full flex justify-between items-center py-2 group border-t pt-4">
             <div className="flex items-center space-x-4">
                <Github className="w-5 h-5 text-gray-800" />
                <span className="font-medium">Open Source Credits</span>
             </div>
          </button>
        </div>
      </section>

      <section className="pt-4">
        <button className="w-full bg-white text-red-500 py-4 rounded-2xl font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-2">
          <LogOut className="w-5 h-5" />
          <span>Reset All Data</span>
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest">
          Nativ v1.0.4 • Crafted with Gemini
        </p>
      </section>
    </div>
  );
};

export default SettingsPage;