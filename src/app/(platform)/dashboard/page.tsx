"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Mountain, Users, Route, Camera, Wallet, ArrowUpRight, Trash2 } from "lucide-react";
import { createClient } from '@/utils/supabase/client';

const DistanceChart = dynamic(() => import("@/components/charts/DashboardCharts").then(mod => mod.DistanceChart), { ssr: false });
const DifficultyChart = dynamic(() => import("@/components/charts/DashboardCharts").then(mod => mod.DifficultyChart), { ssr: false });

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [difficultyData, setDifficultyData] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleDeleteTx = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    } else {
      alert("Error deleting transaction");
    }
  };

  const handleClearLedger = async () => {
    if (!confirm('WARNING: Are you sure you want to completely clear the ENTIRE ledger? This will delete all transactions!')) return;
    const confirmation = prompt('Type "DELETE ALL" to confirm clearing the ledger:');
    if (confirmation !== 'DELETE ALL') return;
    
    const supabase = createClient();
    const { error } = await supabase.from('transactions').delete().not('id', 'is', null);
    if (!error) {
      setTransactions([]);
      alert("Ledger completely cleared.");
    } else {
      alert("Error clearing ledger: " + error.message);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
          if (userData && userData.role === 'admin') setIsAdmin(true);
        }
        
        // Fetch full trips data to compute chart metrics
        const { data: tripsData } = await supabase.from('trips').select('*');
        const tripsCount = tripsData ? tripsData.length : 0;
        
        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
        const { count: galleryCount } = await supabase.from('gallery_photos').select('*', { count: 'exact', head: true });

        // Calculate Monthly Distance Data
        if (tripsData && tripsData.length > 0) {
          const monthMap: Record<string, { trips: number, distance: number }> = {};
          
          tripsData.forEach((trip: any) => {
            if (!trip.date) return;
            const date = new Date(trip.date);
            const month = date.toLocaleString('default', { month: 'short' });
            
            if (!monthMap[month]) monthMap[month] = { trips: 0, distance: 0 };
            monthMap[month].trips += 1;
            
            // Parse distance (e.g. '15km', '15 km', '15')
            if (trip.distance) {
              const numMatch = String(trip.distance).match(/[\d.]+/);
              if (numMatch) {
                monthMap[month].distance += parseFloat(numMatch[0]);
              }
            }
          });

          const mData = Object.keys(monthMap).map(m => ({
            name: m,
            trips: monthMap[m].trips,
            distance: Math.round(monthMap[m].distance)
          }));
          
          // Basic sort by month index
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          mData.sort((a, b) => months.indexOf(a.name) - months.indexOf(b.name));
          setMonthlyData(mData);

          // Calculate Difficulty Distribution
          const diffMap: Record<string, number> = {};
          tripsData.forEach((trip: any) => {
            if (trip.difficulty) {
              diffMap[trip.difficulty] = (diffMap[trip.difficulty] || 0) + 1;
            }
          });
          
          const dData = Object.keys(diffMap).map(d => ({
            name: d,
            value: diffMap[d]
          }));
          setDifficultyData(dData);
        }

        setStats([
          { name: "Total Trips", value: tripsCount.toString(), icon: Mountain, trend: "+0%" },
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

  const handleDownloadReport = () => {
    // Show a quick loading state or rely on standard behavior
    const btn = document.getElementById('download-btn');
    if (btn) btn.innerText = 'Generating PDF...';

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      const element = document.getElementById('dashboard-report-area');
      const opt = {
        margin:       [0.5, 0.5, 0.5, 0.5],
        filename:     `club-dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
      };
      
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save().then(() => {
        if (btn) btn.innerText = 'Download Report';
      });
    };
    document.body.appendChild(script);
  };

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
      <div id="dashboard-report-area" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-end mb-10 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Club Dashboard</h1>
            <p className="text-gray-400">Overview of Hiking Club activities and stats.</p>
          </div>
          <button id="download-btn" data-html2canvas-ignore onClick={handleDownloadReport} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium">
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
            <DistanceChart data={monthlyData} />
          </motion.div>

          <motion.div 
            className="glass-dark p-6 rounded-2xl"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Difficulty Distribution</h3>
            <DifficultyChart data={difficultyData} />
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
            <div className="flex gap-4 items-center">
              {isAdmin && (
                <button onClick={handleClearLedger} className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
              )}
              <a href="/finance" className="text-sunset-amber hover:text-sunset-orange text-sm font-medium">View Full Ledger</a>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  {isAdmin && <th className="pb-3 font-medium text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="py-4 text-center text-gray-500 italic">No transactions found.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5">
                      <td className="py-4">{tx.date || new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="py-4">{tx.description}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded ${
                          tx.type === 'income' ? 'bg-green-500/20 text-green-300' :
                          tx.category === 'Safety' ? 'bg-red-500/20 text-red-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className={`py-4 text-right ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{Math.abs(tx.amount || 0).toFixed(2)}
                      </td>
                      {isAdmin && (
                        <td className="py-4 text-center">
                          <button onClick={() => handleDeleteTx(tx.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
