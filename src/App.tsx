import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./services/supabase";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Wand2, 
  Image as ImageIcon, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Zap,
  ShieldAlert,
  Gamepad2,
  Share2,
  Copy,
  Check,
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { cn } from "./lib/utils";

// Pages
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import ToolsPage from "./pages/ToolsPage";
import ImageLab from "./pages/ImageLab";
import ProfilePage from "./pages/ProfilePage";
import AdminPanel from "./pages/AdminPanel";
import AdultChatPage from "./pages/AdultChatPage";
import GameForge from "./pages/GameForge";
import LegalPage from "./pages/LegalPage";
import PricingPage from "./pages/PricingPage";
import PlayGame from "./pages/PlayGame";
import KeyGenerator from "./pages/KeyGenerator";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("lopa_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Ensure referral fields exist
        if (!parsed.referralCode) {
          parsed.referralCode = `LOPA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          parsed.referrals = parsed.referrals || 0;
          parsed.referralCredits = parsed.referralCredits || 0;
          localStorage.setItem("lopa_user", JSON.stringify(parsed));
        }
        setUser(parsed);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      localStorage.removeItem("lopa_user");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("lopa_user");
    setUser(null);
    window.location.href = "/";
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Public Routes (Accessible without login)
  if (location.pathname.startsWith("/play/")) {
    return (
      <>
        <Toaster position="top-right" theme="dark" richColors />
        <Routes>
          <Route path="/play/:id" element={<PlayGame />} />
        </Routes>
      </>
    );
  }

  if (!user) {
    // ── TESTING MODE: Login bypass ──
    // Jab testing khatam ho toh ye 4 lines delete karna
    const testUser = {
      name: "Lokesh",
      email: "lokesh@test.com",
      credits: 9999,
      referralCode: "LOPA-TEST1",
      referrals: 0,
      referralCredits: 0,
    };
    localStorage.setItem("lopa_user", JSON.stringify(testUser));
    setUser(testUser);
    return null;

    // Normal login (ye tab use hoga jab testing mode band karo)
    // return (
    //   <>
    //     <Toaster position="top-right" theme="dark" richColors />
    //     <Routes>
    //       <Route path="/" element={<LandingPage onLogin={(u: any) => setUser(u)} />} />
    //       <Route path="*" element={<LandingPage onLogin={(u: any) => setUser(u)} />} />
    //     </Routes>
    //   </>
    // );
  }

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Global Share Modal */}
      <AnimatePresence>
        {showShareModal && (
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
              className="glass-card max-w-md w-full p-8 space-y-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full text-gray-400"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="text-primary" size={32} />
                </div>
                <h3 className="text-2xl font-bold">Invite Friends</h3>
                <p className="text-gray-400 text-sm">Share your link and earn credits for every friend who joins!</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">10 Referrals = 1 Month Free</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Current: {user.referrals || 0}/10</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-2">Your Referral Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 glass rounded-xl p-3 text-sm text-gray-400 truncate border border-white/10">
                      {window.location.origin}/?ref={user.referralCode}
                    </div>
                    <button 
                      onClick={copyReferralLink}
                      className="p-3 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 glass rounded-xl text-sm font-medium hover:bg-white/5 transition-all">WhatsApp</button>
                <button className="p-3 glass rounded-xl text-sm font-medium hover:bg-white/5 transition-all">Twitter</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen bg-black overflow-hidden">
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          className="glass border-r border-white/10 flex flex-col z-50"
        >
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              >
                Lopa X AI
              </motion.span>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" isOpen={isSidebarOpen} />
            <NavItem to="/chat" icon={<MessageSquare size={20} />} label="AI Chat" isOpen={isSidebarOpen} />
            <NavItem to="/tools" icon={<Wand2 size={20} />} label="AI Tools" isOpen={isSidebarOpen} />
            <NavItem to="/image-lab" icon={<ImageIcon size={20} />} label="Image Lab" isOpen={isSidebarOpen} />
            <NavItem to="/key-generator" icon={<Key size={20} />} label="API Key Generator" isOpen={isSidebarOpen} />
            <NavItem to="/game-forge" icon={<Gamepad2 size={20} />} label="AI Game Forge" isOpen={isSidebarOpen} />
            <NavItem to="/adult-chat" icon={<ShieldAlert size={20} />} label="18+ Chat" isOpen={isSidebarOpen} className="text-red-500 hover:bg-red-500/10" />
            
            <button 
              onClick={() => setShowShareModal(true)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group text-emerald-500 hover:bg-emerald-500/10",
                !isSidebarOpen && "justify-center"
              )}
            >
              <Share2 size={20} />
              {isSidebarOpen && <span className="text-sm font-medium">Refer & Earn</span>}
            </button>
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-3 p-3 glass rounded-xl mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
                {user.name?.[0] || "U"}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-primary">
                    <Zap size={10} />
                    <span>{user.credits} Credits</span>
                  </div>
                </div>
              )}
            </div>
            <NavItem to="/profile" icon={<User size={20} />} label="Profile" isOpen={isSidebarOpen} />
            {user.email === "admin@lopa.ai" && (
              <NavItem to="/admin" icon={<Settings size={20} />} label="Admin" isOpen={isSidebarOpen} />
            )}
            <button 
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 text-gray-400 hover:text-white",
                !isSidebarOpen && "justify-center"
              )}
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.15),transparent_50%)] pointer-events-none" />
          <div className="p-8 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Routes location={location}>
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/chat" element={<ChatPage user={user} />} />
                  <Route path="/tools" element={<ToolsPage user={user} />} />
                  <Route path="/image-lab" element={<ImageLab user={user} />} />
                  <Route path="/key-generator" element={<KeyGenerator user={user} />} />
                  <Route path="/game-forge" element={<GameForge user={user} />} />
                  <Route path="/adult-chat" element={<AdultChatPage user={user} />} />
                  <Route path="/profile" element={<ProfilePage user={user} />} />
                  <Route path="/pricing" element={<PricingPage user={user} />} />
                  <Route path="/admin" element={<AdminPanel user={user} />} />
                  <Route path="/terms" element={<LegalPage type="terms" />} />
                  <Route path="/privacy" element={<LegalPage type="privacy" />} />
                  <Route path="/refund" element={<LegalPage type="refund" />} />
                  <Route path="*" element={<Dashboard user={user} />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  );
}

function NavItem({ to, icon, label, isOpen, className }: { to: string; icon: any; label: string; isOpen: boolean; className?: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsNavigating(false);
    }
  }, [isActive]);

  return (
    <Link 
      to={to}
      onClick={() => {
        if (!isActive) setIsNavigating(true);
      }}
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-xl transition-all group",
        isActive ? "text-primary" : "text-gray-400 hover:text-white",
        !isOpen && "justify-center",
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 bg-primary/20 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.2)]"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      {isNavigating && (
        <motion.div
          className="absolute inset-0 border-2 border-primary/50 rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: [0, 1, 0], scale: [0.95, 1.05, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
      
      <motion.div
        whileTap={{ scale: 0.9 }}
        className="relative z-10 flex items-center gap-3"
      >
        <div className={cn(
          "transition-transform duration-300",
          isActive ? "scale-110" : "group-hover:scale-110",
          isNavigating && "animate-pulse"
        )}>
          {icon}
        </div>
        {isOpen && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-medium"
          >
            {label}
          </motion.span>
        )}
      </motion.div>

      {isActive && (
        <motion.div
          className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary"
          layoutId="nav-dot"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
}
