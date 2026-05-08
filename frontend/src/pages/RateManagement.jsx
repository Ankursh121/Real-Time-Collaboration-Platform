import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IndianRupee, 
  Plus, 
  History, 
  MapPin, 
  Users, 
  Clock, 
  Save, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  HardHat,
  ShieldCheck
} from "lucide-react";
import { Card } from "../components/StatCard";
import API from "../services/api";
import toast from "react-hot-toast";

const RateManagement = () => {
    const [sites, setSites] = useState([]);
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        siteId: "global",
        workerType: "Labour",
        dailyRate: "",
        overtimeRatePerHour: ""
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [siteRes, rateRes] = await Promise.all([
                API.get("/sites"),
                API.get("/rates")
            ]);
            
            if (siteRes.data.success) setSites(siteRes.data.data);
            if (rateRes.data.success) setRates(rateRes.data.data);
        } catch (error) {
            toast.error("Failed to sync financial parameters");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSetRate = async (e) => {
        e.preventDefault();
        if (!formData.dailyRate || !formData.overtimeRatePerHour) {
            return toast.error("Please define all compensation values");
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                siteId: formData.siteId === "global" ? null : formData.siteId,
                dailyRate: parseFloat(formData.dailyRate),
                overtimeRatePerHour: parseFloat(formData.overtimeRatePerHour)
            };

            const res = await API.post("/rates/set", payload);
            if (res.data.success) {
                toast.success("Compensation parameters updated");
                fetchData();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Action failed");
        } finally {
            setSaving(false);
        }
    };

    const activeRates = rates.filter(r => r.isActive);
    const archiveRates = rates.filter(r => !r.isActive).slice(0, 10);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <header>
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Wage Configuration
                </h1>
                <p className="text-muted-foreground mt-2 text-lg font-medium">Define regional and role-based daily remuneration.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <Card className="lg:col-span-1 border-none shadow-2xl bg-card/50 backdrop-blur-xl h-fit">
                    <form onSubmit={handleSetRate} className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <Plus size={24} />
                            </div>
                            <h2 className="text-xl font-black tracking-tight">New Directive</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <MapPin size={12} /> Operational Site
                                </label>
                                <select 
                                    value={formData.siteId}
                                    onChange={(e) => setFormData({...formData, siteId: e.target.value})}
                                    className="w-full bg-background border border-border focus:border-primary rounded-2xl py-4 px-4 outline-none font-bold text-sm transition-all"
                                >
                                    <option value="global">Default (Global)</option>
                                    {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Users size={12} /> Category
                                </label>
                                <select 
                                    value={formData.workerType}
                                    onChange={(e) => setFormData({...formData, workerType: e.target.value})}
                                    className="w-full bg-background border border-border focus:border-primary rounded-2xl py-4 px-4 outline-none font-bold text-sm transition-all"
                                >
                                    <option value="Labour">Labour</option>
                                    <option value="Mistri">Mistri</option>
                                    <option value="Satring-Labour">Shuttering Labour</option>
                                    <option value="Satring-Mistri">Shuttering Mistri</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <IndianRupee size={12} /> Daily Rate
                                </label>
                                <div className="relative">
                                    <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input 
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={formData.dailyRate}
                                        onChange={(e) => setFormData({...formData, dailyRate: e.target.value})}
                                        className="w-full bg-background border border-border focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none font-black text-lg transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Clock size={12} /> Overtime (Per Hour)
                                </label>
                                <input 
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={formData.overtimeRatePerHour}
                                    onChange={(e) => setFormData({...formData, overtimeRatePerHour: e.target.value})}
                                    className="w-full bg-background border border-border focus:border-primary rounded-2xl py-4 px-4 outline-none font-black text-lg transition-all"
                                />
                            </div>
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={saving}
                            className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Enforce Rates
                        </motion.button>
                    </form>
                </Card>

                {/* Rates List */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none bg-card/50 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
                        <div className="p-6 border-b border-border/50 bg-muted/20">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-primary">
                                <CheckCircle2 size={24} /> Active Remuneration Matrix
                            </h3>
                        </div>
                        
                        {loading ? (
                            <div className="py-40 flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary" size={40} />
                            </div>
                        ) : activeRates.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <AlertCircle size={40} className="mx-auto text-muted-foreground/30" />
                                <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No active configurations</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                        <tr>
                                            <th className="px-8 py-5">Site Origin</th>
                                            <th className="px-8 py-5">Classification</th>
                                            <th className="px-8 py-5 text-right">Daily Yield</th>
                                            <th className="px-8 py-5 text-right">OT Compensation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {activeRates.map((r, idx) => (
                                            <motion.tr 
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={r._id} 
                                                className="hover:bg-primary/5 transition-all group"
                                            >
                                                <td className="px-8 py-6 font-bold">{r.siteId?.name || "Global / Default"}</td>
                                                <td className="px-8 py-6">
                                                    <span className="flex items-center gap-2 font-black text-sm">
                                                        {r.workerType === 'Mistri' ? <ShieldCheck size={16} className="text-orange-500" /> : <HardHat size={16} className="text-blue-500" />}
                                                        {r.workerType}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right font-black text-lg text-primary">₹{r.dailyRate}</td>
                                                <td className="px-8 py-6 text-right font-bold text-muted-foreground">₹{r.overtimeRatePerHour}/hr</td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    {/* Ledger History */}
                    {archiveRates.length > 0 && (
                        <Card className="border-none bg-muted/20 backdrop-blur-xl shadow-xl p-0 overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
                            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                                <h3 className="text-lg font-black tracking-tight flex items-center gap-2 text-muted-foreground">
                                    <History size={20} /> Rate Archive
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <tbody className="divide-y divide-border/20">
                                        {archiveRates.map(r => (
                                            <tr key={r._id} className="text-muted-foreground">
                                                <td className="px-8 py-4">{r.siteId?.name || "Global"}</td>
                                                <td className="px-8 py-4 font-bold">{r.workerType}</td>
                                                <td className="px-8 py-4 text-right">₹{r.dailyRate}</td>
                                                <td className="px-8 py-4 text-right">₹{r.overtimeRatePerHour} OT</td>
                                                <td className="px-8 py-4 text-right italic">{new Date(r.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RateManagement;
