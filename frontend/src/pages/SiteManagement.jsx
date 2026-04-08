import React, { useState, useEffect } from "react";
import { Card } from "../components/StatCard";
import { MapPin, Plus, Users, Settings, X, Loader2, Building, NotebookText, ArrowRight, CalendarCheck, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api";
import toast from "react-hot-toast";

const SiteManagement = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  
  // Form states
  const [newSite, setNewSite] = useState({ name: "", location: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  
  // Assignment states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedWorkerName, setSelectedWorkerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Delete site states
  const [deleteStep, setDeleteStep] = useState(null); // null | 'confirm' | 'otp'
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSites = async () => {
    try {
      const res = await API.get("/sites");
      if (res.data.success) {
        setSites(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load sites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleAddSite = async (e) => {
    e.preventDefault();
    if (!newSite.name || !newSite.location) {
        return toast.error("Name and location are required.");
    }
    setSubmitting(true);
    try {
      const res = await API.post("/sites", newSite);
      if (res.data.success) {
        toast.success("Site added successfully");
        setSites([res.data.data, ...sites]);
        setIsAddModalOpen(false);
        setNewSite({ name: "", location: "", description: "" });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create site");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (site) => {
      setSelectedSite(site);
      try {
          const statsRes = await API.get(`/sites/stats/${site._id}`);
          if (statsRes.data.success) {
              setSelectedSite({ ...site, stats: statsRes.data.data });
          }
      } catch (e) {
          console.error("Failed to fetch detailed stats", e);
      }
  };

  const openAssignModal = async () => {
      try {
          const res = await API.get("/owners/workers");
          if (res.data.success) {
              setAvailableWorkers(res.data.data);
              setSelectedWorkerId("");
              setSelectedWorkerName("");
              setSearchQuery("");
              setShowSuggestions(false);
              setIsAssignModalOpen(true);
          }
      } catch (error) {
          toast.error("Failed to load available workforce");
      }
  };

  const filteredWorkers = availableWorkers.filter(w => {
      const q = searchQuery.toLowerCase();
      return (
          w.name?.toLowerCase().includes(q) ||
          w.role?.toLowerCase().includes(q) ||
          w.workerType?.toLowerCase().includes(q)
      );
  });

  const handleAssignWorker = async (e) => {
      e.preventDefault();
      if (!selectedWorkerId) return toast.error("Select a worker first.");
      
      // Prevent re-adding someone already here
      const worker = availableWorkers.find(w => w._id === selectedWorkerId);
      if (worker?.siteId === selectedSite?._id) {
          return toast.error(`${worker.name} is already assigned to this site.`);
      }
      
      setAssigning(true);
      try {
          const res = await API.patch(`/sites/assign-worker/${selectedSite._id}`, {
              workerId: selectedWorkerId
          });
          if (res.data.success) {
              toast.success(`${res.data.data.name} assigned to ${selectedSite.name}`);
              setIsAssignModalOpen(false);
              setSelectedWorkerId("");
              setSelectedWorkerName("");
              setSearchQuery("");
              handleViewDetails(selectedSite);
          }
      } catch (error) {
          toast.error("Assignment failed");
      } finally {
          setAssigning(false);
      }
  };

  const handleRemoveWorker = async (workerId, workerName) => {
      try {
          const res = await API.patch(`/sites/remove-worker/${selectedSite._id}`, {
              workerId
          });
          if (res.data.success) {
              toast.success(`${workerName} removed from ${selectedSite.name}`);
              setAvailableWorkers(prev =>
                  prev.map(w => w._id === workerId ? { ...w, siteId: null } : w)
              );
              handleViewDetails(selectedSite);
          }
      } catch (error) {
          toast.error("Failed to remove worker");
      }
  };

  const handleRequestDelete = async () => {
      setDeleteLoading(true);
      try {
          const res = await API.post(`/sites/request-delete/${selectedSite._id}`);
          if (res.data.success) {
              toast.success("OTP sent to your registered number");
              setDeleteStep('otp');
              setDeleteOtp("");
          }
      } catch (error) {
          toast.error(error?.response?.data?.message || "Failed to send OTP");
      } finally {
          setDeleteLoading(false);
      }
  };

  const handleConfirmDelete = async (e) => {
      e.preventDefault();
      if (!deleteOtp) return toast.error("Enter the OTP");
      setDeleteLoading(true);
      try {
          const res = await API.delete(`/sites/confirm-delete/${selectedSite._id}`, {
              data: { otp: deleteOtp }
          });
          if (res.data.success) {
              toast.success(res.data.message || "Site deleted successfully");
              setSites(prev => prev.filter(s => s._id !== selectedSite._id));
              setSelectedSite(null);
              setDeleteStep(null);
              setDeleteOtp("");
          }
      } catch (error) {
          toast.error(error?.response?.data?.message || "Invalid OTP");
      } finally {
          setDeleteLoading(false);
      }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites Manager</h1>
          <p className="text-muted-foreground mt-1">Deploy and manage operations across all locations.</p>
        </div>
        <button 
           onClick={() => setIsAddModalOpen(true)}
           className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
        >
           <Plus size={18} strokeWidth={3} /> Add New Site
        </button>
      </div>

      {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : sites.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
              <Building size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold">No Sites Found</h3>
              <p className="text-muted-foreground mt-1 mb-4">You haven't setup any worksites yet.</p>
              <button onClick={() => setIsAddModalOpen(true)} className="text-primary font-bold hover:underline">Create your first site</button>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
                <Card 
                  key={site._id} 
                  onClick={() => handleViewDetails(site)}
                  className="group cursor-pointer hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                                <MapPin size={20} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${site.isActive ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                                {site.isActive ? "Active" : "Closed"}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{site.name}</h3>
                        <p className="text-sm text-muted-foreground mb-6 line-clamp-1">{site.location}</p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-help" title="Registration ID">
                           <NotebookText size={16} />
                           {site._id.substring(site._id.length - 6).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1 text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            View <ArrowRight size={16} />
                        </div>
                    </div>
                </Card>
            ))}
          </div>
      )}

      {/* ADD NEW SITE MODAL */}
      <AnimatePresence>
          {isAddModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     onClick={() => setIsAddModalOpen(false)}
                     className="absolute inset-0 bg-black/90"
                  />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                     animate={{ opacity: 1, scale: 1, y: 0 }} 
                     exit={{ opacity: 0, scale: 0.95, y: 20 }}
                     className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden relative z-10"
                  >
                      <div className="p-6 border-b border-border flex justify-between items-center bg-muted">
                          <h2 className="text-xl font-bold">Deploy New Site</h2>
                          <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-background hover:bg-muted rounded-full transition-colors"><X size={18}/></button>
                      </div>
                      <form onSubmit={handleAddSite} className="p-6 space-y-4">
                          <div className="space-y-2">
                              <label className="text-sm font-bold ml-1">Site Designation Name</label>
                              <input 
                                required
                                value={newSite.name} 
                                onChange={e => setNewSite({...newSite, name: e.target.value})}
                                type="text" 
                                placeholder="e.g. Phase 3 Concrete Floor" 
                                className="w-full bg-background border border-input focus:border-primary rounded-xl py-3 px-4 outline-none transition-colors"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-sm font-bold ml-1">Geographical Location</label>
                              <input 
                                required
                                value={newSite.location} 
                                onChange={e => setNewSite({...newSite, location: e.target.value})}
                                type="text" 
                                placeholder="e.g. Sector 45, Downtown" 
                                className="w-full bg-background border border-input focus:border-primary rounded-xl py-3 px-4 outline-none transition-colors"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-sm font-bold ml-1">Description (Optional)</label>
                              <textarea 
                                value={newSite.description} 
                                onChange={e => setNewSite({...newSite, description: e.target.value})}
                                rows="3"
                                placeholder="Details about specific milestones..."
                                className="w-full bg-background border border-input focus:border-primary rounded-xl py-3 px-4 outline-none transition-colors resize-none"
                              ></textarea>
                          </div>
                          <button 
                             disabled={submitting}
                             type="submit" 
                             className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl mt-4 shadow-lg shadow-primary/20 flex justify-center items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                          >
                             {submitting ? <Loader2 className="animate-spin" size={18} /> : "Initialize Site Protocol"}
                          </button>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* SITE DETAILS SIDE PANEL MODAL */}
      <AnimatePresence>
          {selectedSite && (
              <div className="fixed inset-0 z-[60] flex justify-end">
                  <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     onClick={() => setSelectedSite(null)}
                     className="absolute inset-0 bg-black/90"
                  />
                  <motion.div 
                     initial={{ x: "100%" }} 
                     animate={{ x: 0 }} 
                     exit={{ x: "100%" }}
                     transition={{ type: "spring", damping: 25, stiffness: 200 }}
                     className="bg-card w-full max-w-md h-full shadow-2xl border-l border-border flex flex-col relative z-10"
                  >
                      {/* Header */}
                      <div className="p-6 border-b border-border flex justify-between items-start bg-muted flex-shrink-0">
                          <div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedSite.isActive ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                                  {selectedSite.isActive ? "Active Deployment" : "Terminated"}
                              </span>
                              <h2 className="text-2xl font-bold mt-3 leading-tight">{selectedSite.name}</h2>
                              <p className="text-muted-foreground text-sm flex items-center gap-1 mt-2">
                                  <MapPin size={14} /> {selectedSite.location}
                              </p>
                          </div>
                          <button onClick={() => setSelectedSite(null)} className="p-2 bg-background/50 hover:bg-background rounded-full transition-colors"><X size={20}/></button>
                      </div>
                      
                      {/* Scrollable body */}
                      <div className="p-6 flex-1 overflow-y-auto space-y-8 min-h-0">
                          {selectedSite.description && (
                              <div className="space-y-2">
                                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Site Brief</h4>
                                  <p className="text-sm leading-relaxed">{selectedSite.description}</p>
                              </div>
                          )}

                          <div className="space-y-4">
                               <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Live Statistics</h4>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                                       <Users size={20} className="text-primary mb-2" />
                                       <div className="text-2xl font-black">{selectedSite.stats?.totalWorkersOnSite || 0}</div>
                                       <div className="text-xs text-muted-foreground mt-1 font-medium">Assigned Workers</div>
                                   </div>
                                   <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                                       <CalendarCheck size={20} className="text-primary mb-2" />
                                       <div className="text-2xl font-black">{selectedSite.stats?.attendanceToday || 0}</div>
                                       <div className="text-xs text-muted-foreground mt-1 font-medium">Shift Check-ins</div>
                                   </div>
                               </div>
                          </div>

                          <div className="space-y-4 border-t border-border pt-6">
                               <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Administrative Actions</h4>
                               <div className="space-y-2">
                                  <button onClick={openAssignModal} className="w-full text-left px-4 py-3 bg-muted hover:bg-primary/10 hover:text-primary rounded-xl text-sm font-bold transition-colors flex items-center justify-between group border border-transparent hover:border-primary/20">
                                      Assign Worker / Admin <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>
                                  <button className="w-full text-left px-4 py-3 bg-muted hover:bg-primary/10 hover:text-primary rounded-xl text-sm font-bold transition-colors flex items-center justify-between group">
                                      Generate Payroll Sheet <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>
                               </div>
                          </div>
                      </div>

                      {/* Sticky Danger Zone Footer — always visible */}
                      <div className="p-4 border-t border-destructive/20 bg-destructive/[0.03] flex-shrink-0">
                          <p className="text-[10px] font-bold text-destructive/50 uppercase tracking-widest mb-2">Danger Zone</p>
                          <button
                              onClick={() => setDeleteStep('confirm')}
                              className="w-full px-4 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl text-sm font-bold transition-colors flex items-center justify-between group border border-destructive/20"
                          >
                              <span className="flex items-center gap-2"><Trash2 size={15} /> Remove This Site</span>
                              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>


      {/* ASSIGN WORKER/ADMIN MODAL */}
      <AnimatePresence>
          {isAssignModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     onClick={() => setIsAssignModalOpen(false)}
                     className="absolute inset-0 bg-black/90"
                  />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                     animate={{ opacity: 1, scale: 1, y: 0 }} 
                     exit={{ opacity: 0, scale: 0.95, y: 20 }}
                     className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden relative z-10"
                  >
                      <div className="p-6 border-b border-border flex justify-between items-center bg-muted">
                          <h2 className="text-xl font-bold">Deploy Personnel</h2>
                          <button onClick={() => setIsAssignModalOpen(false)} className="p-2 bg-background hover:bg-muted rounded-full transition-colors"><X size={18}/></button>
                      </div>
                      <form onSubmit={handleAssignWorker} className="p-6 space-y-4">
                          <div className="space-y-2 relative">
                              <label className="text-sm font-bold ml-1">Search Employee</label>
                              <div className="relative">
                                  <input
                                      type="text"
                                      value={searchQuery}
                                      onChange={(e) => {
                                          setSearchQuery(e.target.value);
                                          setSelectedWorkerId("");
                                          setSelectedWorkerName("");
                                          setShowSuggestions(true);
                                      }}
                                      onFocus={() => setShowSuggestions(true)}
                                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                      placeholder="Search by name, role, or type..."
                                      className="w-full bg-background border border-input focus:border-primary rounded-xl py-3 px-4 pr-10 outline-none transition-colors"
                                      autoComplete="off"
                                  />
                                  {selectedWorkerName && (
                                      <div className="mt-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm font-semibold text-primary flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                                          Selected: {selectedWorkerName}
                                      </div>
                                  )}
                              </div>
                              {showSuggestions && searchQuery && (
                                  <div className="absolute z-[200] left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                                      {filteredWorkers.length === 0 ? (
                                          <div className="px-4 py-3 text-sm text-muted-foreground text-center bg-popover">No employees found</div>
                                      ) : (
                                          filteredWorkers.map(w => {
                                              const isOnSite = w.siteId && w.siteId.toString() === selectedSite?._id?.toString();
                                              return (
                                                  <div
                                                      key={w._id}
                                                      className={`flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 transition-colors bg-popover ${
                                                          isOnSite ? 'bg-muted' : 'cursor-pointer hover:bg-accent'
                                                      }`}
                                                      onMouseDown={!isOnSite ? () => {
                                                          setSelectedWorkerId(w._id);
                                                          setSelectedWorkerName(`${w.name} (${w.role}${w.workerType ? ` - ${w.workerType}` : ''})`);
                                                          setSearchQuery(`${w.name}`);
                                                          setShowSuggestions(false);
                                                      } : undefined}
                                                  >
                                                      <div>
                                                          <div className="font-semibold text-sm">{w.name}</div>
                                                          <div className="text-xs text-muted-foreground mt-0.5">
                                                              {w.role}{w.workerType ? ` · ${w.workerType}` : ''}
                                                          </div>
                                                      </div>
                                                      {isOnSite ? (
                                                          <div className="flex items-center gap-2">
                                                              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">On Site</span>
                                                              <button
                                                                  type="button"
                                                                  onMouseDown={(e) => {
                                                                      e.stopPropagation();
                                                                      handleRemoveWorker(w._id, w.name);
                                                                  }}
                                                                  className="text-[10px] font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded-full transition-colors"
                                                              >
                                                                  Remove
                                                              </button>
                                                          </div>
                                                      ) : null}
                                                  </div>
                                              );
                                          })
                                      )}
                                  </div>
                              )}
                          </div>
                          
                          <button 
                             disabled={assigning || availableWorkers.length === 0}
                             type="submit" 
                             className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl mt-4 shadow-lg shadow-primary/20 flex justify-center items-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                          >
                             {assigning ? <Loader2 className="animate-spin" size={18} /> : "Finalize Assignment"}
                          </button>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
      {/* DELETE SITE — STEP 1: CONFIRM */}
      <AnimatePresence>
          {deleteStep === 'confirm' && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     onClick={() => setDeleteStep(null)}
                     className="absolute inset-0 bg-black/90"
                  />
                  <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-destructive/30 overflow-hidden relative z-10"
                  >
                      <div className="p-6 border-b border-border flex justify-between items-center bg-destructive/5">
                          <h2 className="text-xl font-bold text-destructive flex items-center gap-2"><AlertTriangle size={20} /> Confirm Deletion</h2>
                          <button onClick={() => setDeleteStep(null)} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={18}/></button>
                      </div>
                      <div className="p-6 space-y-4">
                          <p className="text-sm leading-relaxed text-muted-foreground">
                              You are about to <span className="font-bold text-foreground">permanently delete</span> the site <span className="font-bold text-destructive">"{selectedSite?.name}"</span>. All assigned workers will be unlinked. This action is <span className="font-bold">irreversible</span>.
                          </p>
                          <p className="text-sm font-semibold">An OTP will be sent to your registered phone number to confirm.</p>
                          <div className="flex gap-3 pt-2">
                              <button onClick={() => setDeleteStep(null)} className="flex-1 py-3 bg-muted rounded-xl font-bold text-sm transition-colors hover:bg-muted/80">Cancel</button>
                              <button
                                  onClick={handleRequestDelete}
                                  disabled={deleteLoading}
                                  className="flex-1 py-3 bg-destructive text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                              >
                                  {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <><ShieldAlert size={16} /> Send OTP</>}
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* DELETE SITE — STEP 2: OTP VERIFICATION */}
      <AnimatePresence>
          {deleteStep === 'otp' && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     onClick={() => setDeleteStep(null)}
                     className="absolute inset-0 bg-black/90"
                  />
                  <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-destructive/30 overflow-hidden relative z-10"
                  >
                      <div className="p-6 border-b border-border flex justify-between items-center bg-destructive/5">
                          <h2 className="text-xl font-bold text-destructive flex items-center gap-2"><ShieldAlert size={20} /> Enter OTP</h2>
                          <button onClick={() => { setDeleteStep(null); setDeleteOtp(""); }} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={18}/></button>
                      </div>
                      <form onSubmit={handleConfirmDelete} className="p-6 space-y-4">
                          <p className="text-sm text-muted-foreground">Enter the 6-digit OTP sent to your registered number to permanently delete <span className="font-bold text-foreground">"{selectedSite?.name}"</span>.</p>
                          <input
                              type="text"
                              maxLength={6}
                              value={deleteOtp}
                              onChange={e => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="_ _ _ _ _ _"
                              className="w-full bg-background border border-destructive/40 focus:border-destructive rounded-xl py-3 px-4 outline-none text-center text-2xl font-black tracking-[0.5em] transition-colors"
                              autoFocus
                          />
                          <button
                              disabled={deleteLoading || deleteOtp.length < 6}
                              type="submit"
                              className="w-full py-3 bg-destructive text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                          >
                              {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : "Permanently Delete Site"}
                          </button>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default SiteManagement;

