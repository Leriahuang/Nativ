
import React, { useState, useMemo } from 'react';
import { BookOpen, Trophy, ArrowRight, CheckCircle2, XCircle, AlertCircle, Volume2 } from 'lucide-react';
import { SavedWord, LearningLanguage } from '../types';
import { speakText, decodeAudio } from '../geminiService';
import Logo from './Logo';

interface NotebookPageProps {
  words: SavedWord[];
  language: LearningLanguage;
  onUpdateSrs: (id: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
}

const NotebookPage: React.FC<NotebookPageProps> = ({ words, language, onUpdateSrs }) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect' | 'typo'>('none');

  const reviewQueue = useMemo(() => {
    return words
      .filter(w => w.nextReviewDate <= Date.now())
      .slice(0, 30);
  }, [words]);

  const currentWord = reviewQueue[currentIndex];

  const handleCheck = () => {
    if (!currentWord) return;
    const normalizedInput = input.trim().toLowerCase();
    const normalizedAnswer = currentWord.word.trim().toLowerCase();
    
    if (normalizedInput === normalizedAnswer) {
      setFeedback('correct');
      setTimeout(() => {
        setShowBack(true);
      }, 500);
    } else if (normalizedInput.length > 3 && normalizedAnswer.includes(normalizedInput)) {
      setFeedback('typo');
    } else {
      setFeedback('incorrect');
      setTimeout(() => {
        setShowBack(true);
      }, 800);
    }
  };

  const handleSrsRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    onUpdateSrs(currentWord.id, rating);
    if (currentIndex < reviewQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowBack(false);
      setInput('');
      setFeedback('none');
    } else {
      setSessionActive(false);
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

  if (!sessionActive) {
    return (
      <div className="p-6 space-y-8 h-full flex flex-col">
        <header>
          <h1 className="text-4xl font-black text-[#1C1C1E]">Notebook</h1>
          <p className="text-gray-500 font-medium">{words.length} words collected.</p>
        </header>

        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex-1 flex flex-col justify-center items-center text-center space-y-6">
          <Logo size={180} className="mb-4" />
          <div>
            <h2 className="text-2xl font-black text-[#1C1C1E]">Daily Review</h2>
            <p className="text-gray-500 mt-2 font-medium max-w-[200px] mx-auto">
              {reviewQueue.length > 0 
                ? `You have ${reviewQueue.length} words to review today.` 
                : "You're all caught up! Go search some new words."}
            </p>
          </div>
          {reviewQueue.length > 0 && (
            <button
              onClick={() => setSessionActive(true)}
              className="w-full bg-[#FFD60A] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-3"
            >
              <span>Start Review</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Recent words</h3>
          <div className="grid grid-cols-2 gap-3">
            {words.slice(0, 4).map(w => (
              <div key={w.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p className="font-black text-md truncate text-[#1C1C1E]">{w.word}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">{w.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const randomExample = currentWord.examples[0];

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setSessionActive(false)} className="text-gray-400 font-bold py-2">Cancel</button>
        <div className="flex-1 mx-4 h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#30D158] transition-all duration-500" 
            style={{ width: `${((currentIndex + 1) / reviewQueue.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-black text-gray-400">{currentIndex + 1}/{reviewQueue.length}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {!showBack ? (
          <div className="w-full bg-white rounded-3xl p-8 shadow-xl space-y-12 animate-in zoom-in-95 duration-300">
            <div className="space-y-4 text-center">
              <span className="text-xs font-black uppercase tracking-widest text-[#FFD60A]">Fill in the blank</span>
              <p className="text-2xl font-medium leading-relaxed italic text-[#1C1C1E]">
                "{randomExample.original.replace(new RegExp(currentWord.word, 'gi'), '_____')}"
              </p>
              <p className="text-gray-400 text-sm">({randomExample.translation})</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  placeholder="Type the word..."
                  className={`w-full bg-[#F2F2F7] border-2 rounded-2xl p-5 text-center text-2xl font-black transition-all outline-none ${
                    feedback === 'correct' ? 'border-[#30D158] text-[#30D158]' : 
                    feedback === 'incorrect' ? 'border-red-400 text-red-500' : 
                    feedback === 'typo' ? 'border-orange-400 text-orange-600' : 'border-transparent focus:border-[#FFD60A]'
                  }`}
                />
                {feedback === 'correct' && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-[#30D158] w-6 h-6" />}
                {feedback === 'incorrect' && <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 w-6 h-6" />}
                {feedback === 'typo' && <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 w-6 h-6" />}
              </div>
              
              <button
                onClick={handleCheck}
                className="w-full bg-[#1C1C1E] text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-lg"
              >
                Check
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white rounded-3xl p-8 shadow-xl space-y-8 animate-in flip-in-y duration-500 overflow-y-auto max-h-[80vh]">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {feedback === 'correct' ? <CheckCircle2 className="text-[#30D158] w-6 h-6" /> : <XCircle className="text-red-400 w-6 h-6" />}
                  <h2 className="text-4xl font-black text-[#1C1C1E]">{currentWord.word}</h2>
                </div>
                <div className="flex items-center space-x-2 font-mono text-sm text-[#007AFF]">
                  <span>{currentWord.ipa}</span>
                  <button onClick={() => playAudio(currentWord.word)} className="p-1 hover:bg-blue-50 rounded-full transition-colors"><Volume2 className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase px-2 py-1 bg-[#F2F2F7] rounded text-gray-500 border border-gray-100">{currentWord.partOfSpeech}</span>
              </div>
            </div>

            <div className="space-y-5">
              <p className="text-xl font-bold text-[#3A3A3C]">{currentWord.meaning}</p>
              <div className="bg-[#F2F2F7] p-5 rounded-3xl space-y-2 border border-gray-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Example</p>
                <p className="text-lg leading-relaxed font-medium text-[#1C1C1E]">{randomExample.original}</p>
                <p className="text-gray-500 text-sm italic">{randomExample.translation}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Expression</p>
                  <p className="text-xs font-bold text-[#1C1C1E]">{currentWord.expressions[0].original}</p>
                </div>
                <div className="space-y-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Synonym</p>
                  <p className="text-xs font-bold text-[#1C1C1E]">{currentWord.synonyms[0].word}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-6">
              <button onClick={() => handleSrsRating('again')} className="bg-red-50 text-red-600 p-4 rounded-2xl text-center space-y-1 active:scale-95 transition-transform border border-red-100">
                <span className="block text-2xl">😰</span>
                <span className="text-[10px] font-black uppercase tracking-wider">Again</span>
              </button>
              <button onClick={() => handleSrsRating('hard')} className="bg-orange-50 text-orange-600 p-4 rounded-2xl text-center space-y-1 active:scale-95 transition-transform border border-orange-100">
                <span className="block text-2xl">🤔</span>
                <span className="text-[10px] font-black uppercase tracking-wider">Hard</span>
              </button>
              <button onClick={() => handleSrsRating('good')} className="bg-blue-50 text-blue-600 p-4 rounded-2xl text-center space-y-1 active:scale-95 transition-transform border border-blue-100">
                <span className="block text-2xl">👍</span>
                <span className="text-[10px] font-black uppercase tracking-wider">Good</span>
              </button>
              <button onClick={() => handleSrsRating('easy')} className="bg-green-50 text-green-600 p-4 rounded-2xl text-center space-y-1 active:scale-95 transition-transform border border-green-100">
                <span className="block text-2xl">🎯</span>
                <span className="text-[10px] font-black uppercase tracking-wider">Easy</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotebookPage;
