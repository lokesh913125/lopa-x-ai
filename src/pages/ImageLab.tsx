import { useState } from "react";
import { motion } from "motion/react";
import { 
  ImageIcon, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Maximize2, 
  Layers, 
  Palette, 
  Layout, 
  AlertCircle,
  Cpu,
  Settings2,
  Key
} from "lucide-react";
import { generateImage } from "../services/gemini";
import { cn } from "../lib/utils";
import { toast } from "sonner";

const MODELS = [
  { id: "gemini-2.5-flash-image", name: "Nano Banana", description: "Fast & Balanced", icon: <Cpu size={16} /> },
  { id: "gemini-3.1-flash-image-preview", name: "Nano Banana 2", description: "High Quality & Pro Features", icon: <Sparkles size={16} /> },
];

const STYLES = [
  { id: "realistic", name: "Realistic", icon: "📸" },
  { id: "anime", name: "Anime", icon: "🎌" },
  { id: "3d", name: "3D Render", icon: "🧊" },
  { id: "cyberpunk", name: "Cyberpunk", icon: "🌆" },
  { id: "sketch", name: "Sketch", icon: "✏️" },
  { id: "oil", name: "Oil Painting", icon: "🎨" },
];

const RATIOS = [
  { id: "1:1", name: "Square", icon: <Layout size={16} /> },
  { id: "16:9", name: "Landscape", icon: <Layout size={16} className="rotate-90" /> },
  { id: "9:16", name: "Portrait", icon: <Layout size={16} /> },
];

const RATIOS_V2 = [
  ...RATIOS,
  { id: "1:4", name: "Ultra Tall", icon: <Layout size={16} /> },
  { id: "4:1", name: "Ultra Wide", icon: <Layout size={16} className="rotate-90" /> },
];

const SIZES = [
  { id: "512px", name: "512px" },
  { id: "1K", name: "1K (Standard)" },
  { id: "2K", name: "2K (HD)" },
  { id: "4K", name: "4K (Ultra)" },
];

export default function ImageLab({ user }: { user: any }) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [style, setStyle] = useState(STYLES[0]);
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    // Check for API key if using Nano Banana 2
    if (model.id === "gemini-3.1-flash-image-preview") {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        toast.error("Nano Banana 2 requires a personal API key. Please connect your key first.");
        await window.aistudio.openSelectKey();
        return;
      }
    }

    setIsLoading(true);
    const toastId = toast.loading("Generating your image...");
    try {
      const fullPrompt = `${prompt}, in ${style.name} style, high quality, detailed`;
      const imageUrl = await generateImage(
        fullPrompt, 
        ratio.id, 
        model.id,
        size.id
      );
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        setHistory(prev => [{ url: imageUrl, prompt: fullPrompt, style: style.name }, ...prev]);
        toast.success("Image generated successfully!", { id: toastId });
      }
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes("Requested entity was not found")) {
        toast.error("API Key error. Please re-select your key.", { id: toastId });
        await window.aistudio.openSelectKey();
      } else {
        toast.error("Failed to generate image.", { id: toastId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = (url: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = `lopa-ai-${Date.now()}.png`;
      link.click();
      toast.success("Image download started!");
    } catch (error) {
      toast.error("Failed to download image.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ImageIcon className="text-accent" />
          Image Generation Lab
        </h1>
        <p className="text-gray-400">Turn your imagination into stunning visuals</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Cpu size={14} /> AI Model
              </label>
              <div className="space-y-2">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setModel(m);
                      // Reset ratio if not supported by Nano Banana 1
                      if (m.id === "gemini-2.5-flash-image" && ["1:4", "4:1"].includes(ratio.id)) {
                        setRatio(RATIOS[0]);
                      }
                    }}
                    className={cn(
                      "w-full p-3 glass rounded-xl text-left border-2 transition-all flex items-center gap-3",
                      model.id === m.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      model.id === m.id ? "bg-primary text-white" : "bg-white/5 text-gray-400"
                    )}>
                      {m.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{m.name}</p>
                      <p className="text-[10px] text-gray-500">{m.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {model.id === "gemini-3.1-flash-image-preview" && (
              <button 
                onClick={() => window.aistudio.openSelectKey()}
                className="w-full py-2 px-4 glass rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-all border border-primary/20"
              >
                <Key size={12} />
                Connect Personal API Key
              </button>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with flying cars..."
                className="w-full input-glass min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Palette size={14} /> Style Selection
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s)}
                    className={cn(
                      "p-3 glass rounded-xl text-xs flex items-center gap-2 border-2 transition-all",
                      style.id === s.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-white/5"
                    )}
                  >
                    <span>{s.icon}</span>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Maximize2 size={14} /> Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(model.id === "gemini-3.1-flash-image-preview" ? RATIOS_V2 : RATIOS).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRatio(r)}
                    className={cn(
                      "p-3 glass rounded-xl text-[10px] flex flex-col items-center gap-2 border-2 transition-all",
                      ratio.id === r.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-white/5"
                    )}
                  >
                    {r.icon}
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {model.id === "gemini-3.1-flash-image-preview" && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Settings2 size={14} /> Resolution
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSize(s)}
                      className={cn(
                        "p-2 glass rounded-xl text-[10px] border-2 transition-all",
                        size.id === s.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-white/5"
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Image
                </>
              )}
            </button>
          </div>

          <div className="glass-card bg-amber-500/5 border-amber-500/20">
            <div className="flex gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <p className="text-xs text-amber-200/70 leading-relaxed">
                Image generation consumes 5 credits per request. Ensure your prompt follows our community guidelines.
              </p>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden group">
            {generatedImage ? (
              <>
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="max-w-full max-h-[600px] rounded-xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={() => downloadImage(generatedImage)}
                    className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform"
                  >
                    <Download size={24} />
                  </button>
                  <button 
                    onClick={handleGenerate}
                    className="p-4 bg-primary text-white rounded-full hover:scale-110 transition-transform"
                  >
                    <RefreshCw size={24} />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <ImageIcon size={48} className="text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-500">Your masterpiece awaits</h3>
                <p className="text-gray-600 max-w-xs mx-auto">Enter a prompt and click generate to see the AI magic happen.</p>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 glass flex flex-col items-center justify-center z-10">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-primary font-bold animate-pulse">Dreaming up your image...</p>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Layers size={18} className="text-primary" />
                  Recent Generations
                </h3>
                <div className="flex items-center gap-2 md:hidden">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Swipe</span>
                  <div className="w-8 h-px bg-white/10" />
                </div>
              </div>
              <div className="flex md:grid md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide snap-x touch-pan-x">
                {history.map((item, i) => (
                  <motion.button 
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setGeneratedImage(item.url)}
                    className="flex-none w-28 md:w-auto aspect-square glass rounded-xl overflow-hidden hover:ring-2 ring-primary transition-all snap-start relative group"
                  >
                    <img 
                      src={item.url} 
                      alt="History" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 size={16} className="text-white" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
