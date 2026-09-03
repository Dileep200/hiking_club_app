"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Info } from "lucide-react";
import LiveTrekTracker from "@/components/LiveTrekTracker";

export default function ParentsPage() {
  return (
    <main className="min-h-screen bg-slate-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-emerald-500/20 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 tracking-tight">
            Parents Portal
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Welcome to the secure Parents Tracking Portal. You can monitor the real-time progress and live GPS locations of your wards during active university hiking expeditions.
          </p>
        </motion.div>

        <div className="bg-slate-800/50 rounded-3xl p-6 md:p-8 border border-white/5 mb-12 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-4 mb-6 text-slate-300 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
            <Info className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
            <p className="text-sm leading-relaxed">
              <strong className="text-white block mb-1">How it works:</strong>
              When an expedition is currently active, the map below will display the live GPS locations of the participants. The club administrators also broadcast their location and set the target destination. If there is no active trek right now, the map will indicate that there are no ongoing trips.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-slate-900">
            <LiveTrekTracker allowAdmin={false} />
          </div>
        </div>
      </div>
    </main>
  );
}
