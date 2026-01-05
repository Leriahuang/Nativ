
import React, { useState, useEffect } from 'react';
import { Search, Volume2, Bookmark, BookmarkCheck, Loader2, History, X } from 'lucide-react';
import { DictionaryEntry, LearningLanguage, SavedWord } from '../types';
import { searchWord, speakText, decodeAudio } from '../geminiService';
import Logo from './Logo';

interface SearchPageProps {
  language: LearningLanguage;
  onSave: (entry: DictionaryEntry) => void;
  savedWords: SavedWord[];
}

// Client-side cache for instant repeat results
const searchCache: Record<string, DictionaryEntry> = {};

const SearchPage: React.FC<SearchPageProps> = ({ language, onSave, savedWords }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('native_search_history');
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  const handleSearch = async (word: string) => {
    const cleanQuery = word.trim().toLowerCase();
    if (!cleanQuery) return;

    // Return cached result immediately if available
    if (searchCache[cleanQuery]) {
      setResult(searchCache[cleanQuery]);
      return;
    }

    setLoading(true);
    try {
      const data = await searchWord(cleanQuery, language);
      setResult(data);
      searchCache[cleanQuery] = data;
      
      const newHistory = [word, ...history.filter(h => h !== word)].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('native_search_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (text: string) => {
    try {
      const base64 = await speakText(text, language);
      const buffer = await decodeAudio(base64);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) { console.error(e); }
  };

  const isSaved = (word: string) => savedWords.some(w => w.word.toLowerCase() === word.toLowerCase());

  return (
    <div className={`p-5 pb-20 min-h-full flex flex-col transition-all duration-300 ${!result && !loading ? 'justify-center items-center' : 'justify-start'}`}>
      
      {/* Search Header Area - Only visible on landing */}
      {!result && !loading && (
        <div className="text-center mb-6 animate-in fade-in zoom-in-95 duration-700">
          <Logo size={240} className="mb-4 hover:scale-105 transition-transform duration-500 cursor-pointer" />
          <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em] mt-2">{language} Excellence</p>
        </div>
      )}

      {/* Search Bar - Wider and more prominent */}
      <div className={`relative w-full transition-all duration-500 ${result ? 'mt-2 mb-6' : 'max-w-xs mx-auto'}`}>
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-gray-400 w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder={`Search ${language}...`}
          className="w-full bg-white rounded-2xl py-3.5 pl-12 pr-12 text-md shadow-sm border-none focus:ring-2 focus:ring-[#FFD60A] transition-all"
        />
        <div className="absolute inset-y-0 right-3 flex items-center space-x-1">
          {query && !loading && (
            <button onClick={() => { setQuery(''); setResult(null); }} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {loading && <Loader2 className="animate-spin text-[#FFD60A] w-5 h-5" />}
        </div>
      </div>

      {/* History Area */}
      {!result && !loading && history.length > 0 && (
        <div className="w-full max-w-xs mt-4 flex flex-wrap gap-2 justify-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          {history.slice(0, 6).map(h => (
            <button key={h} onClick={() => { setQuery(h); handleSearch(h); }} className="bg-white/80 text-[11px] font-bold text-gray-500 px-3 py-1.5 rounded-full border border-gray-100 hover:bg-white transition-colors">
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Results - Slightly expanded for better readability (roughly 1.2-1.5 screens) */}
      {result && (
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            
            {/* Main Word Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-4xl font-black text-[#1C1C1E]">{result.word}</h2>
                  <button onClick={() => playAudio(result.word)} className="p-2 bg-[#F2F2F7] rounded-full hover:bg-gray-200">
                    <Volume2 className="w-5 h-5 text-[#007AFF]" />
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm text-[#007AFF] bg-[#007AFF]/5 px-2 py-1 rounded border border-[#007AFF]/10">{result.ipa}</span>
                  <span className="text-xs font-black uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    {result.partOfSpeech} {result.gender && `• ${result.gender}`}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => onSave(result)} 
                className={`p-4 rounded-2xl transition-all shadow-sm active:scale-95 ${isSaved(result.word) ? 'bg-[#FFD60A] text-white' : 'bg-[#F2F2F7] text-gray-400'}`}
              >
                {isSaved(result.word) ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
              </button>
            </div>

            {/* Meaning & Synonyms Section */}
            <div className="space-y-3">
              <p className="text-xl font-bold text-[#1C1C1E] leading-tight">{result.meaning}</p>
              <div className="flex flex-wrap gap-2">
                {result.synonyms.map((s, i) => (
                  <span key={i} className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg text-gray-500 font-medium">
                    <span className="font-bold text-gray-700">{s.word}</span> {s.translation}
                  </span>
                ))}
              </div>
            </div>

            {/* Expressions - More Breathing Room */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Colloquial Usage</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {result.expressions.map((e, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#F2F2F7]/40 p-3.5 rounded-2xl border border-gray-50 group">
                    <div className="pr-4">
                      <p className="text-md font-bold leading-tight group-hover:text-[#007AFF] transition-colors">{e.original}</p>
                      <p className="text-xs text-gray-500 leading-tight mt-1">{e.translation}</p>
                    </div>
                    <button onClick={() => playAudio(e.original)} className="p-2 text-[#007AFF] bg-white rounded-xl shadow-sm hover:scale-110 transition-transform flex-shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Examples - Enhanced Layout */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">In Context</h4>
              {result.examples.map((ex, i) => (
                <div key={i} className="group relative pl-4 border-l-4 border-[#FFD60A]/20 py-1 transition-all hover:border-[#FFD60A]">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-[9px] font-black uppercase text-gray-400 flex items-center">
                      {ex.source === 'YouTube' ? '📺' : '🎙️'} <span className="ml-1">{ex.source}</span>
                    </span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${ex.formality === 'casual' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                      {ex.formality}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-gray-800">
                    {ex.original.split(new RegExp(`(${result.word})`, 'gi')).map((p, j) => 
                      p.toLowerCase() === result.word.toLowerCase() ? <span key={j} className="text-[#007AFF] font-bold">{p}</span> : p
                    )}
                  </p>
                  <p className="text-gray-400 text-[11px] italic mt-1">{ex.translation}</p>
                  <button 
                    onClick={() => playAudio(ex.original)} 
                    className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-[#007AFF] hover:bg-blue-50 rounded-full transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
