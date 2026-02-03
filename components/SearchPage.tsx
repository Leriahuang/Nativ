import React, { useState, useEffect } from 'react';
import { Search, Volume2, Bookmark, BookmarkCheck, Loader2, X, Pin, Trash2 } from 'lucide-react';
import { DictionaryEntry, LearningLanguage, SavedWord } from '../types';
import { searchWord, searchWordStream, speakText, decodeAudio } from '../geminiService';
import Logo from './Logo';

interface SearchPageProps {
  language: LearningLanguage;
  onSave: (entry: DictionaryEntry) => void;
  savedWords: SavedWord[];
}

const searchCache: Record<string, DictionaryEntry> = {};

const SearchPage: React.FC<SearchPageProps> = ({ language, onSave, savedWords }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [streamingResult, setStreamingResult] = useState<Partial<DictionaryEntry> | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const [history, setHistory] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('native_search_history');
    if (storedHistory) setHistory(JSON.parse(storedHistory));

    const storedPinned = localStorage.getItem('native_pinned_searches');
    if (storedPinned) setPinned(JSON.parse(storedPinned));
  }, []);

  useEffect(() => {
    localStorage.setItem('native_search_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('native_pinned_searches', JSON.stringify(pinned));
  }, [pinned]);

  const handleSearch = async (word: string) => {
    const cleanQuery = word.trim().toLowerCase();
    if (!cleanQuery) return;

    if (!pinned.includes(cleanQuery)) {
      setHistory(prev => {
        const filtered = prev.filter(h => h !== cleanQuery);
        return [cleanQuery, ...filtered].slice(0, 10);
      });
    }

    if (searchCache[cleanQuery]) {
      console.log('[SEARCH] Cache hit for:', cleanQuery);
      setResult(searchCache[cleanQuery]);
      setStreamingResult(null);
      setIsStreaming(false);
      return;
    }

    setLoading(true);
    setIsStreaming(true);
    setStreamingResult({} as Partial<DictionaryEntry>);
    setResult(null);

    try {
      let lastPartial: Partial<DictionaryEntry> = {};
      let updateCount = 0;

      for await (const partial of searchWordStream(cleanQuery, language)) {
        updateCount++;
        lastPartial = { ...lastPartial, ...partial };
        setStreamingResult(lastPartial);
      }

      if (!lastPartial.word || !lastPartial.meaning) {
        throw new Error('Incomplete markdown - missing required fields (word or meaning)');
      }

      const finalResult = lastPartial as DictionaryEntry;
      console.log('[SEARCH] Markdown streaming successful. Caching result.');
      setResult(finalResult);
      searchCache[cleanQuery] = finalResult;

    } catch (error) {
      console.error('[SEARCH] Markdown streaming failed:', error);
      console.log('[SEARCH] Falling back to JSON mode...');

      try {
        const data = await searchWord(cleanQuery, language);
        console.log('[SEARCH] JSON fallback successful');
        setResult(data);
        searchCache[cleanQuery] = data;
      } catch (fallbackError) {
        console.error('[SEARCH] Both markdown and JSON methods failed:', fallbackError);
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setStreamingResult(null);
    }
  };

  const togglePin = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    if (pinned.includes(term)) {
      setPinned(prev => prev.filter(p => p !== term));
      setHistory(prev => [term, ...prev.filter(h => h !== term)].slice(0, 10));
    } else {
      setPinned(prev => [term, ...prev]);
      setHistory(prev => prev.filter(h => h !== term));
    }
  };

  const clearHistory = () => {
    setHistory([]);
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

  const SkeletonWord = () => (
    <div className="animate-pulse space-y-2">
      <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
      <div className="flex items-center space-x-3">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );

  const SkeletonMeaning = () => (
    <div className="animate-pulse space-y-2">
      <div className="h-5 bg-gray-200 rounded w-full"></div>
      <div className="h-5 bg-gray-200 rounded w-5/6"></div>
    </div>
  );

  const SkeletonChips = () => (
    <div className="flex flex-wrap gap-2 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-7 bg-gray-200 rounded-lg w-24"></div>
      ))}
    </div>
  );

  const SkeletonExpression = () => (
    <div className="animate-pulse bg-gray-100 p-3.5 rounded-2xl border border-gray-50">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );

  const SkeletonExample = () => (
    <div className="animate-pulse pl-4 border-l-4 border-gray-200 py-1">
      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>
  );

  return (
    <div className={`p-5 pb-20 min-h-full flex flex-col transition-all duration-300 ${!result && !streamingResult && !loading ? 'justify-center items-center' : 'justify-start'}`}>

      {!result && !streamingResult && !loading && (
        <div className="text-center mb-8 animate-in fade-in zoom-in-95 duration-700">
          <Logo size={280} className="mx-auto mb-2 hover:scale-[1.02] transition-transform duration-500 cursor-pointer" />
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Elevate your {language}</p>
        </div>
      )}

      <div className={`relative w-full transition-all duration-500 ${result || streamingResult ? 'mt-2 mb-6' : 'max-w-xs mx-auto'}`}>
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-gray-400 w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder={`Search ${language}...`}
          className="w-full bg-white rounded-2xl py-4 pl-12 pr-12 text-base shadow-sm border-none focus:ring-2 focus:ring-[#FFD60A] transition-all"
        />
        <div className="absolute inset-y-0 right-3 flex items-center space-x-1">
          {query && !loading && (
            <button onClick={() => { setQuery(''); setResult(null); setStreamingResult(null); }} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {loading && <Loader2 className="animate-spin text-[#FFD60A] w-5 h-5" />}
        </div>
      </div>

      {!result && !streamingResult && !loading && (history.length > 0 || pinned.length > 0) && (
        <div className="w-full max-w-xs mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recent & Pinned</span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center space-x-1 text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-wide"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {pinned.map(term => (
              <button
                key={`pinned-${term}`}
                onClick={() => { setQuery(term); handleSearch(term); }}
                className="group flex items-center space-x-1.5 pl-3 pr-2 py-1.5 rounded-xl border border-[#FFD60A]/30 bg-[#FFD60A]/5 hover:bg-[#FFD60A]/10 transition-all"
              >
                <span className="text-[11px] font-bold text-[#1C1C1E]">{term}</span>
                <div
                  onClick={(e) => togglePin(e, term)}
                  className="p-1 hover:bg-[#FFD60A]/20 rounded-full transition-colors"
                >
                   <Pin className="w-3 h-3 text-[#FFD60A] fill-[#FFD60A]" />
                </div>
              </button>
            ))}

            {history.map(term => (
              <button
                key={`hist-${term}`}
                onClick={() => { setQuery(term); handleSearch(term); }}
                className="group flex items-center space-x-1.5 pl-3 pr-2 py-1.5 rounded-xl border border-gray-100 bg-white/80 hover:bg-white transition-all"
              >
                <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-700">{term}</span>
                <div
                  onClick={(e) => togglePin(e, term)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors opacity-30 group-hover:opacity-100"
                >
                   <Pin className="w-3 h-3 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {(result || streamingResult) && (
        <div className="w-full space-y-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              {(streamingResult?.word || result?.word) ? (
                <div className="space-y-1 animate-in fade-in duration-300">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-4xl font-black text-[#1C1C1E]">{streamingResult?.word || result?.word}</h2>
                    {(streamingResult?.word || result?.word) && (
                      <button onClick={() => playAudio(streamingResult?.word || result!.word)} className="p-2 bg-[#F2F2F7] rounded-full hover:bg-gray-200">
                        <Volume2 className="w-5 h-5 text-[#007AFF]" />
                      </button>
                    )}
                  </div>
                  {(streamingResult?.ipa || result?.ipa) && (
                    <div className="flex items-center space-x-3 animate-in fade-in duration-300">
                      <span className="font-mono text-sm text-[#007AFF] bg-[#007AFF]/5 px-2 py-1 rounded border border-[#007AFF]/10">
                        {streamingResult?.ipa || result?.ipa}
                      </span>
                      {(streamingResult?.partOfSpeech || result?.partOfSpeech) && (
                        <span className="text-xs font-black uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {streamingResult?.partOfSpeech || result?.partOfSpeech} {(streamingResult?.gender || result?.gender) && `• ${streamingResult?.gender || result?.gender}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <SkeletonWord />
              )}

              {result && (
                <button
                  onClick={() => onSave(result)}
                  className={`p-4 rounded-2xl transition-all shadow-sm active:scale-95 animate-in fade-in duration-300 ${isSaved(result.word) ? 'bg-[#FFD60A] text-white' : 'bg-[#F2F2F7] text-gray-400'}`}
                >
                  {isSaved(result.word) ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
                </button>
              )}
            </div>

            {(streamingResult?.meaning || result?.meaning) ? (
              <div className="space-y-3 animate-in fade-in duration-300">
                <p className="text-xl font-bold text-[#1C1C1E] leading-tight">
                  {streamingResult?.meaning || result?.meaning}
                </p>
                {((streamingResult?.synonyms && streamingResult.synonyms.length > 0) || (result?.synonyms && result.synonyms.length > 0)) && (
                  <div className="flex flex-wrap gap-2">
                    {(streamingResult?.synonyms || result?.synonyms || []).map((s, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg text-gray-500 font-medium animate-in fade-in duration-300"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <span className="font-bold text-gray-700">{s.word}</span> {s.translation}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : isStreaming ? (
              <SkeletonMeaning />
            ) : null}

            {!streamingResult?.meaning && !result?.meaning && isStreaming && (
              <SkeletonChips />
            )}

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Colloquial Usage</h4>
              {((streamingResult?.expressions && streamingResult.expressions.length > 0) || (result?.expressions && result.expressions.length > 0)) ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {(streamingResult?.expressions || result?.expressions || []).map((e, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-[#F2F2F7]/40 p-3.5 rounded-2xl border border-gray-50 group animate-in fade-in duration-300"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
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
              ) : isStreaming ? (
                <div className="space-y-2.5">
                  <SkeletonExpression />
                  <SkeletonExpression />
                  <SkeletonExpression />
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">In Context</h4>
              {((streamingResult?.examples && streamingResult.examples.length > 0) || (result?.examples && result.examples.length > 0)) ? (
                <>
                  {(streamingResult?.examples || result?.examples || []).map((ex, i) => (
                    <div
                      key={i}
                      className="group relative pl-4 border-l-4 border-[#FFD60A]/20 py-1 transition-all hover:border-[#FFD60A] animate-in fade-in duration-300"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="text-[9px] font-black uppercase text-gray-400 flex items-center">
                          {ex.source === 'YouTube' ? '📺' : '🎙️'} <span className="ml-1">{ex.source}</span>
                        </span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${ex.formality === 'casual' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                          {ex.formality}
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-gray-800">
                        {ex.original.split(new RegExp(`(${(streamingResult?.word || result?.word || '')})`, 'gi')).map((p, j) =>
                          p.toLowerCase() === (streamingResult?.word || result?.word || '').toLowerCase() ? <span key={j} className="text-[#007AFF] font-bold">{p}</span> : p
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
                </>
              ) : isStreaming ? (
                <div className="space-y-3">
                  <SkeletonExample />
                  <SkeletonExample />
                  <SkeletonExample />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
