import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Gamepad2, RotateCcw, Maximize2, Share2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PlayGame() {
  const { id } = useParams();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${id}`);
        if (!response.ok) throw new Error("Game not found");
        const data = await response.json();
        setGame(data);
      } catch (err: any) {
        setError(err.message);
        toast.error("Failed to load game");
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-primary animate-spin" size={48} />
        <p className="text-gray-400 animate-pulse uppercase tracking-widest text-xs font-bold">Loading Game...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-4 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <Gamepad2 size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Game Not Found</h1>
          <p className="text-gray-400">The game you're looking for doesn't exist or has been removed.</p>
        </div>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="glass border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/game-forge" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-lg leading-tight">{game.title}</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Powered by Lopa X AI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              toast.success("Link copied to clipboard!");
            }}
            className="p-2 glass rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Share Game"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="p-2 glass rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Restart Game"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Game Frame */}
      <div className="flex-1 relative bg-[#1a1a1a]">
        <iframe 
          srcDoc={game.code}
          className="w-full h-full border-none"
          title={game.title}
          sandbox="allow-scripts allow-modals allow-same-origin"
        />
      </div>

      {/* Controls Footer */}
      <div className="glass border-t border-white/5 p-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6">
          {game.instructions.map((inst: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
              <div className="min-w-[1.5rem] h-6 px-1.5 glass rounded flex items-center justify-center text-[10px] font-mono font-bold border border-white/10">
                {inst.key}
              </div>
              <span className="font-medium">{inst.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
