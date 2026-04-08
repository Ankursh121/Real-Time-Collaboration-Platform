import React from "react";
import { Card, StatCard } from "../components/StatCard";
import { Wallet, CalendarCheck, Clock, History, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

const WorkerDashboard = () => {
  const { user } = useAuth();
  const stats = {
    earnings: "₹12,400",
    pending: "₹3,200",
    attendance: "24 Days",
  };

  const history = [
    { id: 1, date: "24 Oct", status: "Present", amount: "₹500" },
    { id: 2, date: "23 Oct", status: "Present", amount: "₹500" },
    { id: 3, date: "22 Oct", status: "Absent", amount: "₹0" },
  ];

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 for mobile nav spacing if needed */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Track your earnings and attendance.</p>
        </div>
        {user?.owner?.name && (
          <div className="flex items-center gap-2 bg-muted/40 border border-border/50 px-4 py-2 rounded-xl">
             <Building2 size={16} className="text-muted-foreground" />
             <div className="text-sm font-medium">
               <span className="text-muted-foreground mr-1">Working under:</span>
               <span className="text-primary font-bold">{user.owner.name}</span>
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
           <Card className="bg-primary text-primary-foreground border-none">
             <div className="flex justify-between items-center">
                <div>
                   <p className="text-primary-foreground/80 text-sm font-medium">Total Earnings</p>
                   <h2 className="text-3xl font-bold mt-1">{stats.earnings}</h2>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                   <Wallet size={24} />
                </div>
             </div>
           </Card>
        </div>
        <StatCard title="Pending" value={stats.pending} icon={Clock} delay={0.1} className="col-span-1" />
        <StatCard title="Attendance" value={stats.attendance} icon={CalendarCheck} delay={0.2} className="col-span-1" />
      </div>

      <div className="mt-8">
         <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold flex items-center gap-2"><History size={18} className="text-primary"/> Recent Activity</h3>
             <button className="text-primary text-sm font-medium">View All</button>
         </div>
         
         <div className="space-y-3">
            {history.map((item, idx) => (
                <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 + (idx * 0.1) }}
                   className="glass p-4 rounded-xl flex items-center justify-between"
                >
                   <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${item.status === 'Present' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                         <p className="font-bold text-sm">{item.date}</p>
                         <p className="text-xs text-muted-foreground">{item.status}</p>
                      </div>
                   </div>
                   <div className="text-right">
                       <p className="font-bold text-sm">{item.amount}</p>
                       <p className="text-[10px] text-muted-foreground border border-border px-2 rounded-full mt-1">Daily Wages</p>
                   </div>
                </motion.div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
