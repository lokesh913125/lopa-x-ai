import { useState, useRef, useEffect } from "react";
import { generateGameResponse } from "../services/gemini";

const GAMES = [
  { id: "adventure", label: "⚔️ Adventure",  desc: "Fantasy dungeon exploration" },
  { id: "mystery",   label: "🔍 Mystery",    desc: "Solve a murder mystery" },
  { id: "trivia",    label: "🧠 Trivia",     desc: "Answer quiz questions" },
  { id: "roleplay",  label: "🎭 Roleplay",   desc: "Interactive story roleplay" },
];

const START_PROMPTS: Record<string, string> = {
  adventure: "Start a new fantasy adventure. Describe the setting and give me 3 choices.",
  mystery:   "Start a murder mystery game. Set the scene, introduce the victim and location.",
  trivia:    "Start a trivia game! Ask me the first question.",
  roleplay:  "Start an interesting roleplay scenario for me.",
};

interface Msg { id: string; role: "user" | "game"; content: string; }

export default function GameForge() {
  const [game, setGame] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const startGame = async (id: string) => {
    setGame(id); setMsgs([]); setError(null); setLoading(true);
    try {
      const res = await generateGameResponse(id, START_PROMPTS[id], []);
      setMsgs([{ id: "1", role: "game", content: res }]);
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setLoading(false);
    }
  };

  const sendAction = async () => {
    const text = input.trim();
    if (!text || loading || !game) return;
    const uMsg: Msg = { id: Date.now().toString(), role: "user", content: text };
    setMsgs((p) => [...p, uMsg]);
    setInput(""); setLoading(true); setError(null);
    try {
      const history = msgs.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const res = await generateGameResponse(game, text, history);
      setMsgs((p) => [...p, { id: (Date.now()+1).toString(), role: "game", content: res }]);
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-1">🎮 AI Game Forge</h1>
        <p className="text-gray-400 text-sm mb-6">AI ke saath interactive games khelo</p>

        {!game ? (
          <div className="grid grid-cols-2 gap-4">
            {GAMES.map((g) => (
              <button key={g.id} onClick={() => startGame(g.id)} disabled={loading}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-500 rounded-xl p-5 text-left transition-all group">
                <div className="text-3xl mb-2">{g.label.split(" ")[0]}</div>
                <div className="font-semibold group-hover:text-green-400 transition-colors">{g.label.split(" ").slice(1).join(" ")}</div>
                <div className="text-gray-400 text-sm mt-1">{g.desc}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-[68vh] bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900">
              <span className="font-medium">{GAMES.find((g) => g.id === game)?.label}</span>
              <button onClick={() => { setGame(null); setMsgs([]); }}
                className="text-xs text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded-lg">
                🔄 New Game
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading && msgs.length === 0 && (
                <div className="text-center text-gray-400 mt-8">
                  <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-2"/>
                  <p className="text-sm">Game shuru ho raha hai...</p>
                </div>
              )}
              {msgs.map((m) => (
                <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
                  <div className={`inline-block max-w-[85%] px-4 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-blue-600" : "bg-gray-700 border border-gray-600"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && msgs.length > 0 && (
                <div className="flex gap-1 pl-1">
                  {[0,150,300].map((d) => <span key={d} className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
                </div>
              )}
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div ref={bottomRef}/>
            </div>

            <div className="p-3 border-t border-gray-700 flex gap-2">
              <input
                className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Apna action likho..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAction()}
                disabled={loading || msgs.length === 0}
              />
              <button onClick={sendAction} disabled={loading || !input.trim() || msgs.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-40 px-4 rounded-lg text-sm">▶</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```
