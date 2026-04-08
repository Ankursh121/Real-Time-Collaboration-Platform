import React from "react";
import { Card } from "../components/StatCard";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Search, Filter } from "lucide-react";

const Attendance = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground mt-1">Daily attendance logs across all sites.</p>
        </div>
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-xl font-medium text-sm border hover:bg-background transition-all">
                <CalendarIcon size={16} /> Select Date
            </button>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                Generate Report
            </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input type="text" placeholder="Search by name or site..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border outline-none focus:border-primary text-sm" />
            </div>
            <button className="flex items-center justify-center gap-2 border px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap">
                <Filter size={16} /> Filters
            </button>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-muted/50 col">
                    <tr>
                        <th className="p-4 font-semibold text-sm text-muted-foreground">Worker Name</th>
                        <th className="p-4 font-semibold text-sm text-muted-foreground">Role</th>
                        <th className="p-4 font-semibold text-sm text-muted-foreground">Site</th>
                        <th className="p-4 font-semibold text-sm text-muted-foreground">Marked By</th>
                        <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {[...Array(5)].map((_, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-medium flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-bold font-mono">W{i+1}</div>
                                Worker Name {i+1}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{i % 2 === 0 ? "Mistri" : "Labour"}</td>
                            <td className="p-4 text-sm">Downtown Complex</td>
                            <td className="p-4 text-sm text-muted-foreground">Ravi (Admin)</td>
                            <td className="p-4 text-right">
                                {i !== 2 ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold">
                                        <CheckCircle2 size={14} /> Present
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold">
                                        <XCircle size={14} /> Absent
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};

export default Attendance;
