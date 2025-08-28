import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, X } from 'lucide-react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

const AiTaskInput = ({ onTaskCreate, loading, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
      if (transcript) {
        onTaskCreate(transcript);
        setPrompt('');
      }
    };
    
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, [onTaskCreate]);

  const handleSubmit = () => {
    if (!prompt.trim() || loading) return;
    onTaskCreate(prompt);
    setPrompt('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && prompt.trim()) {
      handleSubmit();
    }
  };

  const handleListen = () => {
    if (loading || !recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setPrompt('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/95 to-gray-100/95 dark:from-zinc-900/95 dark:to-zinc-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-700/50 shadow-2xl rounded-3xl p-6 w-96 transform animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-3 text-gray-900 dark:text-white">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          AI Task Creator
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
        Use AI to create smart tasks with voice or text input.
      </p>
      
      {/* Input Section */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" size={18} />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your task..."
            className="w-full bg-white/50 dark:bg-zinc-700/50 border border-gray-300 dark:border-zinc-600 rounded-xl py-3 pl-10 pr-20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Create'}
          </button>
        </div>
        
        {/* Voice Input Button */}
        {isSpeechRecognitionSupported && (
          <button
            type="button"
            onClick={handleListen}
            disabled={loading}
            className={`p-3 rounded-xl transition-colors disabled:opacity-50 ${
              isListening 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-gray-200 dark:bg-zinc-700/50 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-700'
            }`}
            title={isListening ? 'Stop Listening' : 'Start Voice Input'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>
      
      {/* Listening Indicator */}
      {isListening && (
        <div className="text-center text-sm text-amber-600 dark:text-amber-400 font-medium animate-pulse">
          🎤 Listening... Speak now
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
          ✨ Creating your task...
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AiTaskInput;