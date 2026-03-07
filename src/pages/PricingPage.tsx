import { motion } from "motion/react";
import { CheckCircle2, Zap, Rocket, Crown, Loader2, Star, ShieldCheck, Cpu, Sparkles, Flame, Users, Timer } from "lucide-react";
import { cn } from "../lib/utils";
import { useState } from "react";
import { toast } from "sonner";

declare var Razorpay: any;

export default function PricingPage({ user }: { user: any }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePayment = async (plan: { title: string, price: string, amount: number, period?: string }) => {
    if (plan.title === "Free") return;
    
    setLoadingPlan(plan.title);
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.amount,
          receipt: `receipt_${Date.now()}`
        })
      });

      if (!orderRes.ok) throw new Error("Failed to create order");
      const orderData = await orderRes.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Lopa X AI",
        description: `Upgrade to ${plan.title} Plan`,
        image: "https://picsum.photos/seed/lopa/200/200",
        order_id: orderData.id,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
              planTitle: plan.title
            })
          });

          if (verifyRes.ok) {
            toast.success(`Successfully upgraded to ${plan.title}!`);
            setTimeout(() => window.location.reload(), 2000);
          } else {
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#8B5CF6",
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment Error:", error);
      toast.error(error.message || "Something went wrong with the payment.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-12 px-4">
      {/* Header Section */}
      <div className="text-center space-y-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -z-10" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-4"
        >
          <Sparkles size={14} />
          Limited Time Launch Offer
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black tracking-tighter leading-none"
        >
          Unleash Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-300% animate-gradient">Creative Power</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto font-medium"
        >
          Experience the future of AI with unrestricted access to the world's most powerful models. 
          Choose a plan that scales with your imagination.
        </motion.p>
      </div>

      {/* Launch Offer Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient" />
        <div className="relative glass-card p-8 md:p-12 bg-black/40 border-primary/30 overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
              <Flame size={14} />
              Hot Deal
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Launch Special Offer</h2>
                <p className="text-xl text-primary font-bold">₹999 for 18 Months of Pro Access</p>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-400 leading-relaxed">
                  Be among the first 100 users to join Lopa X AI and get an incredible 18 months of full Pro access for just ₹999. 
                  That's less than ₹56 per month for unlimited AI power.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <Users size={16} className="text-primary" />
                    First 100 Users Only
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <Timer size={16} className="text-primary" />
                    18 Months Access
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
                <span className="text-xs font-black text-primary uppercase tracking-widest">65/100 Joined</span>
              </div>
            </div>

            <div className="glass-card p-8 bg-primary/5 border-primary/20 space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-400 line-through">Regular: ₹8,982</p>
                  <p className="text-5xl font-black tracking-tighter">₹999</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-primary uppercase tracking-widest">Saving 88%</p>
                  <p className="text-sm text-gray-500">One-time payment</p>
                </div>
              </div>
              
              <button 
                onClick={() => handlePayment({ title: "Launch Offer", price: "₹999", amount: 999, period: "18 Months" })}
                disabled={loadingPlan === "Launch Offer"}
                className="w-full py-5 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] flex items-center justify-center gap-3 text-lg uppercase tracking-widest"
              >
                {loadingPlan === "Launch Offer" ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                Claim Offer Now
              </button>
              
              <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest font-bold">
                Secure Payment via Razorpay • Instant Activation
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        <PriceCard 
          title="Free"
          price="₹0"
          amount={0}
          description="Perfect for exploring Lopa X AI"
          icon={<Rocket className="text-blue-500" />}
          features={[
            "10 Credits Daily Reset",
            "Access to Basic Models",
            "Standard AI Chat Interface",
            "Basic Image Generation",
            "Community Support",
            "Standard Processing Speed"
          ]}
          isCurrent={user.subscription_status === "free"}
          onSelect={() => {}}
        />
        <PriceCard 
          title="Pro"
          price="₹499"
          amount={499}
          period="/mo"
          description="For power users and creators"
          featured
          icon={<Zap className="text-primary" />}
          features={[
            "Unlimited Daily Credits",
            "Advanced Models (GPT-4o, Claude 3.5)",
            "Priority Processing Speed",
            "High-Quality Image Lab (4K)",
            "All 50+ Specialized Tools",
            "Early Access to New Features",
            "Priority 24/7 Support",
            "No Watermarks on Images"
          ]}
          isCurrent={user.subscription_status === "pro"}
          isLoading={loadingPlan === "Pro"}
          onSelect={() => handlePayment({ title: "Pro", price: "₹499", amount: 499, period: "/mo" })}
        />
        <PriceCard 
          title="Lifetime"
          price="₹9,999"
          amount={9999}
          period="once"
          description="One-time payment, forever access"
          icon={<Crown className="text-amber-500" />}
          features={[
            "Everything in Pro Plan",
            "Lifetime Access to All Updates",
            "Never Pay Monthly Fees Again",
            "Exclusive Beta Feature Access",
            "Custom Persona Creation",
            "Dedicated Account Manager",
            "Commercial Usage License",
            "VIP Community Access"
          ]}
          isCurrent={user.subscription_status === "lifetime"}
          isLoading={loadingPlan === "Lifetime"}
          onSelect={() => handlePayment({ title: "Lifetime", price: "₹9,999", amount: 9999, period: "once" })}
        />
      </div>

      {/* Features Grid */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Why Choose Lopa X AI?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">We combine the world's best AI models into a single, powerful creative studio.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <FeatureItem 
            icon={<Cpu size={24} />}
            title="Multi-Model Engine"
            description="Switch between GPT-4o, Claude 3.5, Gemini 1.5, and Llama 3 instantly."
          />
          <FeatureItem 
            icon={<ShieldCheck size={24} />}
            title="Privacy First"
            description="Your data is encrypted and never used for training without your explicit consent."
          />
          <FeatureItem 
            icon={<Zap size={24} />}
            title="Ultra-Fast Speed"
            description="Optimized infrastructure ensuring sub-second response times for all models."
          />
          <FeatureItem 
            icon={<Star size={24} />}
            title="50+ Creative Tools"
            description="From SEO writing to code debugging, we have a tool for every task."
          />
        </div>
      </div>

      {/* Custom Plan / Enterprise */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-800 to-gray-900 rounded-[2rem] blur opacity-25" />
        <div className="relative glass-card p-8 md:p-12 bg-black/40 border-white/10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-2xl">
              <Crown size={48} className="text-primary" />
            </div>
            <div className="flex-1 space-y-3 text-center md:text-left">
              <h3 className="text-3xl font-black tracking-tight">Need an Enterprise Solution?</h3>
              <p className="text-gray-400 text-lg">We offer custom API limits, dedicated infrastructure, and white-label solutions for large teams and businesses.</p>
            </div>
            <button className="px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all shrink-0 uppercase tracking-widest shadow-xl">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceCard({ 
  title, 
  price, 
  amount,
  period = "", 
  description,
  features, 
  icon,
  featured = false,
  isCurrent = false,
  isLoading = false,
  onSelect
}: { 
  title: string; 
  price: string; 
  amount: number;
  period?: string; 
  description: string;
  features: string[]; 
  icon?: React.ReactNode;
  featured?: boolean;
  isCurrent?: boolean;
  isLoading?: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className={cn(
        "glass-card relative overflow-hidden flex flex-col h-full transition-all duration-500",
        featured && "border-primary/50 ring-1 ring-primary/50 shadow-[0_20px_80px_rgba(139,92,246,0.15)]",
        isCurrent && "border-emerald-500/50 grayscale-[0.5]"
      )}
    >
      {featured && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-6 py-2 rounded-bl-2xl uppercase tracking-[0.2em] shadow-lg z-10">
          Most Popular
        </div>
      )}
      
      <div className="p-10 space-y-8 flex-1">
        <div className="space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tighter">{title}</h3>
            <p className="text-sm text-gray-500 font-medium">{description}</p>
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black tracking-tighter">{price}</span>
          <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">{period}</span>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <ul className="space-y-4">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-400 font-medium group">
              <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span className="group-hover:text-gray-200 transition-colors">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-10 pt-0">
        <button 
          disabled={isCurrent || isLoading}
          onClick={onSelect}
          className={cn(
            "w-full py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm shadow-xl",
            isCurrent 
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default" 
              : featured 
                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/40" 
                : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
          )}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : isCurrent ? (
            <>
              <ShieldCheck size={20} />
              Active Plan
            </>
          ) : (
            <>
              {featured ? <Zap size={20} /> : <Rocket size={20} />}
              Select Plan
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-8 bg-white/[0.02] border-white/5 hover:border-primary/20 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="text-xl font-bold mb-2 tracking-tight">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
