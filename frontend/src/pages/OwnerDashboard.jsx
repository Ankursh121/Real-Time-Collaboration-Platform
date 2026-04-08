import React, { useEffect, useState } from "react";
import { StatCard, Card } from "../components/StatCard";
import { Users, MapPin, CalendarCheck, Wallet, ArrowUpRight, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import API from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const data = [
  { name: "Mon", attendance: 45, payments: 12000 },
  { name: "Tue", attendance: 52, payments: 15000 },
  { name: "Wed", attendance: 48, payments: 10000 },
  { name: "Thu", attendance: 61, payments: 18000 },
  { name: "Fri", attendance: 55, payments: 22000 },
  { name: "Sat", attendance: 67, payments: 25000 },
  { name: "Sun", attendance: 40, payments: 5000 },
];

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeSites: 0,
    attendanceToday: 0,
    totalPayments: 0,
    totalPaid: 0,
  });

  const fetchStats = async () => {
    try {
        const res = await API.get("/owners/dashboard");
        if (res.data.success) {
            setStats(res.data.data);
        }
    } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const copyInviteCode = () => {
    if (user?.inviteCode) {
      navigator.clipboard.writeText(user.inviteCode);
      toast.success("Invite code copied to clipboard!");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time performance across all locations.</p>
        </div>
        
        {user?.inviteCode && (
          <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border border-border/50">
            <div className="text-sm text-muted-foreground font-medium pr-2 border-r border-border">Your Invite Code</div>
            <div className="font-mono font-bold tracking-widest text-primary text-lg">{user.inviteCode}</div>
            <button 
              onClick={copyInviteCode}
              title="Copy to clipboard"
              className="p-2 hover:bg-primary hover:text-primary-foreground text-muted-foreground rounded-lg transition-all"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Workers" value={stats.totalWorkers} icon={Users} trend={12} delay={0.1} />
        <StatCard title="Active Sites" value={stats.activeSites} icon={MapPin} trend={5} delay={0.2} />
        <StatCard title="Attendance Today" value={stats.attendanceToday} icon={CalendarCheck} trend={-2} delay={0.3} />
        <StatCard title="Paid This Month" value={`₹${stats.totalPaid?.toLocaleString()}`} icon={Wallet} trend={18} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 min-h-[400px]" delay={0.5}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Attendance Trends</h3>
            <button className="text-sm text-primary font-medium flex items-center gap-1">View Detailed <ArrowUpRight size={14} /></button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                <Tooltip 
                   contentStyle={{backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px'}}
                   itemStyle={{color: 'hsl(var(--primary))', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card delay={0.6}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Payment Distribution</h3>
             <TrendingUp size={18} className="text-primary" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                <Tooltip 
                   contentStyle={{backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px'}}
                />
                <Bar dataKey="payments" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboard;
