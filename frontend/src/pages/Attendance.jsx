import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Clock, 
  Save, 
  Loader2,
  ChevronRight,
  TrendingUp,
  History,
  Eye,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Card } from "../components/StatCard";
import API from "../services/api";
import toast from "react-hot-toast";

const Attendance = () => {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [workers, setWorkers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { workerId: { present: bool, overtime: number, remark: string } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // History Modal States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyWorker, setHistoryWorker] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  
  // Site Stats State
  const [siteStats, setSiteStats] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch sites
      const sitesRes = await API.get("/sites");
      if (sitesRes.data.success && sitesRes.data.data.length > 0) {
        setSites(sitesRes.data.data);
        setSelectedSiteId(sitesRes.data.data[0]._id);
      } else if (sitesRes.data.success) {
        setSites([]);
      }

      // Fetch all workers to filter by site
      const workersRes = await API.get("/owners/workers");
      if (workersRes.data.success) {
        setWorkers(workersRes.data.data);
      }
    } catch (error) {
      toast.error("Failed to load initial data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openHistoryModal = async (worker) => {
    setHistoryWorker(worker);
    setIsHistoryOpen(true);
    setFetchingHistory(true);
    try {
      const res = await API.get(`/attendance/history/${worker._id}`);
      if (res.data.success) {
        setHistoryLogs(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load attendance history");
    } finally {
      setFetchingHistory(false);
    }
  };

  const fetchSiteStats = async (siteId) => {
    if (!siteId) return;
    try {
      const res = await API.get(`/sites/stats/${siteId}`);
      if (res.data.success) {
        setSiteStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch site stats", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      fetchSiteStats(selectedSiteId);
    }
  }, [selectedSiteId]);

  const getTimeAgo = (date) => {
    if (!date) return null;
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const filteredWorkers = workers.filter(w => 
    w.siteId === selectedSiteId && 
    (w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.phone.includes(searchTerm))
  );

  const handleToggleAttendance = (workerId) => {
    setAttendanceData(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        present: !prev[workerId]?.present,
        overtime: prev[workerId]?.present ? 0 : (prev[workerId]?.overtime || 0)
      }
    }));
  };

  const handleOvertimeChange = (workerId, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        overtime: parseFloat(value) || 0
      }
    }));
  };

  const handleSaveAttendance = async () => {
    const records = Object.entries(attendanceData)
      .filter(([_, data]) => data.present)
      .map(([workerId, data]) => ({
        workerId,
        siteId: selectedSiteId,
        date,
        hoursWorked: 8, // Standard shift
        overtimeHours: data.overtime || 0,
        remark: data.remark || ""
      }));

    if (records.length === 0) {
      return toast.error("No present workers selected to save.");
    }

    setSaving(true);
    try {
      let successCount = 0;
      // Since backend doesn't have batch API, we call it for each.
      // In a real app, I'd add a batch endpoint.
      for (const record of records) {
        try {
          await API.post("/attendance/mark", record);
          successCount++;
        } catch (e) {
          console.error(`Failed to mark for ${record.workerId}`, e);
        }
      }
      
      if (successCount === records.length) {
        toast.success(`Successfully marked attendance for ${successCount} workers!`);
        setAttendanceData({}); // Reset
        fetchSiteStats(selectedSiteId);
      } else {
        toast.error(`Marked ${successCount} out of ${records.length}. Some might have already been marked.`);
        fetchSiteStats(selectedSiteId);
      }
    } catch (error) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const activeSite = sites.find(s => s._id === selectedSiteId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Attendance Protocol
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Daily deployment logging for site: <span className="text-foreground font-bold">{activeSite?.name || "Select a site"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-card border border-border focus:border-primary rounded-2xl py-3 pl-12 pr-4 outline-none font-bold text-sm shadow-sm transition-all"
                />
            </div>
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveAttendance}
                disabled={saving || filteredWorkers.length === 0}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-primary/25 hover:brightness-110 disabled:opacity-50 transition-all"
            >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Submit Records
            </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Site Selection Sidebar */}
        <div className="xl:col-span-1 space-y-4">
            <div className="flex items-center gap-2 px-2 mb-4">
                <MapPin size={18} className="text-primary" />
                <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Active Sites</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {sites.map((site) => (
                    <button
                        key={site._id}
                        onClick={() => setSelectedSiteId(site._id)}
                        className={`p-4 rounded-2xl text-left transition-all border-2 group relative overflow-hidden ${
                            selectedSiteId === site._id 
                            ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                            : "bg-card border-border hover:border-primary/50 text-foreground"
                        }`}
                    >
                        <div className="relative z-10">
                            <p className={`font-bold text-sm mb-1 ${selectedSiteId === site._id ? "text-primary-foreground" : "text-foreground"}`}>
                                {site.name}
                            </p>
                            <p className={`text-xs ${selectedSiteId === site._id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {site.location}
                            </p>
                        </div>
                        {selectedSiteId === site._id && (
                            <motion.div 
                                layoutId="activeSite"
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                            >
                                <ChevronRight size={20} />
                            </motion.div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Worker Table */}
        <div className="xl:col-span-3 space-y-6">
            <Card className="p-0 border-none bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Enter worker name..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background/50 border border-border focus:border-primary rounded-2xl py-3 pl-12 pr-4 outline-none text-sm transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-xl border border-border">
                            <Users size={16} />
                            <span className="font-bold">{filteredWorkers.length} Assigned</span>
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-xl border border-border">
                            <TrendingUp size={16} className="text-green-500" />
                            <span className="font-bold text-green-500">
                                {Object.values(attendanceData).filter(d => d.present).length} Present
                            </span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={40} />
                        <p className="mt-4 font-bold text-muted-foreground">Synchronizing Workforce...</p>
                    </div>
                ) : filteredWorkers.length === 0 ? (
                    <div className="py-32 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                            <Users size={32} />
                        </div>
                        <h3 className="text-xl font-bold">No Workers Available</h3>
                        <p className="text-muted-foreground mt-1">Adjust site selection or search query.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted/30 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-black">
                                <tr>
                                    <th className="px-8 py-5">Personnel</th>
                                    <th className="px-8 py-5">Role / Type</th>
                                    <th className="px-8 py-5">Shift Status</th>
                                    <th className="px-8 py-5">Overtime (Hrs)</th>
                                    <th className="px-8 py-5 text-right">Quick Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredWorkers.map((worker, idx) => {
                                    const data = attendanceData[worker._id] || { present: false, overtime: 0 };
                                    return (
                                        <motion.tr 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            key={worker._id} 
                                            className={`hover:bg-primary/5 transition-all group ${data.present ? "bg-primary/5" : ""}`}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                                                        data.present ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                    }`}>
                                                        {worker.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm tracking-tight">{worker.name}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground/60">{worker.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-flex flex-col">
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{worker.role}</span>
                                                    <span className="text-[10px] font-bold italic text-primary">{worker.workerType || "N/A"}</span>
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button 
                                                    onClick={() => handleToggleAttendance(worker._id)}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all border-2 ${
                                                        data.present 
                                                        ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20" 
                                                        : "bg-background/50 border-border text-muted-foreground hover:border-primary/50"
                                                    }`}
                                                >
                                                    {data.present ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                    {data.present ? "Present" : "Mark Present"}
                                                </button>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 bg-background/50 border border-border rounded-xl px-2 py-1 w-24 focus-within:border-primary transition-all">
                                                    <Clock size={14} className="text-muted-foreground" />
                                                    <input 
                                                        type="number" 
                                                        inputMode="numeric"
                                                        min="0"
                                                        max="8"
                                                        disabled={!data.present}
                                                        value={data.overtime}
                                                        onChange={(e) => handleOvertimeChange(worker._id, e.target.value)}
                                                        className="w-full bg-transparent outline-none text-xs font-black disabled:opacity-30"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`text-[10px] font-black uppercase ${data.present ? "text-green-500" : "text-muted-foreground/30"}`}>
                                                            {data.present ? "Full Day" : "Inactive"}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-muted-foreground/50">Shift: 08:00 - 17:00</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => openHistoryModal(worker)}
                                                        className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-all"
                                                        title="View Past Attendance"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-card to-muted border-none p-6 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <History size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Recent Activity</h4>
                            <p className="text-xs font-bold text-muted-foreground mt-1">
                                {siteStats?.lastActivity ? (
                                    <>Attendance for <span className="text-foreground">{activeSite?.name}</span> was last updated <span className="text-primary font-black uppercase tracking-tighter">{getTimeAgo(siteStats.lastActivity)}</span>.</>
                                ) : (
                                    <>No recent activity recorded for <span className="text-foreground">{activeSite?.name}</span></>
                                )}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-card to-muted border-none p-6 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Shift Retention</h4>
                            <p className="text-xs font-bold text-muted-foreground mt-1">
                                Today's deployment is <span className="text-green-500">{siteStats?.retentionRate || 0}%</span> of total assigned personnel.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
        
        <HistoryModal 
            isOpen={isHistoryOpen} 
            onClose={() => setIsHistoryOpen(false)} 
            worker={historyWorker} 
            logs={historyLogs} 
            loading={fetchingHistory} 
        />
      </div>
    </div>
  );
};

// Past Attendance Modal Component (Internal)
const HistoryModal = ({ isOpen, onClose, worker, logs, loading }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl border border-border overflow-hidden relative z-10 flex flex-col"
                >
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 shadow-inner">
                                {worker?.name?.[0]}
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">{worker?.name}</h2>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Archive: Past 30 Days</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-background hover:bg-muted rounded-2xl transition-all border border-border active:scale-90">
                           <XCircle size={20} className="text-muted-foreground" />
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <p className="text-sm font-bold text-muted-foreground mt-4">Retreiving History...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto text-muted-foreground/30 border border-border/50">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-lg font-bold">No Records Found</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto italic">This worker hasn't been logged in any shifts over the past 30 days.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logs.map((log, i) => (
                                    <div key={log._id} className="p-4 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-background rounded-xl border border-border group-hover:scale-110 transition-transform">
                                                <Calendar size={18} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm">{new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                    <MapPin size={10} /> {log.siteId?.name || "Unknown Site"}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-green-500">Present</p>
                                                <p className="text-[10px] font-bold text-muted-foreground">8h Normal</p>
                                            </div>
                                            {log.overtimeHours > 0 && (
                                                <div className="px-3 py-1 bg-orange-500/10 border border-orange-200 rounded-lg">
                                                    <p className="text-[10px] font-black text-orange-600">+{log.overtimeHours} Overtime</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                           <History size={12} /> Data synced with central server
                        </p>
                        <button onClick={onClose} className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                            Done
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

export default Attendance;
