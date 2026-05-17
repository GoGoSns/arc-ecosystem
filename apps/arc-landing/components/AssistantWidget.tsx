'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: 'assistant', content: 'Hello! I am your Arc Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [canUseSTT, setCanUseSTT] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const inputRef = useRef('');
  const panelId = 'arc-assistant-panel';
  const titleId = 'arc-assistant-title';

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Speech Recognition and TTS Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setCanUseSTT(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        
        if (interim) {
          setInterimTranscript(interim);
          setInput(interim);
        }
        
        if (final) {
          setInput(final);
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'network' && retryCountRef.current < 2) {
          retryCountRef.current++;
          setRetryCount(retryCountRef.current);
          setErrorMessage('Reconnecting...');
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              setIsListening(false);
              setErrorMessage('Network issue, please try again');
            }
          }, 1000);
          return;
        }
        
        setIsListening(false);
        setRetryCount(0);
        retryCountRef.current = 0;
        
        if (event.error === 'no-speech') {
          setErrorMessage("I didn't hear anything");
        } else if (event.error === 'not-allowed') {
          setErrorMessage('Please allow microphone access');
        } else if (event.error === 'network') {
          setErrorMessage('Network issue, please try again');
        } else if (event.error !== 'aborted') {
          setErrorMessage('Voice input error');
        }
        
        setTimeout(() => setErrorMessage(''), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    }

    const savedTTS = localStorage.getItem('arc-assistant-tts-enabled');
    if (savedTTS === 'true') {
      setTtsEnabled(true);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakText = useCallback((text: string) => {
    if (!ttsEnabled) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setErrorMessage('');
    try {
      setInput('');
      setInterimTranscript('');
      setRetryCount(0);
      retryCountRef.current = 0;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
    setIsListening(false);

    // Wait 300ms for final result to arrive
    setTimeout(() => {
      const textToSend = inputRef.current.trim();
      if (textToSend) {
        setInput('');
        setInterimTranscript('');
        handleSubmit(undefined, textToSend);
      }
    }, 300);
  };

  const toggleTTS = () => {
    const newState = !ttsEnabled;
    setTtsEnabled(newState);
    localStorage.setItem('arc-assistant-tts-enabled', String(newState));
    if (!newState) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const messageToSend = overrideInput || input;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage = messageToSend.trim();
    const nextHistory: AssistantMessage[] = [...messages, { role: 'user', content: userMessage }];
    setInput('');
    setMessages(nextHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const reply = data.reply as string;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      if (ttsEnabled) {
        speakText(reply);
      }
    } catch (error) {
      console.error('Error calling assistant:', error);
      const errMsg = 'Could not connect to AI. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
      if (ttsEnabled) {
        speakText(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div 
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 md:w-[400px]"
          style={{ background: 'var(--bg)', backgroundColor: '#0a0a0a' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-zinc-900 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-black">
                <Bot size={18} />
              </div>
              <div>
                <h3 id={titleId} className="text-sm font-bold text-white">Arc Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <span className="text-[10px] text-zinc-400">Online</span>
                  {isSpeaking && (
                    <div className="ml-1 flex h-3 items-end gap-0.5" aria-hidden="true">
                      <div className="h-1.5 w-0.5 animate-[bounce_1s_infinite] bg-[var(--accent)]" />
                      <div className="h-3 w-0.5 animate-[bounce_1s_infinite_0.2s] bg-[var(--accent)]" />
                      <div className="h-2 w-0.5 animate-[bounce_1s_infinite_0.4s] bg-[var(--accent)]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleTTS}
                aria-label={ttsEnabled ? 'Disable voice output' : 'Enable voice output'}
                aria-pressed={ttsEnabled}
                className={`rounded-lg p-1.5 transition-colors ${ttsEnabled ? 'text-[var(--accent)]' : 'text-zinc-500'} hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
              >
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 space-y-4 overflow-y-auto bg-black/20 p-4"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-atomic="false"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-[var(--accent)] text-black rounded-tr-none' 
                    : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none text-zinc-400">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {errorMessage && !isListening && (
            <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400" role="alert" aria-live="assertive">
              {errorMessage}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-[var(--border)] bg-zinc-900 p-4">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  aria-label="Message to Arc Assistant"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening 
                      ? '🎤 Listening... release to send'
                      : 'Type a message or hold mic to speak'
                  }
                  className={`w-full bg-zinc-800 border ${
                    isListening 
                      ? (retryCount > 0 ? 'border-yellow-500/50' : 'border-red-500/50') 
                      : 'border-zinc-700'
                  } text-white rounded-xl py-2 pl-4 pr-10 outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors text-sm ${
                    interimTranscript ? 'text-zinc-400 italic' : ''
                  }`}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--accent)] transition-opacity disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Send size={18} />
                </button>
              </div>
              {canUseSTT && (
                <button
                  type="button"
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  onMouseLeave={stopListening}
                  onTouchStart={startListening}
                  onTouchEnd={stopListening}
                  aria-label={isListening ? 'Release microphone to send' : 'Hold microphone to speak'}
                  aria-pressed={isListening}
                  className={`p-2 rounded-xl transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                    isListening 
                      ? (retryCount > 0 
                          ? 'bg-yellow-500/20 text-yellow-500 animate-pulse scale-110' 
                          : 'bg-red-500/20 text-red-500 animate-pulse scale-110')
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 text-center opacity-50">
              {isListening ? "Release the button to send" : "Hold the mic button and speak"}
            </p>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        style={{ background: 'var(--accent)', color: '#000' }}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>
    </div>
  );
}
