"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Mountain, Users, Route, Camera, Wallet, ArrowUpRight } from "lucide-react";
import { createClient } from '@/utils/supabase/client';

const DistanceChart = dynamic(() => import("@/components/charts/DashboardCharts").then(mod => mod.DistanceChart), { ssr: false });
const DifficultyChart = dynamic(() => import("@/components/charts/DashboardCharts").then(mod => mod.DifficultyChart), { ssr: false });

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        
        // Use existing tables for stats
        const { count: tripsCount } = await supabase.from('trips').select('*', { count: 'exact', head: true });
        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
        const { count: galleryCount } = await supabase.from('gallery_photos').select('*', { count: 'exact', head: true });

        setStats([
          { name: "Total Trips", value: (tripsCount || 0).toString(), icon: Mountain, trend: "+0%" },
          { name: "Active Members", value: (usersCount || 0).toString(), icon: Users, trend: "+0%" },
          { name: "Transactions", value: (txCount || 0).toString(), icon: Wallet, trend: "+0%" },
          { name: "Memories Captured", value: (galleryCount || 0).toString(), icon: Camera, trend: "+0%" },
        ]);

        // Fetch transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .order('id', { ascending: false })
          .limit(5);

        if (txData) {
          setTransactions(txData);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case "Total Trips": return Mountain;
      case "Active Members": return Users;
      case "Distance Covered": return Route;
      case "Memories Captured": return Camera;
      default: return Mountain;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div className="space-y-4">
              <div className="h-10 w-64 bg-white/10 animate-pulse rounded-lg"></div>
              <div className="h-5 w-48 bg-white/10 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-10 w-32 bg-white/10 animate-pulse rounded-lg"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass p-6 rounded-2xl h-36 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 bg-white/10 animate-pulse rounded-xl"></div>
                  <div className="h-5 w-16 bg-white/10 animate-pulse rounded-lg"></div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-4 w-24 bg-white/10 animate-pulse rounded"></div>
                  <div className="h-8 w-20 bg-white/10 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-dark p-6 rounded-2xl h-96 flex flex-col gap-6">
              <div className="h-7 w-64 bg-white/10 animate-pulse rounded-lg"></div>
              <div className="flex-1 bg-white/5 animate-pulse rounded-xl"></div>
            </div>
            <div className="glass-dark p-6 rounded-2xl h-96 flex flex-col gap-6">
              <div className="h-7 w-48 bg-white/10 animate-pulse rounded-lg"></div>
              <div className="flex-1 bg-white/5 animate-pulse rounded-xl"></div>
            </div>
          </div>

          <div className="mt-6 glass p-6 rounded-2xl h-64 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="h-7 w-64 bg-white/10 animate-pulse rounded-lg"></div>
              <div className="h-5 w-32 bg-white/10 animate-pulse rounded-lg"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="h-5 w-24 bg-white/10 animate-pulse rounded"></div>
                  <div className="h-5 w-48 bg-white/10 animate-pulse rounded"></div>
                  <div className="h-6 w-20 bg-white/10 animate-pulse rounded-full"></div>
                  <div className="h-5 w-16 bg-white/10 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Club Dashboard</h1>
            <p className="text-gray-400">Overview of Hiking Club activities and stats.</p>
          </div>
          <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium">
            Download Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon || Mountain;
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-2xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <Icon className="h-6 w-6 text-sunset-amber" />
                  </div>
                  <span className="text-green-400 text-sm font-medium flex items-center">
                    {stat.trend} <ArrowUpRight className="h-3 w-3 ml-1" />
                  </span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">{stat.name}</h3>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            className="lg:col-span-2 glass-dark p-6 rounded-2xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Distance Covered Over Time</h3>
            <DistanceChart />
          </motion.div>

          <motion.div 
            className="glass-dark p-6 rounded-2xl"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Difficulty Distribution</h3>
            <DifficultyChart />
          </motion.div>
        </div>
        
        {/* Ledger / Finance Mini view */}
        <motion.div 
          className="mt-6 glass p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-400" /> Recent Transactions (Ledger)
            </h3>
            <button className="text-sunset-amber hover:text-sunset-orange text-sm font-medium">View Full Ledger</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5">
                    <td className="py-4">{tx.date}</td>
                    <td className="py-4">{tx.description}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded ${
                        tx.category === 'Income' ? 'bg-green-500/20 text-green-300' :
                        tx.category === 'Safety' ? 'bg-red-500/20 text-red-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className={`py-4 text-right ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{Math.abs(tx.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
