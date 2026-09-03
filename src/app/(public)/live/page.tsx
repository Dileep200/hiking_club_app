"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const LiveMap = dynamic(() => import("@/components/LiveMap"), { 
  ssr: false, 
  loading: () => <div className="w-full h-[calc(100vh-80px)] rounded-3xl bg-white/5 animate-pulse flex items-center justify-center text-white/50">Loading Map...</div>
});
import { ShieldAlert, Users, BatteryMedium, SignalHigh } from "lucide-react";

export default function LivePage() {
  return (
    <main className="min-h-screen pt-24 pb-12">
      <div className="max-w-[95%] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Live Tracking</h1>
            <p className="text-gray-400">Follow the active expedition in real-time.</p>
          </div>
          
          {/* Status indicators */}
          <div className="flex gap-4">
            <div className="glass px-4 py-2 rounded-lg flex items-center gap-2">
              <SignalHigh className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">GPS Active</span>
            </div>
            <div className="glass px-4 py-2 rounded-lg flex items-center gap-2">
              <BatteryMedium className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Device: 64%</span>
            </div>
          </div>
        </motion.div>

        {/* The Map Component */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <LiveMap />
        </motion.div>

        {/* Emergency Info */}
        <motion.div 
          className="mt-8 glass-dark border-red-500/30 p-6 rounded-2xl flex items-start gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <ShieldAlert className="h-8 w-8 text-red-500 shrink-0" />
          <div>
            <h3 className="text-red-400 font-bold mb-1">Emergency Protocol</h3>
            <p className="text-gray-400 text-sm">
              If the tracking marker stops moving for more than 45 minutes without prior notice, the Core Team is automatically notified. Do not attempt rescue independently. Contact University Security or the local forest department.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
