import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, CalendarCheck, Search } from "lucide-react";
import API from "../services/api";
import { Card, StatCard } from "../components/StatCard";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [site, setSite] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock data or API call
        // const res = await API.get("/admin/dashboard");
        setSite({ name: "Downtown Complex", location: "Sector 45", activeWorkers: 18 });
        setWorkers([
          { _id: 1, name: "Rahul Kumar", role: "Mistri", phone: "9876543210", status: "Present" },
          { _id: 2, name: "Amit Singh", role: "Labour", phone: "8765432109", status: "Absent" },
          { _id: 3, name: "Suresh", role: "Labour", phone: "7654321098", status: "Pending" },
        ]);
      } catch (error) {
        toast.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const markAttendance = (id, status) => {
    setWorkers(workers.map(w => w._id === id ? { ...w, status } : w));
    toast.success(`Marked as ${status}`);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
           <p className="text-muted-foreground text-sm max-w-lg">Manage site operations and daily attendance.</p>
           {user?.owner?.name && (
               <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-sm font-semibold">
                   <Users size={16} /> <span>Assigned to: {user.owner.name}</span>
               </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card delay={0.1}>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Assigned Site</p>
              <h3 className="text-xl font-bold">{site?.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{site?.location}</p>
            </div>
          </div>
        </Card>
        <StatCard title="Active Workers Today" value={site?.activeWorkers} icon={Users} trend={2} delay={0.2} />
      </div>

      <Card delay={0.3} className="overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold">Quick Attendance</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="text" placeholder="Search worker..." className="pl-9 pr-4 py-2 rounded-lg bg-background border outline-none focus:border-primary text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-semibold text-sm text-muted-foreground">Name</th>
                <th className="pb-3 font-semibold text-sm text-muted-foreground">Role</th>
                <th className="pb-3 font-semibold text-sm text-muted-foreground">Status</th>
                <th className="pb-3 font-semibold text-sm text-muted-foreground text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker._id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-4 font-medium">{worker.name}</td>
                  <td className="py-4 text-sm text-muted-foreground">{worker.role}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      worker.status === 'Present' ? 'bg-green-500/20 text-green-500' :
                      worker.status === 'Absent' ? 'bg-red-500/20 text-red-500' :
                      'bg-orange-500/20 text-orange-500'
                    }`}>
                      {worker.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                     <div className="flex justify-end gap-2">
                        <button onClick={() => markAttendance(worker._id, 'Present')} className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-bold rounded-lg transition-colors">Present</button>
                        <button onClick={() => markAttendance(worker._id, 'Absent')} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-lg transition-colors">Absent</button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
