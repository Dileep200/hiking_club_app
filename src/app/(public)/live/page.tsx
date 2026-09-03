"use client";

import { motion } from "framer-motion";
import LiveTrekTracker from "@/components/LiveTrekTracker";
import { ShieldAlert, Users, BatteryMedium, SignalHigh } from "lucide-react";

export default function LivePage() {
  return (
    <main className="min-h-screen pt-24 pb-12 bg-slate-900">
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
          
          <div className="flex gap-4">
            <div className="glass px-4 py-2 rounded-lg flex items-center gap-2 border border-white/10">
              <SignalHigh className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">GPS Active</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl"
        >
          <LiveTrekTracker allowAdmin={true} />
        </motion.div>
      </div>
    </main>
  );
}
