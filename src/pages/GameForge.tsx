import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gamepad2, Send, Sparkles, Trash2, Maximize2, RotateCcw, Code, Play, 
  Download, CheckCircle2, AlertCircle, Upload, Image as ImageIcon, 
  Music, X, FileIcon, Volume2, Eye, Share2, Globe, Copy, ExternalLink
} from "lucide-react";
import { cn } from "../lib/utils";
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

interface GameAsset {
  id: string;
  name: string;
  type: 'image' | 'audio';
  data: string; // Base64
  size: number;
}

export default function GameForge({ user }: { user: any }) {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("Arcade");
  const [style, setStyle] = useState("Neon / Cyberpunk");
  const [complexity, setComplexity] = useState("Medium");
  const [physics, setPhysics] = useState("Arcade");
  const [controlType, setControlType] = useState("Keyboard + Mouse");
  const [mechanics, setMechanics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<{key: string, action: string}[]>([]);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [assets, setAssets] = useState<GameAsset[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | File[]) => {
    const newAssets: GameAsset[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB per asset.`);
        continue;
      }

      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : null;
      if (!type) {
        toast.error(`${file.name} is not a supported format (Images/Audio only).`);
        continue;
      }

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newAssets.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type,
        data: base64,
        size: file.size
      });
    }

    setAssets(prev => [...prev, ...newAssets]);
    if (newAssets.length > 0) toast.success(`Added ${newAssets.length} assets.`);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const generateGame = async () => {
    if (!prompt.trim() || isGenerating) return;

    if (prompt.trim().length < 10) {
      toast.error("Your prompt is a bit too short. Please describe your game idea in more detail for better results.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Forging your game with Gemini 3.1 Pro... This might take a minute.");
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Generation timed out")), 120000) // 2 minute timeout
    );

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      const assetContext = assets.length > 0 
        ? `\nAVAILABLE ASSETS (Already embedded as Base64 variables in the code):
${assets.map(a => `- Name: "${a.name}", Type: ${a.type}, Variable Name: "${a.name.replace(/[^a-zA-Z0-9]/g, '_')}"`).join('\n')}`
        : "";

      const systemPrompt = `You are a world-class game designer and senior web developer. Your task is to create a high-quality, polished, and fully functional single-file web game.

CORE REQUIREMENTS:
- Self-contained: One HTML file including CSS and JS.
- Visual Excellence: Use Tailwind CSS for UI, and high-quality Canvas rendering or DOM animations for gameplay.
- Polish: Add "juice" - screen shake, particle effects, smooth transitions, and sound effects.
- Mechanics: Implement robust game loops, state management (Start, Playing, Game Over, Paused), scoring systems, and progressive difficulty.
- Physics Engine: ${physics}.
- Control Scheme: ${controlType}.
- Complexity Level: ${complexity}.
- Specific Mechanics to include: ${mechanics || "Standard for genre"}.
- Responsiveness: The game must work on both desktop and mobile.
${assetContext}

ASSET USAGE:
If assets are provided, you MUST use them. Reference them by their exact variable names which are already defined in the code I will provide.
For images, use them in your Canvas drawing or as <img> src.
For audio, use them with the Web Audio API or <audio> tags.

OUTPUT FORMAT:
Return a JSON object with:
1. "html": The complete, production-ready HTML code.
2. "instructions": Array of { "key": string, "action": string }.

Return ONLY the JSON object. No markdown, no commentary.`;

      // Construct the asset data string to be injected into the code
      const assetDataString = assets.length > 0 
        ? `\n\n// --- EMBEDDED ASSETS ---\n${assets.map(a => `const ${a.name.replace(/[^a-zA-Z0-9]/g, '_')} = "${a.data}";`).join('\n')}\n// ------------------------\n\n`
        : "";

      const generatePromise = ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          { role: "user", parts: [{ text: `Create a ${complexity} complexity ${genre} game in ${style} style with ${physics} physics and ${controlType} controls. Idea: ${prompt}. Key mechanics: ${mechanics}. 

IMPORTANT: I have provided some assets below. You MUST use them in the game. I have already defined them as constants in the script section of the HTML. Use them by their variable names.

${assetDataString}` }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        }
      });

      const response = await Promise.race([generatePromise, timeoutPromise]) as any;

      let data;
      try {
        data = JSON.parse(response.text || "{}");
      } catch (e) {
        throw new Error("AI could not understand the prompt (Invalid JSON structure)");
      }

      if (!data.html || data.html.length < 200) {
        throw new Error("AI could not understand the prompt (Incomplete game code)");
      }

      // Inject asset data into the generated HTML if it's not already there
      let finalHtml = data.html;
      if (assets.length > 0 && !finalHtml.includes("// --- EMBEDDED ASSETS ---")) {
        finalHtml = finalHtml.replace("<script>", `<script>\n${assetDataString}`);
      }

      setGameCode(finalHtml.trim());
      setInstructions(data.instructions || []);
      setActiveTab("preview");
      toast.success("Game forged successfully!", { id: toastId });
    } catch (error: any) {
      console.error("Game Generation Error:", error);
      
      let errorMessage = "Failed to generate game. Please try again.";
      
      if (error.message.includes("Generation timed out")) {
        errorMessage = "Generation timed out. The game idea might be too complex or the server is busy.";
      } else if (error.message.includes("understand the prompt")) {
        errorMessage = "AI could not understand the prompt. Please try describing your idea more clearly.";
      } else if (error.message.includes("safety") || error.message.includes("blocked")) {
        errorMessage = "Generation failed: The prompt or output was flagged by safety filters.";
      } else if (assets.length > 0 && (error.message.includes("asset") || error.message.includes("Base64") || error.message.includes("too large"))) {
        errorMessage = "Asset processing failed. Try using smaller images or fewer assets.";
      } else if (error.message.includes("quota") || error.message.includes("429")) {
        errorMessage = "API limit reached. Please wait a minute before trying again.";
      } else if (error.message.includes("500") || error.message.includes("503") || error.message.includes("server error")) {
        errorMessage = "AI Server is currently overloaded. Please try again in a few moments.";
      } else if (error.message.includes("fetch") || error.message.includes("network")) {
        errorMessage = "Network error: Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadGame = () => {
    if (!gameCode) return;
    try {
      const blob = new Blob([gameCode], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${prompt.slice(0, 20).replace(/\s+/g, "_")}_game.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Game downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download game.");
    }
  };

  const publishGame = async () => {
    if (!gameCode || isPublishing) return;

    setIsPublishing(true);
    const toastId = toast.loading("Publishing your game to the world...");
    
    try {
      const gameId = Math.random().toString(36).substring(2, 10);
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: gameId,
          userId: user.id,
          title: prompt.slice(0, 50) || "Untitled AI Game",
          code: gameCode,
          instructions: instructions
        })
      });

      if (!response.ok) throw new Error("Failed to publish game");

      setPublishedId(gameId);
      setShowShareModal(true);
      toast.success("Game published successfully!", { id: toastId });
    } catch (error) {
      console.error("Publish Error:", error);
      toast.error("Failed to publish game. Please try again.", { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gamepad2 className="text-primary" />
            AI Game Forge
          </h1>
          <p className="text-gray-400">Turn your ideas into playable games instantly</p>
        </div>
        {gameCode && (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setGameCode(null);
                setInstructions([]);
              }}
              className="p-2 glass rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"
              title="Reset"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        )}
      </div>

      {!gameCode ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center space-y-8 py-12"
        >
          <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(139,92,246,0.3)]">
            <Gamepad2 size={48} className="text-primary animate-pulse" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">What game should we build?</h2>
            <p className="text-gray-400">Describe your game idea in detail. For example: "A space shooter where you collect gems" or "A simple 2D platformer with a neon theme".</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-2">Genre</label>
              <select 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full glass rounded-xl p-3 bg-black/20 border border-white/10 text-sm outline-none focus:ring-2 ring-primary/50 hover:border-primary/30 transition-all cursor-pointer"
              >
                {["Arcade", "Platformer", "Puzzle", "RPG", "Strategy", "Shooter", "Racing", "Adventure"].map(g => (
                  <option key={g} value={g} className="bg-gray-900">{g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-2">Visual Style</label>
              <select 
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full glass rounded-xl p-3 bg-black/20 border border-white/10 text-sm outline-none focus:ring-2 ring-primary/50 hover:border-primary/30 transition-all cursor-pointer"
              >
                {["Neon / Cyberpunk", "Minimalist", "Retro Pixel Art", "Vibrant / Cartoon", "Dark / Moody", "Sketch / Hand-drawn", "Futuristic / Clean"].map(s => (
                  <option key={s} value={s} className="bg-gray-900">{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-2">Complexity</label>
              <select 
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                className="w-full glass rounded-xl p-3 bg-black/20 border border-white/10 text-sm outline-none focus:ring-2 ring-primary/50 hover:border-primary/30 transition-all cursor-pointer"
              >
                {["Simple", "Medium", "Advanced"].map(c => (
                  <option key={c} value={c} className="bg-gray-900">{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-2">Physics</label>
              <select 
                value={physics}
                onChange={(e) => setPhysics(e.target.value)}
                className="w-full glass rounded-xl p-3 bg-black/20 border border-white/10 text-sm outline-none focus:ring-2 ring-primary/50 hover:border-primary/30 transition-all cursor-pointer"
              >
                {["Arcade", "Realistic", "Floaty", "Heavy", "No Gravity"].map(p => (
                  <option key={p} value={p} className="bg-gray-900">{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-2">Controls</label>
              <select 
                value={controlType}
                onChange={(e) => setControlType(e.target.value)}
                className="w-full glass rounded-xl p-3 bg-black/20 border border-white/10 text-sm outline-none focus:ring-2 ring-primary/50 hover:border-primary/30 transition-all cursor-pointer"
              >
                {["Keyboard + Mouse", "Keyboard Only", "Mouse Only", "Touch (Mobile)", "Gamepad", "WASD Only", "Arrow Keys", "One-Button"].map(c => (
                  <option key={c} value={c} className="bg-gray-900">{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-2">Custom Mechanics</label>
              <input
                type="text"
                value={mechanics}
                onChange={(e) => setMechanics(e.target.value)}
                placeholder="e.g. Inventory, Levels..."
                className="w-full glass rounded-xl p-3 bg-black/20 border border-white/10 text-sm outline-none focus:ring-2 ring-primary/50 hover:border-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Game Assets (Optional)</label>
              <div className="flex gap-4">
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <ImageIcon size={10} /> Images
                </span>
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Music size={10} /> Audio
                </span>
              </div>
            </div>

            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={cn(
                "relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-4",
                isDragging 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-white/5 bg-white/5 hover:border-white/10"
              )}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                multiple
                accept="image/*,audio/*"
                className="hidden"
              />
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 w-full">
                <AnimatePresence mode="popLayout">
                  {assets.map((asset) => (
                    <motion.div
                      key={asset.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="aspect-square glass rounded-xl relative group overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
                    >
                      {asset.type === 'image' ? (
                        <img 
                          src={asset.data} 
                          alt={asset.name} 
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-primary/5">
                          <Music size={24} className="text-primary" />
                          <span className="text-[8px] text-gray-500 px-2 truncate w-full text-center">{asset.name}</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => removeAsset(asset.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/80 backdrop-blur-sm">
                        <p className="text-[8px] font-medium truncate text-white/80">{asset.name}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Upload size={20} className="text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary uppercase tracking-widest">Add Asset</span>
                </button>
              </div>

              {assets.length === 0 && !isDragging && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-sm text-gray-500 font-medium">Drag & drop assets here or click to browse</p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Max 5MB per file • PNG, JPG, MP3, WAV</p>
                </div>
              )}
            </div>
          </div>

          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your game idea..."
              className="w-full h-40 glass rounded-2xl p-6 text-lg focus:ring-2 ring-primary/50 outline-none transition-all resize-none bg-white/5 border border-white/10 group-hover:border-white/20"
            />
            <button
              onClick={generateGame}
              disabled={!prompt.trim() || isGenerating}
              className="absolute bottom-4 right-4 px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-primary/20 group"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Forging...
                </>
              ) : (
                <>
                  <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                  Forge Game
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {["Space Invaders Clone", "Neon Snake Game", "Dino Jump Clone"].map((idea) => (
              <button
                key={idea}
                onClick={() => setPrompt(idea)}
                className="p-4 glass rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
              >
                {idea}
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-16rem)]">
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex items-center gap-2 glass p-1 rounded-xl w-fit">
              <button 
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                  activeTab === "preview" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                <Play size={16} />
                Preview
              </button>
              <button 
                onClick={() => setActiveTab("code")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                  activeTab === "code" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                <Code size={16} />
                Source Code
              </button>
            </div>

            <div className="flex-1 glass rounded-2xl overflow-hidden relative bg-white/5 border border-white/10">
              {activeTab === "preview" ? (
                <iframe 
                  srcDoc={gameCode || ""}
                  className="w-full h-full bg-white"
                  title="Generated Game"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                />
              ) : (
                <pre className="w-full h-full p-6 overflow-auto text-xs font-mono text-gray-300">
                  {gameCode}
                </pre>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-all group"
            >
              <h3 className="font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                <Sparkles size={18} className="text-primary" />
                Game Info
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-400 italic">"{prompt}"</p>
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Genre</span>
                  <span className="text-primary">{genre}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Style</span>
                  <span className="text-primary">{style}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Complexity</span>
                  <span className="text-primary">{complexity}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Physics</span>
                  <span className="text-primary">{physics}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Controls</span>
                  <span className="text-primary">{controlType}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Engine</span>
                  <span className="text-primary">Vanilla JS / HTML5</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Styling</span>
                  <span className="text-primary">Tailwind CSS</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-all group"
            >
              <h3 className="font-bold group-hover:text-primary transition-colors">Controls</h3>
              <div className="space-y-2">
                {instructions.length > 0 ? (
                  instructions.map((inst, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="min-w-[1.5rem] h-6 px-1 glass rounded flex items-center justify-center text-[10px] font-mono">
                        {inst.key}
                      </div>
                      <span>{inst.action}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">No specific controls detected.</p>
                )}
              </div>
            </motion.div>

            <button 
              onClick={downloadGame}
              className="w-full py-3 glass rounded-2xl text-sm font-bold hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2 border border-emerald-500/20 active:scale-95 group"
            >
              <Download size={16} className="group-hover:-translate-y-1 transition-transform" />
              Download Game (.html)
            </button>

            <button 
              onClick={publishGame}
              disabled={isPublishing}
              className="w-full py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isPublishing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Globe size={16} />
              )}
              Publish & Share Link
            </button>

            <button 
              onClick={() => {
                setGameCode(null);
                setInstructions([]);
                setPublishedId(null);
              }}
              className="w-full py-4 glass rounded-2xl text-sm font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2 border border-white/5 active:scale-95 group"
            >
              <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              Forge New Game
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && publishedId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass max-w-md w-full p-8 rounded-3xl space-y-6 relative border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.2)]"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe size={32} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Game Published!</h2>
                <p className="text-gray-400 text-sm">Your game is now live and ready to be played by anyone with the link.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Shareable Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 glass bg-black/40 rounded-xl p-3 text-sm font-mono text-primary truncate border border-white/5">
                      {window.location.origin}/play/{publishedId}
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/play/${publishedId}`);
                        toast.success("Link copied!");
                      }}
                      className="p-3 glass rounded-xl hover:bg-primary/20 hover:text-primary transition-all border border-white/5"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={`${window.location.origin}/play/${publishedId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 glass rounded-xl hover:bg-white/10 transition-all text-sm font-bold border border-white/5"
                  >
                    <Eye size={16} />
                    View Live
                  </a>
                  <button 
                    onClick={() => {
                      const text = `Check out this game I built with AI on Lopa X! 🎮\n\n${window.location.origin}/play/${publishedId}`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 p-3 glass rounded-xl hover:bg-white/10 transition-all text-sm font-bold border border-white/5"
                  >
                    <Share2 size={16} />
                    Tweet It
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <ExternalLink size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Itch.io Ready</p>
                    <p className="text-[10px] text-gray-400">You can also upload the downloaded .html file directly to Itch.io as a web game!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
