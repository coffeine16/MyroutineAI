import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff } from 'lucide-react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

const AiTaskInput = ({ onTaskCreate, loading }) => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onTaskCreate(prompt);
    setPrompt('');
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
    <div className="flex items-center gap-2">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Sparkles
          className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none"
          size={20}
        />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type or click the mic to create a task..."
          className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-3 pl-10 pr-24 text-white placeholder-zinc-400 focus:ring-2 focus:ring-amber-500 transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Create'}
        </button>
      </form>

      {isSpeechRecognitionSupported && (
        <button
          type="button"
          onClick={handleListen}
          disabled={loading}
          className={`p-3 rounded-lg transition-colors disabled:opacity-50 ${
            isListening 
              ? 'bg-red-600 text-white animate-pulse' 
              : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'
          }`}
          title={isListening ? 'Stop Listening' : 'Start Listening'}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      )}
    </div>
  );
};

export default AiTaskInput;