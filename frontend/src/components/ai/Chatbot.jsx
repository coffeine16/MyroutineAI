import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, Send, X } from 'lucide-react';
import Modal from '../ui/Modal';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

const Chatbot = ({ isOpen, onClose, messages, onSendMessage, loading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleListen = () => {
    if (loading || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-[70vh]">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-700">
          <h3 className="text-xl font-bold text-white flex items-center"><Bot className="mr-2 text-emerald-400" />AI Assistant</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-700/50"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-lg' : 'bg-zinc-700 text-zinc-200 rounded-bl-lg'}`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-zinc-700 text-zinc-200 rounded-bl-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-700 flex items-center gap-2">
          {isSpeechRecognitionSupported && (
            <button onClick={handleListen} disabled={loading} className={`p-3 rounded-xl transition-colors disabled:opacity-50 ${isListening ? 'bg-red-600/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-600/50'}`}>
              <Mic size={18} />
            </button>
          )}
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything or create a task..."
            className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-lg p-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500/50"
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="p-3 bg-emerald-600 text-white rounded-lg transition-colors hover:bg-emerald-500 disabled:opacity-50">
            <Send size={18} />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Chatbot;