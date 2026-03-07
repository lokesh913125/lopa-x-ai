import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { 
  Zap, 
  MessageSquare, 
  Wand2, 
  ImageIcon, 
  TrendingUp, 
  Clock, 
  Star,
  ArrowUpRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "../lib/utils";

const MOCK_DATA = [
  { name: "Mon", usage: 4 },
  { name: "Tue", usage: 7 },
  { name: "Wed", usage: 5 },
  { name: "Thu", usage: 12 },
  { name: "Fri", usage: 8 },
  { name: "Sat", usage: 15 },
  { name: "Sun", usage: 10 },
];

export default function Dashboard({ user }: { user: any }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
          <p className="text-gray-400">Here's what's happening with your AI workspace.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            <span className="font-bold">{user.credits} Credits Left</span>
          </div>
          <Link to="/pricing" className="btn-primary">Upgrade to Pro</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Generations" value="1,284" change="+12%" icon={<Zap className="text-primary" />} />
        <StatCard title="Chat Messages" value="452" change="+5%" icon={<MessageSquare className="text-accent" />} />
        <StatCard title="Tools Used" value="89" change="+24%" icon={<Wand2 className="text-emerald-500" />} />
        <StatCard title="Images Created" value="12" change="+2%" icon={<ImageIcon className="text-blue-500" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Usage Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Usage Activity
            </h3>
            <select className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "12px" }}
                  itemStyle={{ color: "#8B5CF6" }}
                />
                <Area type="monotone" dataKey="usage" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="font-bold flex items-center gap-2 mb-6">
            <Clock size={18} className="text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-6">
            <ActivityItem 
              icon={<Wand2 size={14} />} 
              title="YouTube Script Writer" 
              time="2 hours ago"
              type="Tool"
            />
            <ActivityItem 
              icon={<MessageSquare size={14} />} 
              title="Chat with Tech Expert" 
              time="5 hours ago"
              type="Chat"
            />
            <ActivityItem 
              icon={<ImageIcon size={14} />} 
              title="Cyberpunk City Image" 
              time="Yesterday"
              type="Image"
            />
            <ActivityItem 
              icon={<Star size={14} />} 
              title="Upgraded to Pro" 
              time="2 days ago"
              type="System"
            />
          </div>
          <button className="w-full mt-8 py-2 text-sm text-gray-500 hover:text-white transition-all border-t border-white/5 pt-4">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }: { title: string; value: string; change: string; icon: any }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-6 hover:border-primary/30 transition-all cursor-default group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
          {change}
        </span>
      </div>
      <h4 className="text-gray-400 text-sm mb-1">{title}</h4>
      <p className="text-2xl font-black">{value}</p>
    </motion.div>
  );
}

function ActivityItem({ icon, title, time, type }: { icon: any; title: string; time: string; type: string }) {
  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className="flex items-center gap-4 group cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-primary/20 group-hover:text-primary transition-all">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium truncate group-hover:text-white transition-colors">{title}</h5>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{type} • {time}</p>
      </div>
      <ArrowUpRight size={14} className="text-gray-700 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
    </motion.div>
  );
}
