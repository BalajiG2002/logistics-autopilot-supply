import React, { useState } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  sender: 'USER' | 'COPILOT';
  text: string;
  timestamp: string;
}

interface CopilotChatProps {
  onSendMessage: (message: string) => Promise<string>;
  isProcessing: boolean;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ onSendMessage, isProcessing }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'COPILOT',
      text: 'Hello Ravi & Meena! I am your FreshMart Supply Chain Agent Copilot. I continuously monitor live orders, track supplier SLAs, detect missing documents, and orchestrate automated re-routing. How can I assist you right now?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const speakText = (text: string) => {
    if (!isSpeakingEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    try {
      const reply = await onSendMessage(text);
      const botMsg: Message = {
        id: `c-${Date.now()}`,
        sender: 'COPILOT',
        text: reply,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      speakText(reply);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'COPILOT',
        text: 'Sorry, I encountered an issue querying the agent state. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSend(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[600px]">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Conversational & Voice Supply Chain Copilot
            </h3>
            <span className="text-[11px] text-slate-500">
              Audio Agent · Real-time Gemini Logistics Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
            title={isSpeakingEnabled ? 'Mute voice audio output' : 'Enable voice audio output'}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            {isSpeakingEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium shrink-0">Quick Queries:</span>
        <button
          onClick={() => handleSend("What is the current status of PO-105 and why is it held up?")}
          className="whitespace-nowrap px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          PO-105 Status
        </button>
        <button
          onClick={() => handleSend("Why was Sunrise Rice Co. downgraded and which supplier takes precedence now?")}
          className="whitespace-nowrap px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          Sunrise Downgrade Reason
        </button>
        <button
          onClick={() => handleSend("Are there any missing commercial invoices blocking order closure right now?")}
          className="whitespace-nowrap px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          Check Missing Documents
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'USER';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                isUser ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`max-w-[80%] rounded-xl p-3.5 text-xs leading-relaxed ${
                isUser
                  ? 'bg-slate-900 text-white rounded-tr-xs'
                  : 'bg-slate-100 text-slate-800 rounded-tl-xs'
              }`}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                <span className={`block text-[10px] mt-1 ${isUser ? 'text-slate-400 text-right' : 'text-slate-500'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputText);
        }}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleMic}
          title={isListening ? 'Listening...' : 'Voice Dictation'}
          className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
            isListening
              ? 'bg-red-500 text-white border-red-500 animate-pulse'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Copilot about shipments, supplier health, or inventory..."
          disabled={isProcessing}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
