import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, ArrowRight, Loader2, HardHat, ShieldUser, Building2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SiteScene from "../components/SiteScene";
import API from "../services/api";
import toast from "react-hot-toast";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("");
  const [workerType, setWorkerType] = useState("");
  
  const [step, setStep] = useState(1); // 1: role & phone, 2: otp
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!role) return toast.error("Please select a role first.");
    if (role === "Worker" && !workerType) return toast.error("Please select a worker type.");
    if (phone.length < 10) return toast.error("Enter a valid phone number.");
    
    setLoading(true);
    try {
      const res = await API.post("/auth/send-otp", { phone, isRegistration: false });
      if (res.data.success) {
        toast.success("OTP sent successfully");
        setStep(2);
      }
    } catch (error) {
       toast.error(typeof error === 'string' ? error : error?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(phone, otp, role, workerType);
      if (user) {
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(typeof error === 'string' ? error : error?.message || "Login failed");
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
    <div className="min-h-screen w-full relative bg-background flex">
      {/* Left panel - Branding / 3D Scene */}
      <div className="hidden lg:flex w-1/2 relative bg-card items-center justify-center overflow-hidden border-r border-border shadow-2xl z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-10 pointer-events-none" />
        <SiteScene />
        <div className="relative z-20 text-center p-12 glass rounded-3xl mx-12 border-primary/20 bg-background/60">
             <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-primary-foreground text-4xl font-bold italic mx-auto mb-6 shadow-xl shadow-primary/30">W</div>
             <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">Worksite Pro</h1>
             <p className="text-lg text-muted-foreground leading-relaxed">The unified platform to manage construction sites, streamline attendance, and disburse daily wages instantly.</p>
        </div>
      </div>

      {/* Right panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-20 relative">
          <div className="absolute inset-0 lg:hidden pointer-events-none bg-gradient-to-b from-background via-background to-muted/20" />
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md relative z-10"
          >
            <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Welcome Back</h2>
                <p className="text-muted-foreground">Sign in to your account to continue.</p>
            </div>

            <form onSubmit={step === 1 ? handleSendOTP : handleLogin} className="space-y-6">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="phone-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Role Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold ml-1">I am logging in as a...</label>
                        <div className="grid grid-cols-3 gap-3">
                            {roles.map((r) => {
                                const Icon = r.icon;
                                const isSelected = role === r.id;
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => { setRole(r.id); setWorkerType(""); }}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                                            isSelected 
                                            ? "border-primary bg-primary/10 text-primary shadow-sm" 
                                            : "border-border bg-card/50 hover:border-primary/50 hover:bg-card text-muted-foreground hover:text-foreground dropdown-shadow"
                                        }`}
                                    >
                                        <Icon size={24} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                                        <span className="text-xs font-bold">{r.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Worker Sub-Type Selection (Animates in if Worker is chosen) */}
                    <AnimatePresence>
                        {role === "Worker" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                className="space-y-3 overflow-hidden"
                            >
                                <label className="text-sm font-semibold ml-1">Worker Designation</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {["Labour", "Mistri"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setWorkerType(type)}
                                            className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                                workerType === type 
                                                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                                                : "border-border bg-card/50 hover:border-primary/50 hover:bg-card text-foreground"
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Phone Number Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold ml-1">Phone Number</label>
                      <div className="relative group">
                        <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                          type="tel" 
                          placeholder="Your 10-digit number"
                          className="w-full bg-background border-2 border-input focus:border-primary rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all placeholder:text-muted-foreground/50 font-medium"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between ml-1">
                          <label className="text-sm font-semibold">Security OTP</label>
                          <button 
                            type="button" 
                            onClick={() => setStep(1)}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Edit Phone?
                          </button>
                      </div>
                      <div className="relative group">
                        <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text" 
                          placeholder="Enter 6-digit OTP"
                          className="w-full bg-background border-2 border-input focus:border-primary rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all tracking-[0.5em] font-mono font-bold text-xl"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground ml-1">An OTP has been sent to +91 {phone}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/25 disabled:opacity-50 transition-all hover:brightness-110 active:scale-95 text-lg mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    {step === 1 ? "Secure Login" : "Verify Authentication"}
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
              
              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Need to onboard a new worker?{" "}
                  <button 
                    type="button" 
                    onClick={() => navigate('/register')} 
                    className="text-primary font-bold hover:underline transition-all"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          </motion.div>
      </div>
    </div>
  );
};

export default Login;
