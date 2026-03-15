import { useState, useRef } from "react";
import { generateImage, analyzeImageWithAI } from "../services/gemini";

const RATIOS = [
  { label: "Square 1:1", value: "1:1" },
  { label: "Landscape 16:9", value: "16:9" },
  { label: "Portrait 9:16", value: "9:16" },
  { label: "Classic 4:3", value: "4:3" },
];

const STYLES = [
  { label: "🎨 Realistic", tag: "photorealistic, highly detailed, 8k" },
  { label: "✏️ Anime", tag: "anime style, vibrant, manga art" },
  { label: "🧙 Fantasy", tag: "fantasy art, magical, ethereal, concept art" },
  { label: "🤖 Cyberpunk", tag: "cyberpunk, neon lights, futuristic" },
  { label: "🖌️ Oil Paint", tag: "oil painting, classical art, brushstrokes" },
  { label: "📷 Sketch", tag: "pencil sketch, black and white, artistic" },
];

const ANALYZE_MODES = [
  { label: "📝 Describe", prompt: "Describe this image in detail in Hindi and English both." },
  { label: "📊 Analyze", prompt: "Analyze this image. What objects, people, text, colors are visible? Give detailed analysis." },
  { label: "😄 Fun Caption", prompt: "Write 3 funny and creative captions for this image in Hinglish." },
  { label: "🔍 Extract Text", prompt: "Extract all visible text from this image. If no text, say so." },
  { label: "🎨 Art Style", prompt: "What art style, technique, or photography style is used in this image? Explain in detail." },
  { label: "💡 Story", prompt: "Write a short creative story inspired by this image in 100 words." },
];

export default function ImageLab() {
  const [tab, setTab] = useState<"generate" | "analyze">("generate");

  // ── Generate states ──
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [style, setStyle] = useState("");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // ── Analyze states ──
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [analyzeMode, setAnalyzeMode] = useState(ANALYZE_MODES[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Generate ──
  const generate = async () => {
    if (!prompt.trim()) return setGenError("Prompt likho pehle!");
    setLoading(true); setGenError(null); setImgUrl(null);
    try {
      const full = style ? `${prompt.trim()}, ${style}` : prompt.trim();
      setImgUrl(await generateImage(full, ratio));
    } catch (e: any) {
      setGenError(e?.message || "Image generate nahi hui");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imgUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lopax-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(imgUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  // ── Upload ──
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return setAnalyzeError("Sirf image files allowed hain!");
    if (file.size > 10 * 1024 * 1024) return setAnalyzeError("Image 10MB se chhoti honi chahiye!");
    setUploadedFile(file);
    setAnalysisResult(null);
    setAnalyzeError(null);
    const reader = new FileReader();
    reader.onload = (e) => setUploadedPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // ── Analyze ──
  const analyze = async () => {
    if (!uploadedFile) return setAnalyzeError("Pehle image upload karo!");
    setAnalyzing(true); setAnalyzeError(null); setAnalysisResult(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });
      const finalPrompt = customPrompt.trim() || analyzeMode.prompt;
      const result = await analyzeImageWithAI(base64, uploadedFile.type, finalPrompt);
      setAnalysisResult(result);
    } catch (e: any) {
      setAnalyzeError(e?.message || "Analysis fail ho gaya!");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
          🎨 Image Lab
        </h1>
        <p className="text-gray-400 text-sm mb-6">AI se images banao aur analyze karo</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab("generate")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "generate" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            ✨ Generate Image
          </button>
          <button
            onClick={() => setTab("analyze")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "analyze" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            🔍 Image to Text
          </button>
        </div>

        {/* ── TAB 1: Generate ── */}
        {tab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Prompt</label>
                <textarea
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500 h-28"
                  placeholder="e.g. A dragon flying over a neon city at night..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {STYLES.map((s) => (
                    <button key={s.tag} onClick={() => setStyle(style === s.tag ? "" : s.tag)}
                      className={`text-xs py-2 px-2 rounded-lg border transition-colors ${
                        style === s.tag
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-400"
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  {RATIOS.map((r) => (
                    <button key={r.value} onClick={() => setRatio(r.value)}
                      className={`text-xs py-2 rounded-lg border transition-colors ${
                        ratio === r.value
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-400"
                      }`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={generate} disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-40 py-3 rounded-xl font-semibold transition-opacity">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Generating...
                  </span>
                ) : "✨ Generate Image"}
              </button>

              {genError && (
                <p className="text-red-400 text-sm bg-red-900/30 border border-red-700 px-3 py-2 rounded-lg">
                  {genError}
                </p>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 min-h-64 flex items-center justify-center overflow-hidden relative">
              {loading ? (
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"/>
                  <p className="text-gray-400 text-sm">AI image bana raha hai...</p>
                  <p className="text-gray-500 text-xs mt-1">15-30 seconds</p>
                </div>
              ) : imgUrl ? (
                <>
                  <img src={imgUrl} alt="Generated" className="w-full h-full object-contain rounded-xl"/>
                  <button onClick={handleDownload} disabled={downloading}
                    className="absolute bottom-3 right-3 bg-black/70 hover:bg-black disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs transition-colors">
                    {downloading ? "⏳ Saving..." : "⬇️ Download"}
                  </button>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-5xl mb-2">🖼️</div>
                  <p className="text-sm">Yahan image aayegi</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: Image to Text ── */}
        {tab === "analyze" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">

              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                {uploadedPreview ? (
                  <>
                    <img src={uploadedPreview} alt="Uploaded" className="max-h-40 mx-auto rounded-lg object-contain"/>
                    <p className="text-xs text-gray-400 mt-2">{uploadedFile?.name}</p>
                    <p className="text-xs text-purple-400 mt-1">Click to change</p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-sm text-gray-300 font-medium">Image yahan drop karo</p>
                    <p className="text-xs text-gray-500 mt-1">ya click karke select karo</p>
                    <p className="text-xs text-gray-600 mt-2">JPG, PNG, WEBP • Max 10MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>

              {/* Analyze Mode */}
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Kya karna hai?</label>
                <div className="grid grid-cols-2 gap-2">
                  {ANALYZE_MODES.map((m) => (
                    <button key={m.label}
                      onClick={() => { setAnalyzeMode(m); setCustomPrompt(""); }}
                      className={`text-xs py-2 px-3 rounded-lg border transition-colors text-left ${
                        analyzeMode.label === m.label && !customPrompt
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-400"
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Ya apna sawaal likho (optional)</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. Is image mein kya khaas hai?"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
              </div>

              <button
                onClick={analyze}
                disabled={analyzing || !uploadedFile}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-40 py-3 rounded-xl font-semibold transition-opacity"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Analyzing...
                  </span>
                ) : "🔍 Analyze Image"}
              </button>

              {analyzeError && (
                <p className="text-red-400 text-sm bg-red-900/30 border border-red-700 px-3 py-2 rounded-lg">
                  {analyzeError}
                </p>
              )}
            </div>

            {/* Result */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 min-h-64 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <span className="text-sm font-medium text-gray-300">{analyzeMode.label} Result</span>
                {analysisResult && (
                  <button
                    onClick={() => navigator.clipboard.writeText(analysisResult)}
                    className="text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-2 py-1 rounded-lg transition-colors"
                  >
                    📋 Copy
                  </button>
                )}
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-3"/>
                    <p className="text-gray-400 text-sm">Image analyze ho rahi hai...</p>
                    <p className="text-gray-500 text-xs mt-1">Gemini → OpenRouter → Together → SambaNova</p>
                  </div>
                ) : analysisResult ? (
                  <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{analysisResult}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-sm">Image upload karo aur analyze karo</p>
                    <p className="text-xs mt-1 text-gray-600">4 providers try karega automatically</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
