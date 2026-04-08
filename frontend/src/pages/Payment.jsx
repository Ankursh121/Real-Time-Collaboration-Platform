import React from "react";
import { Card } from "../components/StatCard";
import { Wallet, IndianRupee, Download, CheckCircle, Clock } from "lucide-react";

const Payment = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">Manage and disburse wages.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
           Generate Payroll <Download size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/20 rounded-lg text-primary"><Wallet size={20} /></div>
                <h3 className="font-semibold text-sm">Total Pending</h3>
            </div>
            <h2 className="text-3xl font-bold">₹1,24,500</h2>
         </Card>
         <Card className="bg-green-500/5 border-green-500/20">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg text-green-500"><CheckCircle size={20} /></div>
                <h3 className="font-semibold text-sm">Paid This Week</h3>
            </div>
            <h2 className="text-3xl font-bold text-green-500">₹45,000</h2>
         </Card>
         <Card className="bg-orange-500/5 border-orange-500/20">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500"><Clock size={20} /></div>
                <h3 className="font-semibold text-sm">Next Payout</h3>
            </div>
            <h2 className="text-2xl font-bold">Friday</h2>
            <p className="text-sm text-muted-foreground mt-1">Est. ₹35,000</p>
         </Card>
      </div>

      <Card className="p-0 overflow-hidden mt-8">
        <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-lg">Pending Payments</h3>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="p-4 font-semibold text-sm text-muted-foreground">Worker</th>
                        <th className="p-4 font-semibold text-sm text-muted-foreground">Site</th>
                        <th className="p-4 font-semibold text-sm text-muted-foreground">Days Worked</th>
                        <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Amount</th>
                        <th className="p-4 font-semibold text-sm text-muted-foreground text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {[...Array(5)].map((_, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-medium">Worker {i+1}</td>
                            <td className="p-4 text-sm text-muted-foreground">Downtown Complex</td>
                            <td className="p-4 text-sm font-medium">6 Days</td>
                            <td className="p-4 text-right font-bold flex items-center justify-end gap-1">
                                <IndianRupee size={14} className="text-muted-foreground" />
                                {3000 + (i * 500)}
                            </td>
                            <td className="p-4 text-center">
                                <button className="px-4 py-1.5 bg-background border hover:bg-primary hover:text-primary-foreground hover:border-primary rounded-lg text-sm font-bold transition-all w-24">Pay</button>
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

export default Payment;
