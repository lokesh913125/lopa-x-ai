import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
import { supabase } from "../services/supabase";
  Zap, 
  Shield, 
  Sparkles, 
  Rocket, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  MapPin, 
  Globe, 
  Info, 
  Phone,
  MessageSquare,
  Wand2,
  Image as ImageIcon,
  Gamepad2,
  Lock,
  Star,
  Users,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export default function LandingPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(isLogin ? "Logging in..." : "Creating account...");
    try {
      if (isLogin) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: name
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    onLogin(data.user);
  }

} else {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: name
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    onLogin(data.user);
  }
}
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || email.split("@")[0] })
      });
      const user = await res.json();
      localStorage.setItem("lopa_user", JSON.stringify(user));
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!", { id: toastId });
      onLogin(user);
    } catch (error) {
      toast.error("Authentication failed. Please try again.", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Launch Banner */}
      <div className="bg-gradient-to-r from-primary via-accent to-primary py-2 text-center overflow-hidden relative">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap flex gap-10 items-center"
        >
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <Rocket size={12} /> LOPA X AI IS NOW LIVE • 50+ TOOLS UNLOCKED • JOIN 10,000+ CREATORS • 
            </span>
          ))}
        </motion.div>
      </div>

      {/* Navbar */}
      <nav className={cn(
        "fixed top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 w-[90%] max-w-5xl rounded-2xl border border-white/10",
        scrolled ? "bg-black/60 backdrop-blur-2xl py-3 px-6 shadow-2xl" : "bg-transparent py-5 px-8"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              LOPA X AI
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            {["Features", "Pricing", "About", "Contact"].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
            <button 
              onClick={() => document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-60 pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-2xl"
          >
            <Sparkles size={14} />
            <span>The Future of AI is Here</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-7xl md:text-[10rem] font-black tracking-tighter mb-10 leading-[0.85] bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent"
          >
            CRAFT THE <br /> UNIMAGINABLE.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto mb-16 font-medium leading-relaxed"
          >
            One ecosystem. 50+ specialized AI tools. Advanced personas. <br className="hidden md:block" />
            The only platform you'll ever need to build, create, and explore.
          </motion.p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-24">
            <button 
              onClick={() => document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full md:w-auto px-12 py-6 bg-primary text-white font-black rounded-[2rem] text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(139,92,246,0.3)] flex items-center justify-center gap-3 group"
            >
              Start Creating Now
              <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </button>
            <button className="w-full md:w-auto px-12 py-6 glass text-white font-black rounded-[2rem] text-lg hover:bg-white/5 transition-all border border-white/10">
              View All 50+ Tools
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto py-12 border-y border-white/5">
            <StatItem label="Active Users" value="10K+" />
            <StatItem label="AI Tools" value="50+" />
            <StatItem label="Images Gen" value="1M+" />
            <StatItem label="Uptime" value="99.9%" />
          </div>
        </div>
      </header>

      {/* Main Features Bento */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter">POWERFUL CAPABILITIES.</h2>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto">Everything you need to supercharge your workflow and creativity.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <BentoCard 
            className="md:col-span-2 md:row-span-2"
            icon={<MessageSquare size={32} className="text-primary" />}
            title="Advanced AI Chat"
            description="Experience human-like conversations with streaming responses from Gemini, Groq, and DeepSeek. Specialized personas for every niche."
            image="https://picsum.photos/seed/chat/800/600"
          />
          <BentoCard 
            icon={<ImageIcon size={32} className="text-accent" />}
            title="Image Lab"
            description="Generate stunning 4K images with advanced prompts and styles."
            image="https://picsum.photos/seed/image/400/300"
          />
          <BentoCard 
            icon={<Wand2 size={32} className="text-emerald-500" />}
            title="50+ Micro-Tools"
            description="Specialized tools for coding, writing, marketing, and more."
          />
          <BentoCard 
            icon={<Gamepad2 size={32} className="text-amber-500" />}
            title="Game Forge"
            description="Build and play AI-generated games instantly in your browser."
            image="https://picsum.photos/seed/game/400/300"
          />
          <BentoCard 
            icon={<Lock size={32} className="text-red-500" />}
            title="18+ Private Chat"
            description="Secure, unrestricted conversations in a dedicated private environment."
          />
        </div>
      </section>

      {/* Auth Form Section */}
      <section id="auth-form" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 pointer-events-none" />
        <div className="max-w-xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Rocket size={120} className="rotate-45" />
            </div>
            
            <div className="text-center mb-10 space-y-2">
              <h2 className="text-4xl font-black tracking-tighter">{isLogin ? "WELCOME BACK." : "JOIN THE ELITE."}</h2>
              <p className="text-gray-500 font-medium">Start your journey with Lopa X AI today.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
                  required
                />
              </div>
              <button type="submit" className="w-full py-6 bg-white text-black font-black rounded-2xl text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-white/10 flex items-center justify-center gap-3">
                {isLogin ? "Login Now" : "Create My Account"}
                <ArrowRight size={24} />
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                {isLogin ? "New to the ecosystem?" : "Already a member?"}{" "}
                <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-black uppercase tracking-widest text-xs hover:underline ml-2">
                  {isLogin ? "Sign up" : "Login"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="space-y-4 mb-20">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">CHOOSE YOUR POWER.</h2>
            <p className="text-gray-500 text-xl">Simple plans for every level of creator.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <PriceCard 
              title="Free"
              price="₹0"
              features={["10 Credits/Day", "Standard AI Chat", "Basic Tools", "Community Support"]}
            />
            <PriceCard 
              title="Pro"
              price="₹499"
              period="/mo"
              featured
              features={["Unlimited Credits", "Advanced Models", "Priority Support", "All 50+ Tools", "Image Lab Access", "Private 18+ Section"]}
            />
            <PriceCard 
              title="Lifetime"
              price="₹9,999"
              period="once"
              features={["Everything in Pro", "Early Access to Features", "No Monthly Fees", "Exclusive Personas", "Beta Access"]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter">LOPA X AI</span>
            </div>
            <p className="text-gray-500 max-w-sm leading-relaxed">
              The ultimate AI ecosystem designed for creators, developers, and explorers. Empowering the next generation of digital innovation.
            </p>
            <div className="flex gap-4">
              {[Globe, Mail, Phone].map((Icon, i) => (
                <button key={i} className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:text-primary transition-colors border border-white/10">
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><a href="/chat" className="hover:text-white transition-colors">AI Chat</a></li>
              <li><a href="/tools" className="hover:text-white transition-colors">Micro-Tools</a></li>
              <li><a href="/image-lab" className="hover:text-white transition-colors">Image Lab</a></li>
              <li><a href="/game-forge" className="hover:text-white transition-colors">Game Forge</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/refund" className="hover:text-white transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">© 2026 LOPA X AI. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
            <span>MADE WITH</span>
            <Sparkles size={12} className="text-primary" />
            <span>BY TEAM LOPA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center space-y-1">
      <div className="text-3xl font-black tracking-tighter text-white">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">{label}</div>
    </div>
  );
}

function BentoCard({ className, icon, title, description, image }: { className?: string; icon: any; title: string; description: string; image?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "glass-card p-8 rounded-[2.5rem] border-white/5 hover:border-white/20 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[300px]",
        className
      )}
    >
      {image && (
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
          <img src={image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}
      <div className="relative z-10 space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/10">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed font-medium">{description}</p>
        </div>
      </div>
      <div className="relative z-10 pt-6">
        <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 group-hover:translate-x-2 transition-transform">
          Learn More <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function PriceCard({ title, price, period = "", features, featured = false }: { title: string; price: string; period?: string; features: string[]; featured?: boolean }) {
  return (
    <div className={cn(
      "glass-card p-10 rounded-[3rem] relative overflow-hidden flex flex-col h-full border-white/5 transition-all",
      featured && "border-primary/50 ring-1 ring-primary/50 shadow-[0_0_50px_rgba(139,92,246,0.1)] scale-105 z-10"
    )}>
      {featured && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-6 py-2 rounded-bl-2xl uppercase tracking-[0.2em] shadow-xl">
          Most Popular
        </div>
      )}
      <div className="flex-1 space-y-8">
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black tracking-tighter">{price}</span>
            <span className="text-gray-600 font-black uppercase text-xs tracking-widest">{period}</span>
          </div>
        </div>
        <ul className="space-y-4 text-left">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-4 text-sm text-gray-500 font-medium">
              <CheckCircle2 size={18} className="text-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
      <button className={cn(
        "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs mt-10 transition-all",
        featured ? "bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20" : "bg-white/5 hover:bg-white/10 border border-white/10"
      )}>
        Choose {title}
      </button>
    </div>
  );
}
