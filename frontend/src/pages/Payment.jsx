import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  IndianRupee, 
  Download, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  ArrowUpRight, 
  History, 
  ChevronRight,
  TrendingUp,
  Loader2,
  Calendar,
  CreditCard,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  Plus
} from "lucide-react";
import { Card } from "../components/StatCard";
import API from "../services/api";
import toast from "react-hot-toast";

const Payment = () => {
    const [workerSummaries, setWorkerSummaries] = useState([]);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSiteId, setSelectedSiteId] = useState("all");
    
    // Modal state for Recording Payment
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [payAmount, setPayAmount] = useState(0);
    const [processing, setProcessing] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryRes, siteRes] = await Promise.all([
                API.get("/payments/summary"),
                API.get("/sites")
            ]);

            if (summaryRes.data.success) setWorkerSummaries(summaryRes.data.data);
            if (siteRes.data.success) setSites(siteRes.data.data);
        } catch (error) {
            toast.error("Failed to load financial summaries");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredWorkers = workerSummaries.filter(w => {
        const workerName = w.name?.toLowerCase() || "";
        const workerPhone = w.phone || "";
        const search = searchTerm.toLowerCase();

        const matchesSearch = workerName.includes(search) || workerPhone.includes(search);
        const matchesSite = selectedSiteId === "all" || w.siteId === selectedSiteId;
        
        return matchesSearch && matchesSite;
    });

    const handleRecordPayment = async () => {
        if (payAmount <= 0) return toast.error("Please enter a valid amount");
        
        setProcessing(true);
        try {
            // Since we're doing a manual pay, we might need a "Direct Pay" endpoint 
            // or we use the latest pending settlement. 
            // For now, let's assume this records a payment against their total dues.
            // I'll create a manual-pay endpoint in the backend for this.
            
            const res = await API.post("/payments/direct-pay", { 
                workerId: selectedWorker._id,
                amount: payAmount 
            });

            if (res.data.success) {
                toast.success(`₹${payAmount} settlement recorded for ${selectedWorker.name}`);
                setIsPayOpen(false);
                fetchData();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Payment recording failed");
        } finally {
            setProcessing(false);
        }
    };

    const stats = {
        totalOutstanding: workerSummaries.reduce((acc, w) => acc + w.dueAmount, 0),
        totalDisbursed: workerSummaries.reduce((acc, w) => acc + w.totalPaid, 0),
        activeWorkforce: workerSummaries.filter(w => w.dueAmount > 0).length
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                   <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Financial Accounts
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg font-medium">Live ledger for workforce settlements.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-2xl font-black text-sm hover:bg-primary hover:text-primary-foreground transition-all shadow-xl shadow-primary/10">
                        <Download size={18} /> Export Payroll
                    </button>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/attendance")} // Link to where they mark attendance to generate dues
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-primary/25 hover:brightness-110"
                    >
                        <Plus size={18} /> New Payroll Session
                    </motion.button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                        <IndianRupee size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                                <Wallet size={24} />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-widest text-primary/70">Outstanding Due</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-black tabular-nums">₹{stats.totalOutstanding.toLocaleString()}</span>
                           <span className="text-xs font-bold text-muted-foreground">Total Wages Payable</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                        <CheckCircle2 size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-500/20">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-widest text-green-600/70">Lifetime Paid</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-black tabular-nums">₹{stats.totalDisbursed.toLocaleString()}</span>
                           <span className="text-xs font-bold text-muted-foreground">Total Disbursed</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                        <User size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/20">
                                <Clock size={24} />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-widest text-orange-600/70">Workers with Dues</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-black tabular-nums">{stats.activeWorkforce}</span>
                           <span className="text-xs font-bold text-muted-foreground">Personnel to be settled</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Ledger Area */}
            <Card className="p-0 border-none bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[500px]">
                {/* Search & Filter Bar */}
                <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-center gap-6 bg-muted/20">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find worker by name or phone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background/50 border border-border focus:border-primary rounded-2xl py-3.5 pl-12 pr-4 outline-none text-sm font-medium transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-background/50 border border-border rounded-xl px-4 py-2 text-sm font-bold text-muted-foreground">
                            <Filter size={16} />
                            <span>Filter Site:</span>
                            <select 
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                                className="bg-transparent outline-none text-foreground border-none cursor-pointer"
                            >
                                <option value="all">Every Location</option>
                                {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="py-40 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={48} />
                        <p className="mt-4 font-black text-muted-foreground tracking-widest uppercase text-[10px]">Aggregating Master Ledgers...</p>
                    </div>
                ) : filteredWorkers.length === 0 ? (
                    <div className="py-40 text-center space-y-4">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground/20">
                            <User size={40} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Personnel Registry Empty</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto font-medium">No workers match your current selection.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted/30 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-black border-b border-border/50">
                                <tr>
                                    <th className="px-8 py-6">Identity</th>
                                    <th className="px-8 py-6">Worker Type</th>
                                    <th className="px-8 py-6">Due Wages</th>
                                    <th className="px-8 py-6">Amount Paid</th>
                                    <th className="px-8 py-6 text-right">Settlement Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredWorkers.map((worker, idx) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={worker._id} 
                                        className="hover:bg-primary/5 transition-all group"
                                    >
                                        <td className="px-8 py-7">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center font-black text-xl text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                                                    {(worker.name?.[0] || "?").toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm tracking-tight">{worker.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{worker.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                                                {worker.workerType || "Labour"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black ${worker.dueAmount > 0 ? "text-red-500" : "text-green-500"}`}>
                                                    ₹{worker.dueAmount.toLocaleString()}
                                                </span>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Total Earned: ₹{worker.totalEarned.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 font-black text-sm text-foreground">
                                            ₹{worker.totalPaid.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-7 text-right">
                                            <motion.button 
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setSelectedWorker(worker);
                                                    setPayAmount(worker.dueAmount > 0 ? worker.dueAmount : 0);
                                                    setIsPayOpen(true);
                                                }}
                                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                    worker.dueAmount > 0 
                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                                    : "bg-muted text-muted-foreground opacity-50"
                                                }`}
                                            >
                                                Pay Now
                                            </motion.button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* PAYMENT MODAL */}
            <AnimatePresence>
                {isPayOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsPayOpen(false)}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden relative z-10"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                        <Wallet size={28} />
                                    </div>
                                    <button onClick={() => setIsPayOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-all"><XCircle className="text-muted-foreground" /></button>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black tracking-tight tracking-tight leading-none">Record Disbursement</h3>
                                    <p className="text-muted-foreground font-medium text-sm">Settling dues for <span className="text-foreground font-bold">{selectedWorker?.name}</span>.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-muted/30 rounded-2xl border border-border">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
                                            <span>Outstanding Dues</span>
                                            <span className="text-red-500">₹{selectedWorker?.dueAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="relative">
                                            <IndianRupee size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                            <input 
                                                type="number" 
                                                inputMode="decimal"
                                                autoFocus
                                                value={payAmount}
                                                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-background border border-border focus:border-primary rounded-2xl py-5 pl-12 pr-4 outline-none text-2xl font-black transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-background border border-border rounded-2xl text-center shadow-inner">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Lifetime Earned</p>
                                            <p className="text-lg font-black tracking-tight">₹{selectedWorker?.totalEarned.toLocaleString()}</p>
                                        </div>
                                        <div className="p-4 bg-background border border-border rounded-2xl text-center shadow-inner">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Already Paid</p>
                                            <p className="text-lg font-black tracking-tight text-green-500">₹{selectedWorker?.totalPaid.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleRecordPayment}
                                    disabled={processing}
                                    className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {processing ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    Finalize Settlement
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Payment;
