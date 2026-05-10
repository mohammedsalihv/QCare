import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  ChevronDown,
  Info,
  ShieldCheck,
  Zap,
  Clock,
  ArrowUpRight
} from 'lucide-react';

const JawdaAdvisor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I am your JAWDA Quality Advisor. I specialize in AOT, ASD, and Burn Services (BN) compliance for Abu Dhabi DOH-licensed facilities. How can I help you with your KPI reporting today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response based on the persona provided
    setTimeout(() => {
      let response = "";
      const lowerInput = input.toLowerCase();

      if (lowerInput.includes('burn') || lowerInput.includes('bn') || lowerInput.includes('tbsa')) {
        response = "For Burn Services (BN V4), remember that BN001 (VAE) requires patients to be mechanically ventilated for ≥4 calendar days. The day of intubation is Day 1. Are you tracking ventilator-associated events for a specific patient?";
      } else if (lowerInput.includes('dialysis') || lowerInput.includes('df') || lowerInput.includes('kt/v')) {
        response = "In the Dialysis Facilities (DF V10) module, performance is measured in 'patient-months'. For DF007 (Anemia), remember that an Hb > 120 g/L still meets the target if no ESA was administered in the previous month. Is your query regarding standard denominators or clinical targets?";
      } else if (lowerInput.includes('organ') || lowerInput.includes('transplant') || lowerInput.includes('aot')) {
        response = "In the Adult Organ Transplant (AOT V1.3) module, AOT001 measures 1-year patient survival. Remember that for AOT009 (Waitlist Mortality), kidney living and deceased donor categories are now merged. Is your query regarding survival rates or waitlist metrics?";
      } else if (lowerInput.includes('autism') || lowerInput.includes('asd')) {
        response = "Per ASD002, you must ensure both documentation conditions are met: the report must be in the EMR AND a copy must be provided to the parents within 42 calendar days of the initial assessment. Status: Requirement is mandatory for Diagnostic Hubs.";
      } else {
        response = "I can assist with specific KPI rules, inclusion/exclusion criteria, or benchmarks for AOT, ASD, Burn Services (BN), or Dialysis Facilities (DF). Is your question related to one of these specific JAWDA modules?";
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response, 
        timestamp: new Date(),
        isAdvisor: true
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-[#2dd4bf] rounded-3xl shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-50 border border-slate-800 group ${isOpen ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100'}`}
      >
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#2dd4bf] text-slate-900 text-[10px] font-black flex items-center justify-center rounded-full animate-bounce shadow-lg">
          AI
        </div>
        <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Advisor Panel */}
      <div className={`fixed bottom-8 right-8 w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden transition-all duration-500 z-50 border border-slate-100 ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-90 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#2dd4bf]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#2dd4bf]/20 border border-[#2dd4bf]/30 flex items-center justify-center">
                 <ShieldCheck className="w-6 h-6 text-[#2dd4bf]" />
              </div>
              <div>
                 <h3 className="text-sm font-black uppercase tracking-widest">JAWDA Advisor</h3>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#2dd4bf] rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Expert System Online</span>
                 </div>
              </div>
           </div>
           <button 
             onClick={() => setIsOpen(false)}
             className="p-2 hover:bg-white/10 rounded-xl transition-colors"
           >
              <X className="w-5 h-5 text-slate-400" />
           </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-slate-50/50"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-white border-slate-200 text-slate-400' : 'bg-slate-900 border-slate-800 text-[#2dd4bf]'}`}>
                     {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-[1.5rem] text-xs font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                     {msg.content}
                  </div>
               </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
               <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-[#2dd4bf] flex items-center justify-center">
                     <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-[1.5rem] rounded-tl-none flex gap-1">
                     <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                     <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-slate-100 bg-white">
           <div className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about AOT, ASD, or BN rules..."
                className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#2dd4bf] focus:ring-8 focus:ring-[#2dd4bf]/10 transition-all text-xs font-bold"
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-[#2dd4bf] rounded-xl hover:bg-slate-800 transition-all active:scale-95"
              >
                 <Send className="w-4 h-4" />
              </button>
           </div>
           <div className="mt-4 flex items-center justify-center gap-6">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                 <Zap className="w-3 h-3" /> Abu Dhabi DOH Compliant
              </span>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                 <Clock className="w-3 h-3" /> Real-time Guidance
              </span>
           </div>
        </div>
      </div>
    </>
  );
};

export default JawdaAdvisor;
