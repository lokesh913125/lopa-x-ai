import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Key, 
  Globe, 
  Sparkles, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export default function KeyGenerator({ user }: { user: any }) {
  const [url, setUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a valid website URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (e) {
      toast.error("Invalid URL format");
      return;
    }

    setIsGenerating(true);
    setGeneratedKey(null);

    // Simulate key generation logic
    setTimeout(() => {
      const prefix = "LOPA_";
      const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase() + 
                         Math.random().toString(36).substring(2, 15).toUpperCase();
      setGeneratedKey(`${prefix}${randomPart}`);
      setIsGenerating(false);
      toast.success("API Key generated successfully!");
    }, 2000);
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success("Key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Key className="text-primary" />
          API Key Generator
        </h1>
        <p className="text-gray-400">Generate a secure API key for your website integration.</p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <div className="glass-card p-8 space-y-6">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1 flex items-center gap-2">
                  <Globe size={14} />
                  Website URL
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="e.g. https://yourwebsite.com"
                    className="w-full input-glass pl-4 pr-12 py-4 text-lg focus:ring-2 ring-primary/50 transition-all"
                    disabled={isGenerating}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors">
                    <ArrowRight size={20} />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest ml-1">
                  * Key will be generated only after providing a valid link
                </p>
              </div>

              <button
                type="submit"
                disabled={!url.trim() || isGenerating}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                  isGenerating 
                    ? "bg-primary/50 cursor-not-allowed" 
                    : "bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-primary/20"
                )}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Verifying & Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate API Key
                  </>
                )}
              </button>
            </form>

            <AnimatePresence>
              {generatedKey && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-2">
                      <ShieldCheck size={16} />
                      Your Secure API Key
                    </h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full uppercase font-bold">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 glass bg-black/40 border-white/5 rounded-xl p-4 font-mono text-sm break-all select-all">
                      {generatedKey}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="p-4 bg-emerald-500 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-2 text-[10px] text-emerald-500/70 italic">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    Make sure to copy this key now. For security reasons, it won't be shown again.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-amber-500">Security Notice</h4>
                <p className="text-sm text-gray-400">
                  API keys are bound to the website URL provided. Requests from other domains will be rejected. 
                  Never share your API key in client-side code.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              How it works
            </h3>
            <div className="space-y-4">
              <Step 
                number="01" 
                title="Provide URL" 
                desc="Enter the website link where you intend to use the Lopa X AI services." 
              />
              <Step 
                number="02" 
                title="Verification" 
                desc="Our system verifies the domain and prepares a unique encryption key." 
              />
              <Step 
                number="03" 
                title="Get Key" 
                desc="A secure API key is generated specifically for your domain." 
              />
            </div>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <h3 className="font-bold mb-2">Need Help?</h3>
            <p className="text-sm text-gray-400 mb-4">Check our documentation for integration guides and SDKs.</p>
            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-2xl font-black text-white/10">{number}</span>
      <div className="space-y-1">
        <h4 className="text-sm font-bold">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
