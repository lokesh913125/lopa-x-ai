import { useState } from "react";
import { generateImage } from "../services/gemini";

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

export default function ImageLab() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [style, setStyle] = useState("");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return setError("Prompt likho pehle!");
    setLoading(true); setError(null); setImgUrl(null);
    try {
      const full = style ? `${prompt.trim()}, ${style}` : prompt.trim();
      const url = await generateImage(full, ratio);
      setImgUrl(url);
    } catch (e: any) {
      setError(e?.message || "Image generate nahi hui");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">🎨 Image Lab</h1>
        <p className="text-gray-400 text-sm mb-6">AI se amazing images banao</p>

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
                    className={`text-xs py-2 px-2 rounded-lg border transition-colors ${style === s.tag ? "border-purple-500 bg-purple-500/20 text-purple-300" : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-400"}`}>
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
                    className={`text-xs py-2 rounded-lg border transition-colors ${ratio === r.value ? "border-purple-500 bg-purple-500/20 text-purple-300" : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-400"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={loading || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-40 py-3 rounded-xl font-semibold transition-opacity">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generating...</span> : "✨ Generate Image"}
            </button>

            {error && <p className="text-red-400 text-sm bg-red-900/30 border border-red-700 px-3 py-2 rounded-lg">{error}</p>}
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
                <a href={imgUrl} download={`lopax-${Date.now()}.png`} target="_blank" rel="noreferrer"
                  className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs">
                  ⬇️ Download
                </a>
              </>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-5xl mb-2">🖼️</div>
                <p className="text-sm">Yahan image aayegi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
