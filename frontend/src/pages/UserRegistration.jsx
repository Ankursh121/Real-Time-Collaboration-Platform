import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, User, Phone, Briefcase, MapPin, Upload, Building2, ShieldUser, HardHat, Loader2, ArrowRight, Lock } from "lucide-react";
import { Card } from "../components/StatCard";
import API from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const UserRegistration = () => {
  const [preview, setPreview] = useState(null);
  const [role, setRole] = useState("Worker");
  const [workerType, setWorkerType] = useState("Labour");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!name) return toast.error("Please provide a name.");
    if (phone.length < 10) return toast.error("Enter a valid 10-digit phone number.");
    if (role !== "Owner" && !inviteCode) return toast.error("Please enter a valid Owner Invite Code.");
    
    setLoading(true);
    try {
      const res = await API.post("/auth/send-otp", { phone });
      if (res.data.success) {
        toast.success("OTP sent to " + phone);
        setStep(2);
      }
    } catch (error) {
       toast.error(typeof error === 'string' ? error : error?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error("Enter a valid 6-digit OTP.");
    
    setLoading(true);
    try {
      const user = await login(phone, otp, role, workerType === "" ? undefined : workerType, name, inviteCode);
      
      if (user) {
        toast.success(role + " registered successfully!");
        // We do not reset the form here because we are immediately navigating away.
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(typeof error === 'string' ? error : error?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "Owner", icon: Building2, label: "Owner" },
    { id: "Admin", icon: ShieldUser, label: "Admin" },
    { id: "Worker", icon: HardHat, label: "Worker" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Register User</h1>
        <p className="text-muted-foreground mt-1">Onboard a new member to the management platform.</p>
      </div>

      <Card>
        <form onSubmit={step === 1 ? handleSendOTP : handleVerifyAndRegister} className="space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="details-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative w-32 h-32 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted flex items-center justify-center group cursor-pointer">
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-muted-foreground/50" />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera size={24} className="text-white" />
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mt-4">Upload Profile Photo</p>
                  </div>

                  <div className="space-y-3 border-b border-border pb-6">
                     <label className="text-sm font-semibold ml-1">Select User Role</label>
                     <div className="grid grid-cols-3 gap-4">
                        {roles.map((r) => {
                            const Icon = r.icon;
                            const isSelected = role === r.id;
                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => { setRole(r.id); setWorkerType(r.id === "Worker" ? "Labour" : ""); }}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                        isSelected 
                                        ? "border-primary bg-primary/10 text-primary shadow-sm" 
                                        : "border-border bg-card/50 hover:border-primary/50 text-muted-foreground hover:text-foreground dropdown-shadow"
                                    }`}
                                >
                                    <Icon size={24} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                                    <span className="text-sm font-bold">{r.label}</span>
                                </button>
                            );
                        })}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium ml-1">Full Name</label>
                      <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="John Doe" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-background border border-border focus:border-primary rounded-xl py-2 pl-10 pr-4 outline-none transition-colors" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input 
                            type="tel" 
                            placeholder="9876543210" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-background border border-border focus:border-primary rounded-xl py-2 pl-10 pr-4 outline-none transition-colors" 
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                        {role === "Worker" && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-2 col-span-1 md:col-span-2"
                          >
                            <label className="text-sm font-medium ml-1">Worker Designation & Skill</label>
                            <div className="relative">
                                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <select 
                                    value={workerType}
                                    onChange={(e) => setWorkerType(e.target.value)}
                                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-2 pl-10 pr-4 outline-none appearance-none transition-colors"
                                >
                                <option value="Labour">Labour</option>
                                <option value="Mistri">Mistri</option>
                                </select>
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {role !== "Owner" && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-2 col-span-1 md:col-span-2"
                          >
                            <label className="text-sm font-medium ml-1">Owner Invite Code</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Enter 6-digit Owner Code" 
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-2 pl-10 pr-4 outline-none transition-colors uppercase"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground ml-1 mt-1">Ask your site Owner for their unique invite code to securely bind your account.</p>
                          </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {(role === "Worker" || role === "Admin") && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-2 col-span-1 md:col-span-2"
                            >
                                <label className="text-sm font-medium ml-1">Assign Site</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <select className="w-full bg-background border border-border focus:border-primary rounded-xl py-2 pl-10 pr-4 outline-none appearance-none transition-colors">
                                    <option value="">Select a site location...</option>
                                    <option value="site1">Downtown Complex</option>
                                    <option value="site2">Greenville Heights</option>
                                    </select>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2 pt-4">
                      <label className="text-sm font-medium ml-1">ID / Aadhar Verification</label>
                      <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 hover:border-primary transition-all">
                          <Upload size={32} className="text-muted-foreground mb-3" />
                          <p className="text-sm font-bold">Click or drag document to upload</p>
                          <p className="text-xs text-muted-foreground mt-1">JPEG, PNG up to 5MB</p>
                      </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-3 border-t border-border mt-8">
                     <button type="button" className="px-6 py-2 rounded-xl text-sm font-bold border border-border hover:bg-muted transition-colors">Cancel</button>
                     <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        type="submit" 
                        className="px-6 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                     >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Get OTP"}
                     </motion.button>
                  </div>
              </motion.div>
            ) : (
                <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 pt-4 pb-12"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Verify Identity</h2>
                        <p className="text-muted-foreground mt-2">Enter the OTP sent to {phone}</p>
                    </div>

                    <div className="max-w-sm mx-auto space-y-6">
                        <div className="relative group">
                            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="123456"
                                className="w-full bg-background border-2 border-input focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none transition-all tracking-[0.5em] font-mono font-bold text-xl text-center"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setStep(1)}
                                className="w-1/3 py-3 rounded-xl font-bold border border-border hover:bg-muted transition-all text-sm"
                            >
                                Back
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={loading}
                                type="submit"
                                className="w-2/3 bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 transition-all hover:brightness-110 text-sm"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify & Register"}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Card>
    </div>
  );
};

export default UserRegistration;
