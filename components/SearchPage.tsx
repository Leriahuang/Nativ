
import React, { useState, useEffect } from 'react';
import { Search, Volume2, Bookmark, BookmarkCheck, ArrowRight, Loader2, History } from 'lucide-react';
import { DictionaryEntry, LearningLanguage, SavedWord } from '../types';
import { searchWord, speakText, decodeAudio } from '../geminiService';

interface SearchPageProps {
  language: LearningLanguage;
  onSave: (entry: DictionaryEntry) => void;
  savedWords: SavedWord[];
}

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
    if (!word.trim()) return;
    setLoading(true);
    try {
      const data = await searchWord(word, language);
      setResult(data);
      const newHistory = [word, ...history.filter(h => h !== word)].slice(0, 20);
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
    } catch (e) {
      console.error(e);
    }
  };

  const isSaved = (word: string) => savedWords.some(w => w.word.toLowerCase() === word.toLowerCase());

  return (
    <div className="p-6 pb-24 space-y-8">
      <header>
        <h1 className="text-4xl font-bold text-[#1C1C1E]">Search</h1>
        <p className="text-gray-500">Discover colloquial {language}.</p>
      </header>

      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-gray-400 w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder={`French ↔ English`}
          className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 text-lg shadow-sm border-none focus:ring-2 focus:ring-[#FFD60A] transition-all"
        />
        {loading && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
          </div>
        )}
      </div>

      {!result && history.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-gray-400">
            <History className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Recent Searches</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button
                key={h}
                onClick={() => { setQuery(h); handleSearch(h); }}
                className="bg-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-5xl font-bold text-[#1C1C1E]">{result.word}</h2>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm text-[#007AFF] bg-[#007AFF]/10 px-2 py-1 rounded">{result.ipa}</span>
                  <button onClick={() => playAudio(result.word)} className="p-2 bg-[#F2F2F7] rounded-full hover:bg-gray-200 transition-colors">
                    <Volume2 className="w-5 h-5 text-[#007AFF]" />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => onSave(result)}
                className={`p-4 rounded-2xl transition-all active:scale-90 ${isSaved(result.word) ? 'bg-[#FFD60A] text-white shadow-lg' : 'bg-[#F2F2F7] text-gray-400 hover:text-gray-600'}`}
              >
                {isSaved(result.word) ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
              </button>
            </div>

            <div className="space-y-2 border-t pt-6">
              <p className="text-xl font-semibold">{result.meaning}</p>
              <div className="flex space-x-2">
                <span className="text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded text-gray-500">{result.partOfSpeech}</span>
                {result.gender && <span className="text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded text-gray-500">{result.gender}</span>}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Common Expressions</h4>
              {result.expressions.map((exp, i) => (
                <div key={i} className="bg-[#F2F2F7] p-4 rounded-2xl group cursor-default">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-lg">{exp.original}</p>
                    <button onClick={() => playAudio(exp.original)} className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Volume2 className="w-4 h-4 text-[#007AFF]" />
                    </button>
                  </div>
                  <p className="text-gray-600">{exp.translation}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Synonyms</h4>
              <div className="flex flex-wrap gap-2">
                {result.synonyms.map((syn, i) => (
                  <button 
                    key={i}
                    onClick={() => { setQuery(syn.word); handleSearch(syn.word); }}
                    className="flex items-center space-x-2 bg-white border px-3 py-2 rounded-xl text-sm font-medium hover:border-[#FFD60A] transition-all"
                  >
                    <span>{syn.word}</span>
                    <span className="text-gray-400 text-xs">— {syn.translation}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Examples</h4>
              {result.examples.map((ex, i) => (
                <div key={i} className="space-y-2 border-l-4 border-[#FFD60A] pl-4 py-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 bg-gray-800 text-white rounded">
                      {ex.source === 'YouTube' ? '📺' : ex.source === 'Podcast' ? '🎙️' : '💬'} {ex.source}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${ex.formality === 'casual' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      {ex.formality}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-lg leading-relaxed">{ex.original}</p>
                    <button onClick={() => playAudio(ex.original)} className="mt-1 flex-shrink-0">
                      <Volume2 className="w-4 h-4 text-[#007AFF]" />
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm italic">{ex.translation}</p>
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
