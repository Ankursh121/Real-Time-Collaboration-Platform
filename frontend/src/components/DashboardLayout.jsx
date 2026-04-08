import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import { Moon, Sun, Bell, Search, User as UserIcon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const DashboardLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <motion.main
        initial={false}
        animate={{ paddingLeft: sidebarCollapsed ? "80px" : "260px" }}
        className="flex-1 min-h-screen flex flex-col transition-all duration-300"
      >
        {/* Navbar */}
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card sticky top-0 z-40">
          <div className="flex items-center gap-4 bg-muted/50 px-4 py-2 rounded-xl w-96 max-md:hidden">
            <Search size={18} className="text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-all"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground relative transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right max-sm:hidden">
                <p className="text-sm font-semibold leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground border overflow-hidden">
                {user?.photo ? (
                   <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                   <UserIcon size={20} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section className="p-8 max-md:p-4 animate-in fade-in duration-500">
          <Outlet />
        </section>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
