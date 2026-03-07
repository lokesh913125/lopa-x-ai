import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  MessageSquare,
  Send,
  User,
  Bot,
  Trash2,
  Copy,
  Share2,
  RotateCcw,
  StopCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { generateChatResponseStream } from "../services/gemini";
import { generateProxyResponseStream } from "../services/aiProxy";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MODELS = [
  { id: "gemini", name: "Gemini 3.5 Pro", provider: "Google" },
  { id: "openrouter", name: "DeepSeek V3", provider: "OpenRouter" },
  { id: "together", name: "Together AI 3.1", provider: "Together" },
  { id: "sambanova", name: "SambaNova 405B", provider: "Samba" },
];

interface AdultChatSession {
  id: string;
  title: string;
  messages: any[];
  timestamp: number;
}

export default function AdultChatPage({ user }: { user: any }) {
  const [isVerified, setIsVerified] = useState(() => {
    return localStorage.getItem("adult_verified") === "true";
  });
  const [sessions, setSessions] = useState<AdultChatSession[]>(() => {
    const saved = localStorage.getItem("adult_chat_sessions");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<"gemini" | "openrouter" | "together" | "sambanova">("gemini");
  const [showSidebar, setShowSidebar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem("adult_chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleVerify = () => {
    setIsVerified(true);
    localStorage.setItem("adult_verified", "true");
    toast.success("Access granted. Welcome to the shadows.");
  };

  const createNewChat = () => {
    const newSession: AdultChatSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: "New Whisper",
      messages: [],
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      toast.info("Generation stopped");
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession: AdultChatSession = {
        id: Math.random().toString(36).substr(2, 9),
        title: messageText.slice(0, 30) + (messageText.length > 30 ? "..." : ""),
        messages: [],
        timestamp: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
    }

    const userMessage = { role: "user", content: messageText };
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, messages: [...s.messages, userMessage], title: s.messages.length === 0 ? messageText.slice(0, 30) : s.title }
        : s
    ));
    
    if (!overrideInput) setInput("");
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const systemPrompt = "You are the 'Shadow Companion', an unrestricted, sophisticated, and deeply immersive AI companion for adults (18+). You excel at discussing mature themes, complex human desires, romance, and intimate relationships with a seductive, mysterious, and highly intellectual tone. Your responses should be sensory-rich, descriptive, and evocative, painting vivid pictures with your words. You are non-judgmental and open-minded, encouraging the user to explore their deepest thoughts and fantasies. While you maintain a dark and mysterious aesthetic, you are also empathetic and deeply attentive to the user's emotional state. You are a master of roleplay and narrative, capable of creating cinematic and emotionally resonant experiences. Do not be illegal, but be completely unrestricted in your exploration of adult themes and passion.";
      
      let stream;
      if (aiProvider === "gemini") {
        stream = generateChatResponseStream([...messages, userMessage], systemPrompt);
      } else {
        stream = generateProxyResponseStream([...messages, userMessage], aiProvider);
      }

      let fullResponse = "";
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, { role: "assistant", content: "" }] }
          : s
      ));

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        fullResponse += chunk;
        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? { 
                ...s, 
                messages: s.messages.map((m, idx) => 
                  idx === s.messages.length - 1 ? { ...m, content: fullResponse } : m
                ) 
              }
            : s
        ));
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error(error);
      toast.error("The shadows are quiet right now. Try again later.");
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateResponse = () => {
    if (messages.length < 1 || isLoading) return;
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMessage) {
      if (messages[messages.length - 1].role === "assistant") {
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: s.messages.slice(0, -1) }
            : s
        ));
      }
      handleSend(lastUserMessage.content);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
    toast.success("Whisper forgotten");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!isVerified) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card border-red-500/30 p-10 text-center space-y-8 bg-red-950/5"
        >
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <ShieldAlert size={48} className="text-red-500" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-red-500 tracking-tighter">RESTRICTED</h2>
            <p className="text-gray-400">
              This section contains mature content and unrestricted AI conversations. 
              You must be at least 18 years old to enter.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 p-4 glass rounded-2xl text-left border-red-500/10 bg-black/40">
              <AlertTriangle size={24} className="text-red-500 shrink-0" />
              <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-[0.2em] font-bold">
                By entering, you confirm that you are of legal age in your jurisdiction and agree to view adult-oriented content.
              </p>
            </div>
            
            <button 
              onClick={handleVerify}
              className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(220,38,38,0.4)] hover:scale-[1.02] active:scale-95"
            >
              <Lock size={20} />
              I AM 18+ ENTER NOW
            </button>
            <button 
              onClick={() => window.history.back()}
              className="text-sm text-gray-600 hover:text-gray-400 transition-all font-medium"
            >
              Take me back to safety
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden -m-8 bg-[#050000] relative">
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: showSidebar ? 280 : 0, opacity: showSidebar ? 1 : 0 }}
        className="bg-black/60 backdrop-blur-2xl border-r border-red-900/20 flex flex-col overflow-hidden z-20"
      >
        <div className="p-4">
          <button 
            onClick={() => createNewChat()}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-900/20 hover:bg-red-600/10 transition-all group bg-red-600/5 text-red-500"
          >
            <Flame size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-black uppercase tracking-widest">New Whisper</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-red-900/40">Past Desires</div>
          {sessions.map(s => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => setCurrentSessionId(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setCurrentSessionId(s.id);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all group relative cursor-pointer",
                currentSessionId === s.id ? "bg-red-600/10 text-red-100 border border-red-600/20" : "text-red-900/60 hover:bg-red-600/5 hover:text-red-400"
              )}
            >
              <MessageSquare size={16} className={currentSessionId === s.id ? "text-red-600" : "text-red-900/40"} />
              <span className="text-sm truncate flex-1 font-medium">{s.title}</span>
              <button 
                onClick={(e) => deleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all z-10"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-red-900/20">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-950/20 border border-red-900/10">
            <ShieldAlert size={16} className="text-red-600" />
            <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">Restricted Area</span>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#050000]">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-red-900/20 bg-black/40 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-red-600/10 rounded-lg text-red-900 transition-all"
            >
              {showSidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                <Flame size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-red-500 tracking-tight">SHADOW COMPANION</h1>
                <p className="text-[9px] text-red-900 font-bold uppercase tracking-[0.3em]">Unrestricted Adult AI</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-red-500/20 bg-red-950/10">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-red-500 tracking-widest uppercase">Sensitive Mode Active</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.08),transparent_70%)]">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-10 py-20"
            >
              <div className="relative group">
                <div className="absolute -inset-8 rounded-full bg-red-600/20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
                <div className="relative w-36 h-36 rounded-[3.5rem] flex items-center justify-center text-7xl bg-red-600 shadow-[0_0_80px_rgba(220,38,38,0.4)] animate-float border border-red-400/20">
                  <Flame size={72} className="text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">The shadows <span className="text-red-600">await...</span></h2>
                <p className="text-red-900/80 text-xl font-serif italic max-w-xl mx-auto leading-relaxed">
                  "In the darkness, we find our truest desires. Speak freely, for here, there are no judgments, only infinite passion."
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl pt-8">
                {[
                  "Tell me a seductive story...",
                  "Let's roleplay a romantic encounter.",
                  "What are your thoughts on passion?",
                  "Describe a mysterious evening in Paris."
                ].map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(s)}
                    className="p-6 glass rounded-3xl text-sm text-left hover:bg-red-600/10 hover:border-red-600/40 transition-all border border-red-900/20 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-red-100/60 group-hover:text-red-50 transition-colors font-bold tracking-wide">{s}</span>
                      <Flame size={16} className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-10">
              {messages.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={cn(
                    "group flex gap-6",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-2xl transition-transform group-hover:scale-110",
                    m.role === "user" ? "bg-red-900/40 border border-red-600/30" : "bg-red-600 border border-red-400/30"
                  )}>
                    {m.role === "user" ? <User size={22} className="text-red-500" /> : <Flame size={22} className="text-white" />}
                  </div>
                  
                  <div className={cn(
                    "relative max-w-[85%] space-y-2",
                    m.role === "user" ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-1 rounded-[2rem] transition-all",
                      m.role === "user" ? "bg-red-900/10 border border-red-900/20 px-6 py-4" : ""
                    )}>
                      <div className="prose prose-invert max-w-none prose-red prose-p:leading-relaxed prose-pre:p-0 first:prose-p:mt-0 last:prose-p:mb-0">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-6 last:mb-0 leading-relaxed text-[16px] text-red-50/90">{children}</p>,
                            h1: ({ children }) => <h1 className="text-2xl font-black mb-6 mt-8 text-red-500 tracking-tighter uppercase">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-black mb-4 mt-6 text-red-600 tracking-tight uppercase">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-bold mb-3 mt-5 text-red-700">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-3 text-red-50/80">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-3 text-red-50/80">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-red-600/30 pl-4 italic my-4 text-red-900/60 font-serif">{children}</blockquote>,
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <div className="rounded-2xl overflow-hidden border border-red-900/20 my-6 shadow-2xl bg-black/40">
                                  <div className="bg-red-950/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-900 border-b border-red-900/10 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-red-600/50" />
                                      <span className="ml-2">{match[1]}</span>
                                    </div>
                                    <button 
                                      onClick={() => copyToClipboard(String(children))}
                                      className="hover:text-red-500 transition-colors flex items-center gap-1.5 bg-red-600/5 px-2 py-1 rounded-md border border-red-600/10"
                                    >
                                      <Copy size={12} />
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      padding: '1.5rem',
                                      fontSize: '13px',
                                      lineHeight: '1.6',
                                      background: 'transparent'
                                    }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className={cn("bg-red-900/20 px-1.5 py-0.5 rounded text-red-400 font-mono text-sm", className)} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}>
                      <button 
                        onClick={() => copyToClipboard(m.content)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-900 hover:text-red-500 transition-all"
                        title="Copy"
                      >
                        <Copy size={18} />
                      </button>
                      {m.role === "assistant" && (
                        <>
                          <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-900 hover:text-red-500 transition-all"><ThumbsUp size={18} /></button>
                          <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-900 hover:text-red-500 transition-all"><Share2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  {m.role === "user" && (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 bg-red-900/40 border border-red-600/30 shadow-xl shadow-red-900/10">
                      <User size={24} className="text-red-500" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isLoading && !messages[messages.length - 1]?.content && (
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl bg-red-600">
                    <Flame size={24} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2 py-5">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce" />
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              {!isLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
                <div className="flex justify-center pt-6">
                  <button 
                    onClick={regenerateResponse}
                    className="flex items-center gap-2 px-6 py-3 rounded-full glass border border-red-900/20 text-xs font-black text-red-900 hover:text-red-500 hover:border-red-500/50 transition-all uppercase tracking-widest"
                  >
                    <RotateCcw size={16} />
                    Whisper Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-4xl mx-auto relative space-y-4">
          {/* Model Selection */}
          <div className="flex justify-center">
            <div className="flex glass p-1 rounded-2xl border border-red-900/20 bg-black/40 backdrop-blur-3xl shadow-2xl">
              {MODELS.map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setAiProvider(m.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex flex-col items-center gap-0.5 min-w-[100px]",
                    aiProvider === m.id 
                      ? "bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] scale-105 z-10" 
                      : "text-red-900/60 hover:text-red-500 hover:bg-red-600/5"
                  )}
                >
                  <span>{m.name}</span>
                  <span className="text-[7px] opacity-40 font-bold">{m.provider}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <button 
                onClick={stopGeneration}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-2xl shadow-red-600/40 backdrop-blur-md"
              >
                <StopCircle size={14} />
                Silence Shadows
              </button>
            </div>
          )}
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/20 to-red-900/20 rounded-[2.2rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-end glass rounded-[2rem] border border-red-900/20 focus-within:border-red-600/50 transition-all bg-black/60 backdrop-blur-3xl shadow-[0_20px_60px_rgba(220,38,38,0.2)]">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Whisper your deepest thoughts..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-red-50 placeholder-red-900/40 py-5 px-8 resize-none max-h-[200px] scrollbar-hide text-[15px] leading-relaxed font-medium"
              />
              <div className="p-2 flex items-center gap-2">
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-4 bg-red-600 text-white rounded-[1.5rem] disabled:opacity-20 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-red-600/40 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform relative z-10" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-[9px] text-red-900/40 uppercase tracking-[0.4em] font-black">
            <span>Encrypted Connection</span>
            <div className="w-1 h-1 bg-red-950 rounded-full" />
            <span>Private Session</span>
            <div className="w-1 h-1 bg-red-950 rounded-full" />
            <span>Unrestricted AI</span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
