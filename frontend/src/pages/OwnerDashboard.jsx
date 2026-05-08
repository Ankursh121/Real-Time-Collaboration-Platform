import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatCard, Card } from "../components/StatCard";
import { 
  Users, 
  MapPin, 
  CalendarCheck, 
  Wallet, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  LayoutDashboard,
  IndianRupee,
  Activity,
  ChevronRight,
  Loader2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Cell
} from "recharts";
import API from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const OwnerDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        summary: {
            totalWorkers: 0,
            totalAdmins: 0,
            activeSites: 0,
            attendanceToday: 0,
            totalPaid: 0,
            totalDue: 0
        },
        weeklyTrend: [],
        siteStats: [],
        recentActivity: [],
        owner: {}
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await API.get("/owners/dashboard");
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Dashboard Sync Failed", error);
            toast.error("Failed to sync live metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const copyInviteCode = () => {
        if (data.owner?.inviteCode) {
            navigator.clipboard.writeText(data.owner.inviteCode);
            toast.success("Invite code copied to clipboard!");
        }
    };

    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="font-black text-muted-foreground tracking-widest uppercase text-xs">Assembling Your Command Center...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="space-y-2">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 text-primary"
                    >
                        <Activity size={20} className="animate-pulse" />
                        <span className="font-black text-sm uppercase tracking-[0.3em]">{getTimeOfDay()}</span>
                    </motion.div>
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent">
                        Welcome, {data.owner?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium max-w-xl">
                        Your workforce is operating across <span className="text-foreground font-bold">{data.summary.activeSites} locations</span> with <span className="text-foreground font-bold">{data.summary.totalWorkers} active personnel</span> today.
                    </p>
                </div>

                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="relative group cursor-pointer overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-primary/50 via-primary/10 to-transparent"
                    onClick={copyInviteCode}
                >
                    <div className="relative bg-card rounded-3xl px-8 py-6 flex items-center gap-6 group-hover:bg-muted/30 transition-all">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organizational Invite</p>
                            <p className="text-3xl font-black tracking-widest text-primary font-mono">{data.owner?.inviteCode}</p>
                        </div>
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            <Copy size={24} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Active Workforce" 
                    value={data.summary.totalWorkers} 
                    icon={Users} 
                    color="bg-blue-500"
                    description="Total vetted workers"
                    delay={0.1} 
                />
                <StatCard 
                    title="Site Presence" 
                    value={data.summary.attendanceToday} 
                    icon={CalendarCheck} 
                    color="bg-emerald-500"
                    description="Today's check-ins"
                    delay={0.2} 
                />
                <StatCard 
                    title="Capital Disbursed" 
                    value={`₹${data.summary.totalPaid?.toLocaleString()}`} 
                    icon={Wallet} 
                    color="bg-purple-500"
                    description="Total payroll settled"
                    delay={0.3} 
                />
                <StatCard 
                    title="Outstanding Dues" 
                    value={`₹${data.summary.totalDue?.toLocaleString()}`} 
                    icon={IndianRupee} 
                    color="bg-orange-500"
                    description="Active payables"
                    delay={0.4} 
                />
            </div>

            {/* Intelligence Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Trend Chart */}
                <Card className="lg:col-span-2 border-none shadow-2xl bg-card/40 backdrop-blur-xl p-8" delay={0.5}>
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <TrendingUp className="text-primary" /> Attendance Velocity
                            </h3>
                            <p className="text-muted-foreground font-medium text-sm">7-day mobilization trends</p>
                        </div>
                        <div className="flex gap-2">
                             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[10px] font-black uppercase text-primary tracking-tighter">Live Tracker</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.weeklyTrend}>
                                <defs>
                                    <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700}} 
                                    dy={15} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700}} 
                                    dx={-10}
                                />
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-popover/90 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl">
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">{payload[0].payload.date}</p>
                                                    <p className="text-xl font-black text-foreground">{payload[0].value} <span className="text-xs text-muted-foreground">Workers</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorWave)" 
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Vertical Distribution & Activity */}
                <div className="space-y-8">
                    {/* Site Distribution Card */}
                    <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-xl p-8 h-fit" delay={0.6}>
                        <h3 className="text-xl font-black tracking-tight mb-8">Workforce split</h3>
                        <div className="space-y-6">
                            {data.siteStats.map((site, i) => (
                                <div key={site.name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-sm font-black tracking-tight">{site.name}</p>
                                        <p className="text-xs font-black text-primary">{site.workerCount} Pers.</p>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(site.workerCount / data.summary.totalWorkers) * 100}%` }}
                                            transition={{ duration: 1.5, delay: 0.8 + (i * 0.1) }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Recent Activities Panel */}
                    <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-xl p-8" delay={0.7}>
                        <div className="flex items-center justify-between mb-8">
                           <h3 className="text-xl font-black tracking-tight">System Logs</h3>
                           <Clock className="text-muted-foreground" size={18} />
                        </div>
                        <div className="space-y-6">
                            {data.recentActivity.map((act, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="relative">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-border group-hover:scale-110 transition-all ${
                                            act.type === 'attendance' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                            {act.type === 'attendance' ? <Users size={16} /> : <Wallet size={16} />}
                                        </div>
                                        {i !== data.recentActivity.length - 1 && (
                                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-border" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black tracking-tight leading-none group-hover:text-primary transition-colors">
                                            {act.user} <span className="text-muted-foreground font-medium">{act.label}</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                            {act.site || "Global System"} • {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3 bg-muted/50 hover:bg-muted text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                            View All Events <ChevronRight size={14} />
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
