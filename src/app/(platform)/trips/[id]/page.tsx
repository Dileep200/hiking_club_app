"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';

interface Trip {
  id: string;
  title: string;
  date: string;
  distance: string;
  difficulty: string;
  imageUrl: string;
}

interface TripReport {
  id: string;
  trip_id: string;
  content: string;
  created_at: string;
}

interface Transaction {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  type: string;
  created_at: string;
}

export default function TripDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [reports, setReports] = useState<TripReport[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Forms state
  const [newReport, setNewReport] = useState('');
  const [newTxDesc, setNewTxDesc] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      // Check admin
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (userData && userData.role === 'admin') setIsAdmin(true);
      }
      
      // Fetch trip
      const { data: tripData } = await supabase.from('trips').select('*').eq('id', id).single();
      if (tripData) setTrip(tripData);
      
      // Fetch reports
      const { data: reportsData } = await supabase.from('trip_reports').select('*').eq('trip_id', id).order('created_at', { ascending: false });
      if (reportsData) setReports(reportsData);
      
      // Fetch transactions
      const { data: txData } = await supabase.from('transactions').select('*').eq('trip_id', id).order('created_at', { ascending: false });
      if (txData) setTransactions(txData);
      
      setLoading(false);
    };
    
    fetchData();
  }, [id, supabase]);

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport) return;
    const { data } = await supabase.from('trip_reports').insert([{ trip_id: id, content: newReport }]).select();
    if (data && data.length > 0) setReports([data[0], ...reports]);
    setNewReport('');
  };
  
  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxDesc || !newTxAmount) return;
    const { data } = await supabase.from('transactions').insert([{ 
      trip_id: id, 
      description: newTxDesc, 
      amount: parseFloat(newTxAmount), 
      type: 'expense' 
    }]).select();
    if (data && data.length > 0) setTransactions([data[0], ...transactions]);
    setNewTxDesc('');
    setNewTxAmount('');
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;
  }
  
  if (!trip) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Trip not found.</div>;
  }

  const totalExpenses = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header - Trip Details */}
        <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="relative h-80 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-slate-900 z-10"></div>
            <img src={trip.imageUrl} alt={trip.title} className="object-cover w-full h-full" />
            
            <button onClick={() => router.push('/trips')} className="absolute top-6 left-6 z-20 bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-md transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            {isAdmin && (
              <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-emerald-500/80 px-3 py-1 rounded-full border border-emerald-400 backdrop-blur-md">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Admin Mode</span>
              </div>
            )}
          </div>
          
          <div className="p-8 relative z-20 -mt-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-4">{trip.title}</h1>
                <div className="flex flex-wrap gap-4 text-slate-300">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{trip.date}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>{trip.distance}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                    <span className={`w-3 h-3 rounded-full ${
                      trip.difficulty === 'Easy' ? 'bg-emerald-400' :
                      trip.difficulty === 'Moderate' ? 'bg-amber-400' : 'bg-rose-400'
                    }`}></span>
                    <span>{trip.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Debrief / Report */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 rounded-3xl p-8 border border-white/5 backdrop-blur-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="p-2 bg-blue-500/20 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Debrief / Reports
            </h2>
            
            {isAdmin && (
              <form onSubmit={handleAddReport} className="mb-8">
                <textarea 
                  required
                  value={newReport}
                  onChange={e => setNewReport(e.target.value)}
                  placeholder="Write a trip report..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[100px]"
                />
                <button type="submit" className="mt-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                  Upload Report
                </button>
              </form>
            )}

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {reports.length === 0 ? (
                <p className="text-slate-400 italic">No reports available yet.</p>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{report.content}</p>
                    <div className="mt-4 text-xs text-slate-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Section: Expenses Mini-ledger */}
          <div className="bg-slate-800/50 rounded-3xl p-8 border border-white/5 backdrop-blur-xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="p-2 bg-rose-500/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Expenses Ledger
              </h2>
              <div className="text-right">
                <p className="text-sm text-slate-400">Total Spent</p>
                <p className="text-2xl font-bold text-rose-400">₹{totalExpenses.toFixed(2)}</p>
              </div>
            </div>

            {isAdmin && (
              <form onSubmit={handleAddTx} className="mb-8 flex gap-3">
                <input 
                  type="text" 
                  required
                  value={newTxDesc}
                  onChange={e => setNewTxDesc(e.target.value)}
                  placeholder="Expense description"
                  className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                />
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="0"
                  value={newTxAmount}
                  onChange={e => setNewTxAmount(e.target.value)}
                  placeholder="Amount (₹)"
                  className="w-28 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                />
                <button type="submit" className="bg-rose-500 hover:bg-rose-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors whitespace-nowrap">
                  Add
                </button>
              </form>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">

              <div className="space-y-4">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-900/50 border border-white/5 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-slate-400 text-sm font-bold">{tx.description[0]}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{tx.description}</p>
                        <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-rose-400 font-bold font-mono">
                        -₹{tx.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-center text-slate-500 py-8 italic">No expenses logged for this trip yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
