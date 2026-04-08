import React from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export const Card = ({ children, className, delay = 0, onClick }) => (
  <motion.div
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn(
      "bg-card border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group",
      className
    )}
  >
    {children}
  </motion.div>
);

export const StatCard = ({ title, value, icon: Icon, trend, color, delay }) => (
  <Card delay={delay}>
    <div className="flex items-start justify-between">
      <div className="space-y-4 flex-1">
        <div className="p-3 bg-muted rounded-2xl w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
           <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight mt-1">{value}</h3>
          {trend && (
             <p className={cn("text-xs font-semibold mt-2 flex items-center gap-1", trend > 0 ? "text-green-500" : "text-red-500")}>
               <span>{trend > 0 ? "↑" : "↓"}</span>
               {Math.abs(trend)}% from last month
             </p>
          )}
        </div>
      </div>
    </div>
  </Card>
);
