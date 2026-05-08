import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  UserMinus, 
  UserCheck, 
  Search, 
  Filter,
  Loader2,
  Plus,
  ArrowRight,
  Trash2,
  Settings,
  MapPin,
  X,
  Save,
  UserX,
  CreditCard,
  Briefcase
} from "lucide-react";
import { Card } from "../components/StatCard";
import API from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const navigate = useNavigate();

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
      workerType: "",
      DailyRate: 0,
      siteId: ""
  });
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, siteRes] = await Promise.all([
        API.get("/owners/workers"),
        API.get("/sites")
      ]);
      
      if (userRes.data.success) setUsers(userRes.data.data);
      if (siteRes.data.success) setSites(siteRes.data.data);
    } catch (error) {
      toast.error("Failed to sync team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (userId, action, label) => {
    try {
      let res;
      switch (action) {
        case "approve":
          res = await API.patch(`/owners/approve/${userId}`);
          break;
        case "deactivate":
          res = await API.patch(`/owners/deactivate/${userId}`);
          break;
        case "assign-admin":
          res = await API.patch(`/owners/assign-admin/${userId}`);
          break;
        case "remove-admin":
          res = await API.patch(`/owners/remove-admin/${userId}`);
          break;
        case "delete":
           if (!window.confirm("Are you sure you want to delete this user permanently?")) return;
           res = await API.delete(`/owners/delete/${userId}`);
           break;
        default:
          return;
      }

      if (res.data.success) {
        toast.success(`${label} successful`);
        fetchData();
      }
    } catch (error) {
      toast.error(`Operation failed: ${error?.response?.data?.message || "Unknown error"}`);
    }
  };

  const handleOpenEdit = (user) => {
      setEditingUser(user);
      setEditForm({
          workerType: user.workerType || "",
          DailyRate: user.DailyRate || 0,
          siteId: user.siteId || ""
      });
      setIsEditOpen(true);
  };

  const handleUpdateUser = async () => {
      setUpdating(true);
      try {
          const res = await API.patch(`/owners/update-profile/${editingUser._id}`, editForm);
          if (res.data.success) {
              toast.success("Profile updated successfully");
              setIsEditOpen(false);
              fetchData();
          }
      } catch (error) {
          toast.error("Failed to update profile");
      } finally {
          setUpdating(false);
      }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.phone.includes(searchTerm);
    const matchesRole = filterRole === "All" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Team Management
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Strategic oversight and role administration.
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/onboard")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black hover:brightness-110 transition-all shadow-xl shadow-primary/25 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          Onboard Personnel
        </motion.button>
      </div>

      <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-xl shadow-2xl">
        <div className="p-6 border-b border-border/50 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border focus:border-primary rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-background/50 border border-border rounded-2xl p-1 flex items-center gap-1">
                {["All", "Admin", "Worker"].map((role) => (
                    <button
                        key={role}
                        onClick={() => setFilterRole(role)}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            filterRole === role 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        {role}s
                    </button>
                ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <p className="font-black text-muted-foreground tracking-widest uppercase text-xs">Synchronizing Roster...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-40 text-center">
             <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-muted-foreground/20 border border-border/50">
                <Users size={40} />
             </div>
             <h3 className="text-2xl font-black tracking-tight mb-2">Operational Desert</h3>
             <p className="text-muted-foreground max-w-sm mx-auto font-medium">No results match your current parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-black">
                  <th className="px-8 py-6">Beneficiary</th>
                  <th className="px-8 py-6">Credentials / Role</th>
                  <th className="px-8 py-6">Deployment Status</th>
                  <th className="px-8 py-6">Site Allocation</th>
                  <th className="px-8 py-6 text-right">Administrative Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence mode="popLayout">
                    {filteredUsers.map((u, idx) => (
                    <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        key={u._id} 
                        className="hover:bg-primary/5 transition-all group"
                    >
                        <td className="px-8 py-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-black text-xl border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                                {u.name[0]}
                            </div>
                            <div>
                                <p className="font-black text-lg tracking-tight">{u.name}</p>
                                <p className="text-xs font-bold text-muted-foreground uppercase">{u.phone}</p>
                            </div>
                        </div>
                        </td>
                        <td className="px-8 py-8">
                            <div className="flex flex-col gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit ${
                                    u.role === 'Admin' 
                                        ? 'bg-orange-500/10 text-orange-600 border border-orange-200' 
                                        : 'bg-blue-500/10 text-blue-600 border border-blue-200'
                                }`}>
                                    {u.role === 'Admin' ? <ShieldCheck size={12} /> : <Users size={12} />}
                                    {u.role}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">{u.workerType || "Standard Member"}</span>
                            </div>
                        </td>
                        <td className="px-8 py-8">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                u.status === 'Active' 
                                    ? 'bg-green-500/10 text-green-600 border border-green-200' 
                                    : 'bg-yellow-500/10 text-yellow-600 border border-yellow-200'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`} />
                                {u.status}
                            </span>
                        </td>
                        <td className="px-8 py-8">
                            <div className="flex items-center gap-2 text-xs font-black text-muted-foreground">
                                <MapPin size={14} className={u.siteId ? "text-primary": "text-muted-foreground/30"} />
                                {u.siteId ? (
                                    <span className="text-foreground">{sites.find(s => s._id === u.siteId)?.name || "Assigned"}</span>
                                ) : (
                                    <span className="italic opacity-50 uppercase tracking-tighter">Unallocated</span>
                                )}
                            </div>
                        </td>
                        <td className="px-8 py-8 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button 
                                    onClick={() => handleOpenEdit(u)}
                                    className="p-3 bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-xl transition-all border border-transparent hover:border-primary/20"
                                    title="Edit Profile"
                                >
                                    <Settings size={18} />
                                </button>
                                
                                <div className="w-px h-6 bg-border mx-1" />

                                {u.status === 'Pending' ? (
                                    <button 
                                        onClick={() => handleAction(u._id, "approve", "Worker Approval")}
                                        className="p-3 bg-green-500 hover:brightness-110 text-white rounded-xl shadow-lg shadow-green-500/20"
                                        title="Approve User"
                                    >
                                        <UserCheck size={18} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleAction(u._id, "deactivate", "Worker Deactivation")}
                                        className="p-3 bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white rounded-xl transition-all"
                                        title="Deactivate User"
                                    >
                                        <UserX size={18} />
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => handleAction(u._id, "delete", "User Expulsion")}
                                    className="p-3 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                    title="Delete User Permanently"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </td>
                    </motion.tr>
                    ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      <AnimatePresence>
          {isEditOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }} 
                      onClick={() => setIsEditOpen(false)}
                      className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
                  />
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden relative z-10"
                  >
                      <div className="p-8 space-y-6">
                          <div className="flex justify-between items-center">
                              <div className="p-4 bg-primary/10 rounded-2xl text-primary flex items-center gap-2 font-black text-sm uppercase tracking-widest">
                                  <Settings size={20} /> Identity Settings
                              </div>
                              <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-all"><X className="text-muted-foreground" /></button>
                          </div>

                          <div className="space-y-1">
                              <h3 className="text-2xl font-black tracking-tight">{editingUser?.name}</h3>
                              <p className="text-muted-foreground font-medium uppercase text-xs tracking-tighter">Personnel Reference ID: {editingUser?._id}</p>
                          </div>

                          <div className="space-y-4">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                      <Briefcase size={12} /> Classification
                                  </label>
                                  <select 
                                    value={editForm.workerType}
                                    onChange={(e) => setEditForm({...editForm, workerType: e.target.value})}
                                    className="w-full bg-muted/30 border border-border focus:border-primary rounded-xl py-4 px-4 outline-none font-bold text-sm"
                                  >
                                      <option value="">Select Category</option>
                                      <option value="Labour">Labour</option>
                                      <option value="Mistri">Mistri</option>
                                      <option value="Satring-Labour">Shuttering Labour</option>
                                      <option value="Satring-Mistri">Shuttering Mistri</option>
                                  </select>
                              </div>

                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                      <CreditCard size={12} /> Daily Remuneration
                                  </label>
                                  <input 
                                    type="number"
                                    inputMode="decimal"
                                    value={editForm.DailyRate}
                                    onChange={(e) => setEditForm({...editForm, DailyRate: parseFloat(e.target.value)})}
                                    className="w-full bg-muted/30 border border-border focus:border-primary rounded-xl py-4 px-4 outline-none font-black"
                                  />
                              </div>

                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                      <MapPin size={12} /> Operational Site
                                  </label>
                                  <select 
                                    value={editForm.siteId}
                                    onChange={(e) => setEditForm({...editForm, siteId: e.target.value})}
                                    className="w-full bg-muted/30 border border-border focus:border-primary rounded-xl py-4 px-4 outline-none font-bold text-sm"
                                  >
                                      <option value="">Unallocated (Bench)</option>
                                      {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                  </select>
                              </div>
                          </div>

                          <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleUpdateUser}
                              disabled={updating}
                              className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-3"
                          >
                              {updating ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                              Synchronize Directives
                          </motion.button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
