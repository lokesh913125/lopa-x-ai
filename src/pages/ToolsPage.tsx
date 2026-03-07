import { useState } from "react";
import { motion } from "motion/react";
import { 
  Wand2, 
  Search, 
  Copy, 
  Check, 
  History, 
  Sparkles, 
  Youtube, 
  Instagram, 
  Linkedin, 
  Mail, 
  FileText, 
  Lightbulb, 
  Type, 
  BarChart, 
  Bug, 
  Terminal, 
  Database, 
  Dumbbell, 
  Utensils, 
  Map,
  Code
} from "lucide-react";
import { TOOLS } from "../constants";
import { generateChatResponse } from "../services/gemini";
import { cn } from "../lib/utils";

const ICON_MAP: Record<string, any> = {
  Youtube, Instagram, Linkedin, Mail, FileText, Lightbulb, Type, BarChart, Bug, Terminal, Database, Dumbbell, Utensils, Map, Code
};

export default function ToolsPage({ user }: { user: any }) {
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredTools = TOOLS.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const response = await generateChatResponse([
        { role: "user", content: `${selectedTool.prompt}\n\nInput: ${input}` }
      ], "You are a specialized AI micro-tool. Provide high-quality, structured output based on the user's input. Be concise and professional.");
      setOutput(response || "");
    } catch (error) {
      console.error(error);
      setOutput("Error generating content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wand2 className="text-primary" />
            AI Micro-Tools
          </h1>
          <p className="text-gray-400">50+ specialized tools for every task</p>
        </div>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search tools or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full input-glass pl-10"
          />
        </div>
      </div>

      {selectedTool ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-8"
        >
          {/* Input Section */}
          <div className="glass-card space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  {(() => {
                    const Icon = ICON_MAP[selectedTool.icon] || Wand2;
                    return <Icon size={20} />;
                  })()}
                </div>
                <div>
                  <h3 className="font-bold">{selectedTool.name}</h3>
                  <p className="text-xs text-gray-400">{selectedTool.category}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedTool(null);
                  setInput("");
                  setOutput("");
                }}
                className="text-sm text-gray-500 hover:text-white"
              >
                Back to Library
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Your Input</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter details here..."
                className="w-full input-glass min-h-[200px] resize-none"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!input.trim() || isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Content
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="glass-card flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <History size={18} className="text-primary" />
                Output
              </h3>
              {output && (
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-all"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Output"}
                </button>
              )}
            </div>
            <div className="flex-1 glass rounded-xl p-4 overflow-y-auto bg-black/20 font-mono text-sm whitespace-pre-wrap">
              {output || (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 italic">
                  <Sparkles size={32} className="mb-4 opacity-20" />
                  Generated content will appear here
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <motion.button
              layout
              key={tool.id}
              onClick={() => setSelectedTool(tool)}
              className="glass-card text-left group hover:border-primary/50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                {(() => {
                  const Icon = ICON_MAP[tool.icon] || Wand2;
                  return <Icon size={20} />;
                })()}
              </div>
              <h3 className="font-bold text-sm mb-1">{tool.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{tool.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{tool.category}</span>
                <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-all">Use Tool →</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
