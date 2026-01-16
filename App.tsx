import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, LearningLanguage, SavedWord, DictionaryEntry } from './types';
import SearchPage from './components/SearchPage';
import NotebookPage from './components/NotebookPage';
import ImprovPage from './components/ImprovPage';
import SettingsPage from './components/SettingsPage';
import BottomNav from './components/BottomNav';

const STORAGE_KEY_WORDS = 'native_saved_words';
const STORAGE_KEY_SETTINGS = 'native_settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Search);
  const [learningLanguage, setLearningLanguage] = useState<LearningLanguage>('French');
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);

  // Persistence
  useEffect(() => {
    const storedWords = localStorage.getItem(STORAGE_KEY_WORDS);
    if (storedWords) setSavedWords(JSON.parse(storedWords));

    const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setLearningLanguage(settings.learningLanguage || 'French');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(savedWords));
  }, [savedWords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ learningLanguage }));
  }, [learningLanguage]);

  const handleSaveWord = (entry: DictionaryEntry) => {
    const isAlreadySaved = savedWords.find(w => w.word.toLowerCase() === entry.word.toLowerCase());
    if (isAlreadySaved) {
      setSavedWords(prev => prev.filter(w => w.word.toLowerCase() !== entry.word.toLowerCase()));
    } else {
      const newSavedWord: SavedWord = {
        ...entry,
        id: crypto.randomUUID(),
        savedAt: Date.now(),
        nextReviewDate: Date.now(),
        interval: 0,
        stability: 1,
        mastery: 0,
      };
      setSavedWords(prev => [newSavedWord, ...prev]);
    }
  };

  const updateWordSrs = (id: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    setSavedWords(prev => prev.map(w => {
      if (w.id !== id) return w;
      
      let nextInterval = w.interval || 1;
      let nextStability = w.stability;

      switch(rating) {
        case 'again': nextInterval = 1; nextStability *= 0.8; break;
        case 'hard': nextInterval = Math.max(2, w.interval * 1.2); nextStability *= 0.9; break;
        case 'good': nextInterval = Math.max(5, w.interval * 2.5); nextStability *= 1.1; break;
        case 'easy': nextInterval = Math.max(10, w.interval * 4.0); nextStability *= 1.3; break;
      }

      return {
        ...w,
        interval: nextInterval,
        stability: nextStability,
        nextReviewDate: Date.now() + nextInterval * 24 * 60 * 60 * 1000,
        mastery: Math.min(100, w.mastery + (rating === 'easy' ? 20 : rating === 'good' ? 10 : 0))
      };
    }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.Search:
        return <SearchPage 
          language={learningLanguage} 
          onSave={handleSaveWord} 
          savedWords={savedWords} 
        />;
      case AppTab.Notebook:
        return <NotebookPage 
          words={savedWords} 
          language={learningLanguage}
          onUpdateSrs={updateWordSrs} 
        />;
      case AppTab.Improv:
        return <ImprovPage 
          words={savedWords} 
          language={learningLanguage} 
        />;
      case AppTab.Settings:
        return <SettingsPage 
          language={learningLanguage} 
          setLanguage={setLearningLanguage} 
        />;
      default:
        return <SearchPage language={learningLanguage} onSave={handleSaveWord} savedWords={savedWords} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#FBFDFB] overflow-hidden relative shadow-2xl">
      <main className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;