
import React, { useState, useEffect } from 'react';
import { Mic2, Play, Pause, RotateCcw, Loader2, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { SavedWord, LearningLanguage, PodcastStory } from '../types';
import { generatePodcast, speakText, decodeAudio } from '../geminiService';

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
      }, 2500);
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
          <div className="w-32 h-32 bg-[#FFD60A]/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-[#FFD60A] animate-spin" strokeWidth={3} />
          </div>
          <Sparkles className="absolute -top-2 -right-2 text-[#FFD60A] animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold transition-all duration-500">{loadingMessages[currentMessageIndex]}</h2>
          <p className="text-gray-500">Wait for it... it's going to be legendary.</p>
        </div>
      </div>
    );
  }

  if (story) {
    return (
      <div className="p-6 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
        <header className="flex justify-between items-start">
          <button onClick={() => { setStory(null); stopPodcast(); }} className="text-gray-400 font-bold">Back</button>
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD60A]">Improv Story</span>
            <h2 className="text-3xl font-bold">{story.title}</h2>
          </div>
          <div className="w-8" />
        </header>

        <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center space-y-12">
          <div className="relative">
             <div className={`w-48 h-48 rounded-full bg-[#F2F2F7] flex items-center justify-center border-8 border-white shadow-inner transition-all duration-1000 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
                <Mic2 className={`w-20 h-20 ${isPlaying ? 'text-[#007AFF] animate-pulse' : 'text-gray-300'}`} />
             </div>
             {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-full border-4 border-[#007AFF] rounded-full animate-ping opacity-20" />
                </div>
             )}
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={() => { stopPodcast(); playPodcast(); }} className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <RotateCcw className="w-6 h-6" />
            </button>
            <button 
              onClick={isPlaying ? stopPodcast : playPodcast}
              className="w-24 h-24 bg-[#FFD60A] rounded-full flex items-center justify-center shadow-xl shadow-[#FFD60A]/30 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-10 h-10 text-white fill-white" /> : <Play className="w-10 h-10 text-white fill-white ml-2" />}
            </button>
            <div className="w-14" />
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex justify-between items-center py-4 px-6 bg-[#F2F2F7] rounded-2xl font-bold text-sm"
            >
              <span>Transcript</span>
              {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showTranscript && (
              <div className="p-6 bg-white border border-gray-100 rounded-2xl text-lg leading-relaxed space-y-4 animate-in fade-in duration-300">
                <p>
                  {story.text.split(' ').map((word, i) => {
                    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
                    const isKeyword = story.wordsUsed.some(w => w.toLowerCase().includes(cleanWord) || cleanWord.includes(w.toLowerCase()));
                    return (
                      <span key={i} className={isKeyword ? "bg-[#FFD60A]/30 font-bold px-1 rounded mx-0.5" : ""}>
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
          className="w-full bg-[#1C1C1E] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <span>Create New Story</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 h-full flex flex-col">
      <header>
        <h1 className="text-4xl font-bold text-[#1C1C1E]">Improv</h1>
        <p className="text-gray-500">Pick 5-10 words to generate a joke.</p>
      </header>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-3">
          {words.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <Mic2 className="text-gray-300" />
              </div>
              <p className="text-gray-400">Save some words first!</p>
            </div>
          )}
          {words.map(w => (
            <button
              key={w.id}
              onClick={() => toggleWord(w.id)}
              className={`p-4 rounded-2xl flex justify-between items-center transition-all border-2 ${
                selectedWordIds.has(w.id) 
                  ? 'bg-white border-[#FFD60A] shadow-md' 
                  : 'bg-white border-transparent shadow-sm'
              }`}
            >
              <div className="text-left">
                <p className="font-bold text-lg">{w.word}</p>
                <p className="text-xs text-gray-500">{w.meaning}</p>
              </div>
              {selectedWordIds.has(w.id) && <CheckCircle2 className="text-[#FFD60A] w-6 h-6" />}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 bg-[#F2F2F7] sticky bottom-0 border-t border-gray-100 space-y-4">
        <div className="flex justify-between items-center px-2">
          <span className="text-sm font-bold">{selectedWordIds.size}/10 selected</span>
          <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Need at least 5</span>
        </div>
        <button
          disabled={selectedWordIds.size < 5}
          onClick={handleGenerate}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${
            selectedWordIds.size >= 5 
              ? 'bg-[#FFD60A] text-white shadow-lg active:scale-95' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Mic2 className="w-5 h-5" />
          <span>Generate Story</span>
        </button>
      </div>
    </div>
  );
};

export default ImprovPage;
