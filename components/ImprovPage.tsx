
import React, { useState, useEffect } from 'react';
import { Mic2, Play, Pause, RotateCcw, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { SavedWord, LearningLanguage, PodcastStory } from '../types';
import { generatePodcast, speakText, decodeAudio } from '../geminiService';
import Logo from './Logo';

interface ImprovPageProps {
  words: SavedWord[];
  language: LearningLanguage;
}

const loadingMessages = [
  "Teaching Claude to be funny...",
  "Adding Gen Z jokes...",
  "Channeling Louis C.K...",
  "Crafting a witty punchline...",
  "Consulting Phoebe Waller-Bridge...",
];

const ImprovPage: React.FC<ImprovPageProps> = ({ words, language }) => {
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [story, setStory] = useState<PodcastStory | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      interval = window.setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const toggleWord = (id: string) => {
    const next = new Set(selectedWordIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 10) next.add(id);
    setSelectedWordIds(next);
  };

  const handleGenerate = async () => {
    if (selectedWordIds.size < 5) return;
    setIsGenerating(true);
    setStory(null);
    setAudioBuffer(null);
    
    try {
      const selectedWords = words.filter(w => selectedWordIds.has(w.id)).map(w => w.word);
      const newStory = await generatePodcast(selectedWords, language);
      setStory(newStory);
      
      const base64Audio = await speakText(newStory.text, language);
      const buffer = await decodeAudio(base64Audio);
      setAudioBuffer(buffer);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const playPodcast = () => {
    if (!audioBuffer) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start();
    setAudioSource(source);
    setIsPlaying(true);
  };

  const stopPodcast = () => {
    if (audioSource) {
      audioSource.stop();
      setAudioSource(null);
    }
    setIsPlaying(false);
  };

  if (isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <Logo size={220} className="animate-bounce" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2">
             <Loader2 className="w-6 h-6 text-[#FFD60A] animate-spin" strokeWidth={3} />
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cooking...</span>
          </div>
        </div>
        <div className="text-center space-y-3 pt-4">
          <h2 className="text-2xl font-black transition-all duration-500">{loadingMessages[currentMessageIndex]}</h2>
          <p className="text-gray-400 text-sm font-medium">Mixing humor with grammar...</p>
        </div>
      </div>
    );
  }

  if (story) {
    return (
      <div className="p-6 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
        <header className="flex justify-between items-start">
          <button onClick={() => { setStory(null); stopPodcast(); }} className="text-gray-400 font-bold hover:text-gray-600 transition-colors">Back</button>
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD60A]">1-Minute Improv</span>
            <h2 className="text-3xl font-black leading-tight mt-1">{story.title}</h2>
          </div>
          <div className="w-8" />
        </header>

        <div className="bg-white rounded-[40px] p-8 shadow-2xl flex flex-col items-center space-y-10 border border-gray-50">
          <div className="relative">
             <div className={`w-40 h-40 rounded-full bg-[#F2F2F7] flex items-center justify-center border-[6px] border-white shadow-inner transition-all duration-1000 ${isPlaying ? 'scale-105 rotate-3' : 'scale-100'}`}>
                <Mic2 className={`w-16 h-16 ${isPlaying ? 'text-[#007AFF] animate-pulse' : 'text-gray-300'}`} />
             </div>
             {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-full border-2 border-[#007AFF] rounded-full animate-ping opacity-10" />
                </div>
             )}
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={() => { stopPodcast(); playPodcast(); }} className="p-4 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
              <RotateCcw className="w-6 h-6" />
            </button>
            <button 
              onClick={isPlaying ? stopPodcast : playPodcast}
              className="w-20 h-20 bg-[#FFD60A] rounded-full flex items-center justify-center shadow-xl shadow-[#FFD60A]/20 active:scale-95 transition-all group"
            >
              {isPlaying ? <Pause className="w-8 h-8 text-white fill-white" /> : <Play className="w-8 h-8 text-white fill-white ml-1.5" />}
            </button>
            <div className="w-14" />
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex justify-between items-center py-4 px-6 bg-[#F2F2F7]/50 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400"
            >
              <span>{showTranscript ? 'Hide' : 'Show'} Transcript</span>
              {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showTranscript && (
              <div className="p-6 bg-white border border-gray-100 rounded-3xl text-md leading-relaxed space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
                <p className="text-gray-800 font-medium">
                  {story.text.split(' ').map((word, i) => {
                    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
                    const isKeyword = story.wordsUsed.some(w => w.toLowerCase().includes(cleanWord) || cleanWord.includes(w.toLowerCase()));
                    return (
                      <span key={i} className={isKeyword ? "bg-[#FFD60A]/40 font-black px-1 rounded-md mx-0.5 text-[#1C1C1E]" : ""}>
                        {word}{' '}
                      </span>
                    );
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => { setStory(null); stopPodcast(); }}
          className="w-full bg-[#1C1C1E] text-white py-7 rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 active:scale-[0.97] transition-all"
        >
          <span>Regenerate Punchline</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <header>
        <h1 className="text-4xl font-black text-[#1C1C1E]">Improv</h1>
        <p className="text-gray-500 font-medium text-sm">Select 5-10 words for a punchy 1-min story.</p>
      </header>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          {words.length === 0 && (
            <div className="col-span-2 py-20 text-center space-y-4 flex flex-col items-center">
              <Logo size={120} className="opacity-20 grayscale" />
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-4">Your notebook is empty</p>
            </div>
          )}
          {words.map(w => (
            <button
              key={w.id}
              onClick={() => toggleWord(w.id)}
              className={`p-3.5 rounded-2xl flex flex-col text-left transition-all border-2 min-h-[90px] relative overflow-hidden group ${
                selectedWordIds.has(w.id) 
                  ? 'bg-white border-[#FFD60A] shadow-lg scale-[1.02]' 
                  : 'bg-white border-transparent shadow-sm hover:border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start w-full mb-1">
                <p className={`font-black text-base leading-tight transition-colors ${selectedWordIds.has(w.id) ? 'text-[#1C1C1E]' : 'text-[#3A3A3C]'}`}>
                  {w.word}
                </p>
                {selectedWordIds.has(w.id) && (
                  <CheckCircle2 className="text-[#FFD60A] w-4 h-4 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight line-clamp-2 leading-relaxed">
                {w.meaning}
              </p>
              {selectedWordIds.has(w.id) && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#FFD60A]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 bg-[#F2F2F7] sticky bottom-0 border-t border-gray-100 space-y-4 z-10">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center space-x-2">
            <span className={`text-[11px] font-black uppercase tracking-widest ${selectedWordIds.size >= 5 ? 'text-[#30D158]' : 'text-gray-400'}`}>
              {selectedWordIds.size}/10 selected
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
            {selectedWordIds.size < 5 ? `Need ${5 - selectedWordIds.size} more` : 'Mic is hot!'}
          </span>
        </div>
        <button
          disabled={selectedWordIds.size < 5}
          onClick={handleGenerate}
          className={`w-full py-7 rounded-[2rem] font-black text-xl uppercase tracking-widest flex items-center justify-center space-x-4 transition-all shadow-2xl ${
            selectedWordIds.size >= 5 
              ? 'bg-[#FFD60A] text-white shadow-[#FFD60A]/30 active:scale-[0.97] active:shadow-lg' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Mic2 className={`w-7 h-7 ${selectedWordIds.size >= 5 ? 'animate-pulse' : ''}`} />
          <span>Generate Story</span>
        </button>
      </div>
    </div>
  );
};

export default ImprovPage;
