import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, Sparkles, User, Bot, Trash2, Settings2, Plus, 
  MessageSquare, Cpu, ChevronLeft, ChevronRight, 
  History, MoreVertical, Share2, Copy, Check,
  RotateCcw, Square, StopCircle, ThumbsUp, ThumbsDown
} from "lucide-react";
import { PERSONAS } from "../constants";
import { generateChatResponseStream } from "../services/gemini";
import { generateGroqResponseStream } from "../services/groq";
import { generateProxyResponseStream } from "../services/aiProxy";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MODELS = [
  { id: "gemini", name: "Gemini 3.5 Flash", provider: "Google" },
  { id: "groq", name: "Groq Llama 3.3", provider: "Groq" },
  { id: "openrouter", name: "DeepSeek V3", provider: "OpenRouter" },
  { id: "together", name: "Together AI 3.1", provider: "Together" },
  { id: "sambanova", name: "SambaNova 405B", provider: "Samba" },
  { id: "deepai", name: "DeepAI Pro", provider: "DeepAI" },
  { id: "replicate", name: "Replicate V2", provider: "Replicate" },
];

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  personaId: string;
  timestamp: number;
}

export default function ChatPage({ user }: { user: any }) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("chat_sessions");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[2]); // Default to Tech Expert
  const [showSidebar, setShowSidebar] = useState(true);
  const [aiProvider, setAiProvider] = useState<"gemini" | "groq" | "openrouter" | "together" | "sambanova" | "deepai" | "replicate">("gemini");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const createNewChat = (persona = selectedPersona) => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: "New Chat",
      messages: [],
      personaId: persona.id,
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedPersona(persona);
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
      const newSession: ChatSession = {
        id: Math.random().toString(36).substr(2, 9),
        title: messageText.slice(0, 30) + (messageText.length > 30 ? "..." : ""),
        messages: [],
        personaId: selectedPersona.id,
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
      let stream;
      if (aiProvider === "gemini") {
        stream = generateChatResponseStream([...messages, userMessage], selectedPersona.systemPrompt);
      } else if (aiProvider === "groq") {
        stream = generateGroqResponseStream([...messages, userMessage]);
      } else {
        stream = generateProxyResponseStream([...messages, userMessage], aiProvider);
      }

      let fullResponse = "";
      // Add empty assistant message to start streaming into
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
      
      const errorMessage = error.message || "";
      toast.error(errorMessage || "Failed to get response from AI.");
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateResponse = () => {
    if (messages.length < 1 || isLoading) return;
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMessage) {
      // Remove last assistant message if it exists
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
    toast.success("Chat deleted");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden -m-8 relative">
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: showSidebar ? 280 : 0, opacity: showSidebar ? 1 : 0 }}
        className="bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col overflow-hidden z-20"
      >
        <div className="p-4">
          <button 
            onClick={() => createNewChat()}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all group bg-white/5"
          >
            <Plus size={18} className="text-primary group-hover:rotate-90 transition-transform" />
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">History</div>
          {sessions.map(s => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setCurrentSessionId(s.id);
                const persona = PERSONAS.find(p => p.id === s.personaId) || PERSONAS[2];
                setSelectedPersona(persona);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setCurrentSessionId(s.id);
                  const persona = PERSONAS.find(p => p.id === s.personaId) || PERSONAS[2];
                  setSelectedPersona(persona);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all group relative cursor-pointer",
                currentSessionId === s.id ? "bg-primary/10 text-white border border-primary/20" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <MessageSquare size={16} className={currentSessionId === s.id ? "text-primary" : "text-gray-500"} />
              <span className="text-sm truncate flex-1">{s.title}</span>
              <button 
                onClick={(e) => deleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all z-10"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Personas</div>
          <div className="grid grid-cols-4 gap-2">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => createNewChat(p)}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110",
                  selectedPersona.id === p.id ? "ring-2 ring-primary ring-offset-2 ring-offset-black" : "opacity-50 hover:opacity-100",
                  p.color.replace('from-', 'bg-').split(' ')[0] // Use first color for small icons
                )}
                title={p.name}
              >
                {p.avatar}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#0a0a0a]">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-all"
            >
              {showSidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br shadow-lg", selectedPersona.color)}>
                {selectedPersona.avatar}
              </div>
              <div>
                <h2 className="text-sm font-bold">{selectedPersona.name}</h2>
                <p className="text-[10px] text-gray-500">{aiProvider.toUpperCase()} Model</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model selection moved to input area */}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-10 py-20"
              >
                <div className="relative group">
                  <div className={cn("absolute -inset-4 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500", selectedPersona.color)} />
                  <div className={cn("relative w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-6xl bg-gradient-to-br shadow-2xl animate-float", selectedPersona.color)}>
                    {selectedPersona.avatar}
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-tight">
                    Hello, {user.name.split(' ')[0]}
                  </h1>
                  <p className="text-gray-500 text-xl font-medium max-w-lg mx-auto leading-relaxed">
                    I'm your <span className={cn("bg-clip-text text-transparent bg-gradient-to-r font-bold", selectedPersona.color)}>{selectedPersona.name}</span>. 
                    {selectedPersona.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  {selectedPersona.starters.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(s)}
                      className="p-5 glass rounded-3xl text-sm text-left hover:bg-white/5 hover:border-primary/30 transition-all border border-white/5 group relative overflow-hidden text-gray-400 hover:text-white"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center justify-between relative z-10">
                        <span className="font-medium">{s}</span>
                        <Sparkles size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
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
                      "group flex gap-5",
                      m.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg",
                      m.role === "user" ? "bg-primary/20 border border-primary/30" : selectedPersona.color
                    )}>
                      {m.role === "user" ? <User size={18} className="text-primary" /> : <Bot size={18} />}
                    </div>
                    
                    <div className={cn(
                      "relative max-w-[85%] space-y-2",
                      m.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-1 rounded-3xl transition-all",
                        m.role === "user" ? "bg-white/5 border border-white/10 px-5 py-3.5" : ""
                      )}>
                        <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 first:prose-p:mt-0 last:prose-p:mb-0">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-6 last:mb-0 leading-relaxed text-[15px] text-gray-200/90">{children}</p>,
                              h1: ({ children }) => <h1 className="text-2xl font-bold mb-6 mt-8 text-white">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl font-bold mb-4 mt-6 text-white">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg font-bold mb-3 mt-5 text-white">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-3 text-gray-200/90">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-3 text-gray-200/90">{children}</ol>,
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-gray-400">{children}</blockquote>,
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <div className="rounded-xl overflow-hidden border border-white/10 my-6 shadow-2xl">
                                    <div className="bg-white/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-white/10 flex justify-between items-center backdrop-blur-md">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                                        <span className="ml-2">{match[1]}</span>
                                      </div>
                                      <button 
                                        onClick={() => copyToClipboard(String(children))}
                                        className="hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5"
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
                                  <code className={cn("bg-white/10 px-1.5 py-0.5 rounded text-primary font-mono text-sm", className)} {...props}>
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
                        "flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity",
                        m.role === "user" ? "justify-end" : "justify-start"
                      )}>
                        <button 
                          onClick={() => copyToClipboard(m.content)}
                          className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-300 transition-all"
                          title="Copy"
                        >
                          <Copy size={16} />
                        </button>
                        {m.role === "assistant" && (
                          <>
                            <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-300 transition-all" title="Good response">
                              <ThumbsUp size={16} />
                            </button>
                            <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-300 transition-all" title="Bad response">
                              <ThumbsDown size={16} />
                            </button>
                            <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-300 transition-all" title="Share">
                              <Share2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {m.role === "user" && (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 bg-primary/20 border border-primary/30 shadow-lg shadow-primary/10">
                        <User size={20} className="text-primary" />
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isLoading && !messages[messages.length - 1]?.content && (
                  <div className="flex gap-6">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", selectedPersona.color)}>
                      <Bot size={20} />
                    </div>
                    <div className="flex items-center gap-1.5 py-4">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                {!isLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
                  <div className="flex justify-center pt-4">
                    <button 
                      onClick={regenerateResponse}
                      className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:border-primary/50 transition-all"
                    >
                      <RotateCcw size={14} />
                      Regenerate Response
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="max-w-4xl mx-auto relative space-y-4">
            {/* Model Selection */}
            <div className="flex justify-center">
              <div className="flex glass p-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-3xl overflow-x-auto max-w-full scrollbar-hide shadow-2xl">
                {MODELS.map((m) => (
                  <button 
                    key={m.id}
                    onClick={() => setAiProvider(m.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex flex-col items-center gap-0.5 whitespace-nowrap min-w-[100px]",
                      aiProvider === m.id 
                        ? "bg-primary text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] scale-105 z-10" 
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
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
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-500 hover:bg-red-500/20 transition-all shadow-2xl backdrop-blur-md uppercase tracking-widest"
                >
                  <StopCircle size={14} />
                  Stop Generation
                </button>
              </div>
            )}
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2.2rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-end glass rounded-[2rem] border border-white/10 focus-within:border-primary/50 transition-all bg-white/5 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <textarea
                  ref={inputRef}
                  rows={1}
                  placeholder={`Ask ${selectedPersona.name} anything...`}
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
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 py-5 px-8 resize-none max-h-[200px] scrollbar-hide text-[15px] leading-relaxed font-medium"
                />
                <div className="p-2 flex items-center gap-2">
                  <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-4 bg-primary text-white rounded-[1.5rem] disabled:opacity-20 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform relative z-10" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-[9px] text-gray-600 uppercase tracking-[0.4em] font-black">
              <span>Privacy Guaranteed</span>
              <div className="w-1 h-1 bg-gray-800 rounded-full" />
              <span>Multi-Model AI</span>
              <div className="w-1 h-1 bg-gray-800 rounded-full" />
              <span>Advanced Reasoning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
