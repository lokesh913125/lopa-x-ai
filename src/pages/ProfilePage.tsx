import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Mail, 
  Shield, 
  CreditCard, 
  History, 
  Bell, 
  LogOut, 
  Camera,
  CheckCircle2,
  Zap,
  ChevronRight,
  Share2,
  Users,
  Gift,
  Copy,
  Check
} from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export default function ProfilePage({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("general");
  const [copied, setCopied] = useState(false);

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-gray-400">Manage your profile, subscription, and preferences.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 space-y-2">
          <TabButton 
            active={activeTab === "general"} 
            onClick={() => setActiveTab("general")}
            icon={<User size={18} />}
            label="General"
          />
          <TabButton 
            active={activeTab === "subscription"} 
            onClick={() => setActiveTab("subscription")}
            icon={<CreditCard size={18} />}
            label="Subscription"
          />
          <TabButton 
            active={activeTab === "referral"} 
            onClick={() => setActiveTab("referral")}
            icon={<Share2 size={18} />}
            label="Referrals"
          />
          <TabButton 
            active={activeTab === "security"} 
            onClick={() => setActiveTab("security")}
            icon={<Shield size={18} />}
            label="Security"
          />
          <TabButton 
            active={activeTab === "notifications"} 
            onClick={() => setActiveTab("notifications")}
            icon={<Bell size={18} />}
            label="Notifications"
          />
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="glass-card p-8 flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-3xl font-bold shadow-2xl">
                    {user.name?.[0] || "U"}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} />
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                    {user.subscription_status} User
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    ID: {user.id}
                  </span>
                </div>
              </div>

              <div className="glass-card p-6 space-y-6">
                <h4 className="font-bold border-b border-white/5 pb-4">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-widest">Full Name</label>
                    <input type="text" defaultValue={user.name} className="w-full input-glass" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-widest">Email Address</label>
                    <input type="email" defaultValue={user.email} className="w-full input-glass opacity-50" disabled />
                  </div>
                </div>
                <button className="btn-primary w-full py-3">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === "subscription" && (
            <div className="space-y-6">
              <div className="glass-card p-8 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Zap size={120} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black">Current Plan: {user.subscription_status.toUpperCase()}</h3>
                      <p className="text-gray-400">Your credits reset in 14 hours.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black">{user.credits}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Available Credits</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[60%]" />
                  </div>
                  <div className="flex gap-4">
                    <Link to="/pricing" className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all text-center">
                      Upgrade to Pro
                    </Link>
                    <button className="flex-1 py-3 glass font-bold rounded-xl hover:bg-white/10 transition-all">
                      Buy Credits
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h4 className="font-bold mb-6">Payment History</h4>
                <div className="space-y-4">
                  <HistoryItem date="Oct 12, 2023" amount="₹499" status="Success" />
                  <HistoryItem date="Sep 12, 2023" amount="₹499" status="Success" />
                  <HistoryItem date="Aug 12, 2023" amount="₹499" status="Success" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "referral" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-6 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Users size={20} />
                  </div>
                  <p className="text-2xl font-black">{user.referrals || 0}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Referrals</p>
                </div>
                <div className="glass-card p-6 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Zap size={20} />
                  </div>
                  <p className="text-2xl font-black">{user.referralCredits || 0}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Credits Earned</p>
                </div>
                <div className="glass-card p-6 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <Gift size={20} />
                  </div>
                  <p className="text-2xl font-black">{Math.floor((user.referrals || 0) / 10)}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Free Months Earned</p>
                </div>
              </div>

              <div className="glass-card p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Refer & Earn</h3>
                  <p className="text-gray-400 text-sm">Invite your friends to Lopa X AI. When they sign up, you get 50 credits. Refer 10 friends and get 1 month of Pro for free!</p>
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <Gift size={24} />
                    </div>
                    <div>
                      <p className="font-bold">Progress to Free Month</p>
                      <p className="text-xs text-gray-500">{(user.referrals || 0) % 10}/10 referrals completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">{Math.round(((user.referrals || 0) % 10) * 10)}%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-2">Your Referral Code</label>
                    <div className="flex gap-2">
                      <div className="flex-1 glass rounded-xl p-4 font-mono text-lg tracking-wider flex items-center justify-center border border-white/10">
                        {user.referralCode}
                      </div>
                      <button 
                        onClick={copyReferralLink}
                        className="p-4 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        {copied ? <Check size={24} /> : <Copy size={24} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h4 className="font-bold mb-6">How it works</h4>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <p className="text-sm text-gray-400">Share your unique referral link or code with your friends.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <p className="text-sm text-gray-400">Your friend signs up using your link or enters your code during registration.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <p className="text-sm text-gray-400">You instantly receive 50 credits. Once you hit 10 referrals, your Pro subscription is automatically extended by 1 month!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-xl transition-all",
        active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight size={14} className={cn("transition-transform", active ? "rotate-90" : "")} />
    </button>
  );
}

function HistoryItem({ date, amount, status }: { date: string; amount: string; status: string }) {
  return (
    <div className="flex items-center justify-between p-4 glass rounded-xl border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          <History size={18} className="text-gray-500" />
        </div>
        <div>
          <p className="text-sm font-medium">Monthly Subscription</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{amount}</p>
        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
          <CheckCircle2 size={10} />
          {status}
        </div>
      </div>
    </div>
  );
}
