import { useState } from "react";
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  ShieldCheck, 
  Search, 
  MoreVertical, 
  ArrowUpRight,
  Activity,
  Database,
  Globe
} from "lucide-react";
import { cn } from "../lib/utils";

export default function AdminPanel({ user }: { user: any }) {
  const [searchQuery, setSearchQuery] = useState("");

  if (user.email !== "admin@lopa.ai") {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldCheck size={64} className="mx-auto text-red-500 opacity-20" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-gray-500">You do not have administrative privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="text-primary" />
            Admin Control Panel
          </h1>
          <p className="text-gray-400">System-wide monitoring and management.</p>
        </div>
        <div className="flex gap-2">
          <button className="glass px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">EXPORT DATA</button>
          <button className="btn-primary text-xs">SYSTEM RESTART</button>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard title="Total Users" value="12,482" change="+124 today" icon={<Users size={20} />} />
        <AdminStatCard title="Total Revenue" value="₹4,52,000" change="+₹12k today" icon={<CreditCard size={20} />} />
        <AdminStatCard title="API Requests" value="1.2M" change="99.9% success" icon={<Globe size={20} />} />
        <AdminStatCard title="Server Load" value="24%" change="Stable" icon={<Activity size={20} />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* User Management */}
        <div className="lg:col-span-2 glass-card p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Users size={18} className="text-primary" />
              User Management
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-1 ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-bold">User</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Credits</th>
                  <th className="px-6 py-4 font-bold">Joined</th>
                  <th className="px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <UserRow name="John Doe" email="john@example.com" status="Pro" credits="Unlimited" joined="2 days ago" />
                <UserRow name="Sarah Smith" email="sarah@gmail.com" status="Free" credits="8" joined="5 hours ago" />
                <UserRow name="Mike Ross" email="mike@pearson.com" status="Pro" credits="Unlimited" joined="1 week ago" />
                <UserRow name="Rachel Zane" email="rachel@law.com" status="Free" credits="2" joined="3 days ago" />
              </tbody>
            </table>
          </div>
          <div className="p-4 text-center border-t border-white/5">
            <button className="text-xs text-gray-500 hover:text-white transition-all">View All 12,482 Users</button>
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold flex items-center gap-2">
            <Database size={18} className="text-primary" />
            System Health
          </h3>
          <div className="space-y-6">
            <HealthItem label="Groq API" status="Operational" latency="124ms" />
            <HealthItem label="Gemini API" status="Operational" latency="450ms" />
            <HealthItem label="Database" status="Operational" latency="12ms" />
            <HealthItem label="Image Lab" status="Degraded" latency="2.4s" warning />
            <HealthItem label="Auth Service" status="Operational" latency="89ms" />
          </div>
          
          <div className="pt-6 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">System Logs</h4>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-[10px] text-emerald-500/70 space-y-1 h-32 overflow-y-auto">
              <p>[08:42:12] User john@example.com logged in</p>
              <p>[08:42:45] Tool 'yt-script' executed successfully</p>
              <p>[08:43:01] API: Gemini response received in 452ms</p>
              <p className="text-amber-500/70">[08:43:15] Warning: Image Lab latency high</p>
              <p>[08:44:22] New user registered: sarah@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ title, value, change, icon }: { title: string; value: string; change: string; icon: any }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <ArrowUpRight size={16} className="text-gray-700" />
      </div>
      <h4 className="text-gray-400 text-xs uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className="text-[10px] text-emerald-500 font-bold">{change}</p>
    </div>
  );
}

function UserRow({ name, email, status, credits, joined }: { name: string; email: string; status: string; credits: string; joined: string }) {
  return (
    <tr className="hover:bg-white/5 transition-all group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold">
            {name[0]}
          </div>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-[10px] text-gray-500">{email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
          status === "Pro" ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-500"
        )}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-xs font-mono text-gray-400">{credits}</td>
      <td className="px-6 py-4 text-xs text-gray-500">{joined}</td>
      <td className="px-6 py-4">
        <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-all">
          <MoreVertical size={14} />
        </button>
      </td>
    </tr>
  );
}

function HealthItem({ label, status, latency, warning = false }: { label: string; status: string; latency: string; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full", warning ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-right">
        <p className={cn("text-[10px] font-bold uppercase tracking-widest", warning ? "text-amber-500" : "text-emerald-500")}>{status}</p>
        <p className="text-[10px] text-gray-500 font-mono">{latency}</p>
      </div>
    </div>
  );
}
