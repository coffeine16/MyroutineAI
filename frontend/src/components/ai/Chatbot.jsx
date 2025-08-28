import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, Send, X, MessageSquare, Sparkles, Zap, User } from 'lucide-react';
import Modal from '../ui/Modal';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

const Chatbot = ({ isOpen, onClose, messages, onSendMessage, loading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

  const quickActions = [
    { text: "Create a morning routine", icon: "🌅" },
    { text: "Plan my workout", icon: "💪" },
    { text: "Add study session", icon: "📚" },
    { text: "Set up work tasks", icon: "💼" }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative">
        {/* Subtle background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 rounded-full blur-2xl animate-pulse-slow"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-blue-500/15 to-purple-500/15 rounded-full blur-2xl animate-pulse-slow"></div>
        </div>

        <div className="relative flex flex-col h-[70vh]">
          {/* Enhanced Header */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-700/50">
            <div className="flex items-center space-x-3">
              <div className="relative p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
                <Bot size={20} className="text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                  GrindBot Assistant
                </h3>
                <p className="text-zinc-400 text-sm">Your productivity companion</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-zinc-400 hover:text-white transition-all duration-200 rounded-xl hover:bg-zinc-700/50 hover:scale-110 group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-zinc-600/50 scrollbar-track-transparent">
            {messages.length === 1 && (
              <div className="text-center py-8">
                <div className="relative mb-6">
                  <div className="text-5xl animate-gentle-bounce">🤖</div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <h4 className="text-lg font-semibold text-zinc-300 mb-2">Ready to boost your productivity?</h4>
                <p className="text-zinc-500 text-sm mb-6">I can help you create tasks, plan your day, or answer questions!</p>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(action.text)}
                      className="p-3 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-600/50 hover:border-emerald-500/30 rounded-xl transition-all duration-200 hover:scale-[1.02] text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg group-hover:scale-110 transition-transform">{action.icon}</span>
                        <span className="text-sm text-zinc-300 group-hover:text-white font-medium">{action.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.slice(1).map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md relative group ${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                  {/* Message Avatar */}
                  <div className={`absolute ${msg.role === 'user' ? '-right-10 top-0' : '-left-10 top-0'} w-8 h-8 rounded-full bg-gradient-to-br ${msg.role === 'user' ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' : 'from-blue-500/20 to-blue-600/20 border-blue-500/30'} border backdrop-blur-sm flex items-center justify-center`}>
                    {msg.role === 'user' ? (
                      <User size={14} className={msg.role === 'user' ? 'text-emerald-400' : 'text-blue-400'} />
                    ) : (
                      <Bot size={14} className="text-blue-400" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-4 rounded-2xl backdrop-blur-sm border transition-all duration-200 group-hover:scale-[1.02] ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-emerald-600/90 to-emerald-500/90 text-white border-emerald-500/30 rounded-br-lg shadow-lg shadow-emerald-900/25' 
                      : 'bg-gradient-to-br from-zinc-800/90 to-zinc-700/90 text-zinc-200 border-zinc-600/30 rounded-bl-lg shadow-lg shadow-black/25'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Timestamp (appears on hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1">
                    <p className={`text-xs text-zinc-500 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-xs md:max-w-md relative mr-8">
                  <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 backdrop-blur-sm flex items-center justify-center">
                    <Bot size={14} className="text-blue-400" />
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-800/90 to-zinc-700/90 text-zinc-200 border border-zinc-600/30 rounded-bl-lg backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="mt-4 pt-4 border-t border-zinc-700/50 space-y-3">
            <div className="flex items-center gap-3">
              {/* Voice Input Button */}
              {isSpeechRecognitionSupported && (
                <button 
                  onClick={handleListen} 
                  disabled={loading} 
                  className={`p-3 rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-110 ${
                    isListening 
                      ? 'bg-gradient-to-br from-red-600/20 to-red-500/20 text-red-400 border border-red-500/50 animate-pulse shadow-lg shadow-red-900/25' 
                      : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-600/50 hover:border-zinc-500/50 hover:text-white'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
                </button>
              )}

              {/* Text Input */}
              <div className="relative flex-1">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  onFocus={() => setFocusedInput(true)}
                  onBlur={() => setFocusedInput(false)}
                  placeholder="Ask me anything or create a task..."
                  className={`w-full bg-zinc-900/50 border ${focusedInput ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-zinc-600/50'} rounded-xl p-3 pr-12 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 backdrop-blur-sm`}
                  disabled={loading}
                />
                {focusedInput && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 pointer-events-none"></div>
                )}
                
                {/* Character count (appears when typing) */}
                {input.length > 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-zinc-500">{input.length}</span>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button 
                onClick={handleSend} 
                disabled={loading || !input.trim()} 
                className="p-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-emerald-900/50 hover:shadow-emerald-500/25"
                title="Send message"
              >
                <Send size={18} className={loading ? 'animate-pulse' : ''} />
              </button>
            </div>

            {/* Quick tip */}
            <div className="text-center">
              <p className="text-xs text-zinc-500">
                Try: "Create a workout plan" or "Add study time at 2 PM"
              </p>
            </div>
          </div>
        </div>

        {/* Custom Styles */}
        <style jsx>{`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          @keyframes gentle-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
          .animate-gentle-bounce { animation: gentle-bounce 2s ease-in-out infinite; }
        `}</style>
      </div>
    </Modal>
  );
};

export default Chatbot;