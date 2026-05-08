import React from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export const Card = ({ children, className, delay = 0, onClick }) => (
  <motion.div
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className={cn(
      "bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group relative overflow-hidden",
      className
    )}
  >
    {children}
  </motion.div>
);

export const StatCard = ({ title, value, icon: Icon, trend, color, description, delay }) => (
  <Card delay={delay}>
    <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
            "p-4 rounded-2xl shadow-lg transition-all duration-500 group-hover:scale-110", 
            color || "bg-primary text-primary-foreground"
        )}>
           <Icon size={24} className={color ? "text-white" : ""} />
        </div>
        {trend && (
             <div className={cn(
                 "px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1", 
                 trend > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
             )}>
               <span>{trend > 0 ? "↑" : "↓"}</span>
               {Math.abs(trend)}%
             </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">{title}</p>
        <h3 className="text-4xl font-black tracking-tighter tabular-nums group-hover:text-primary transition-colors">{value}</h3>
        {description && <p className="text-[10px] font-bold text-muted-foreground/50">{description}</p>}
      </div>
    </div>

    {/* Subtle back-glow */}
    <div className={cn(
        "absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-1000 rounded-full",
        color?.split(' ')[0]
    )} />
  </Card>
);
