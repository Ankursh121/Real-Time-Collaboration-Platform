import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  CalendarCheck, 
  Wallet, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../utils/cn";

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }) => (
  <Link to={path}>
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative",
        active 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
          : "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon size={20} className={cn("", !active && "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && (
        <span className="font-medium whitespace-nowrap overflow-hidden transition-all duration-300">
          {label}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-16 bg-popover text-popover-foreground px-2 py-1 rounded text-xs invisible group-hover:visible z-50 whitespace-nowrap shadow-md border">
          {label}
        </div>
      )}
    </motion.div>
  </Link>
);

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const common = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    ];

    if (user?.role === "Owner") {
      return [
        ...common,
        { icon: Users, label: "Manage Roles", path: "/users" },
        { icon: MapPin, label: "Sites", path: "/sites" },
        { icon: Wallet, label: "Payments", path: "/payments" },
      ];
    }
    
    if (user?.role === "Admin") {
      return [
        ...common,
        { icon: CalendarCheck, label: "Attendance", path: "/attendance" },
        { icon: Users, label: "Onboard Worker", path: "/users" },
      ];
    }

    return [
        ...common,
        { icon: CalendarCheck, label: "My Attendance", path: "/attendance" },
        { icon: Wallet, label: "Earnings", path: "/payments" },
    ];
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="fixed left-0 top-0 h-screen bg-card border-r flex flex-col z-50 transition-all duration-300"
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold italic">W</div>
            <span className="font-bold text-lg tracking-tight">Worksite</span>
          </motion.div>
        )}
        {collapsed && <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold italic">W</div>}
      </div>

      <div className="flex-1 px-4 space-y-2 py-4">
        {getMenuItems().map((item) => (
          <SidebarItem
            key={item.path}
            {...item}
            active={location.pathname === item.path}
            collapsed={collapsed}
          />
        ))}
      </div>

      <div className="p-4 border-t space-y-2">
        <SidebarItem icon={Settings} label="Settings" path="/settings" collapsed={collapsed} />
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all duration-200 group relative"
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
