"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Receipt, Calendar, MapPin, IndianRupee } from 'lucide-react';

export default function FinancePage() {
  const [mounted, setMounted] = useState(false);
  const [ledger, setLedger] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newTx, setNewTx] = useState({ 
    trip_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '', 
    amount: '', 
    type: 'income', 
    category: 'Income',
    receipt_url: ''
  });
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (userData && userData.role === 'admin') setIsAdmin(true);
    }

    // Fetch trips for the dropdown
    const { data: tripsData } = await supabase.from('trips').select('id, title, date').order('date', { ascending: false });
    if (tripsData) {
      setTrips(tripsData);
      if (tripsData.length > 0) {
        setNewTx(prev => ({ ...prev, trip_id: tripsData[0].id }));
      }
    }

    // Fetch ledger
    const { data } = await supabase.from('transactions').select('*, trips(title)').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setLedger(data);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTx(prev => ({ ...prev, receipt_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount);
    if (isNaN(amount) || !newTx.trip_id) return;

    const { error } = await supabase.from('transactions').insert([{
      trip_id: newTx.trip_id,
      date: newTx.date,
      description: newTx.description,
      amount: amount,
      type: newTx.type,
      category: newTx.category,
      receipt_url: newTx.receipt_url
    }]);

    if (!error) {
      fetchData(); // Refresh data to get relations
      setNewTx(prev => ({ ...prev, description: '', amount: '', category: prev.type === 'income' ? 'Income' : '', receipt_url: '' }));
      setShowAddForm(false);
    } else {
      console.error("Supabase Error:", error);
      alert("Error adding transaction: " + (error?.message || "Unknown error"));
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setLedger(ledger.filter(t => t.id !== id));
    } else {
      alert("Error deleting transaction");
    }
  };

  // Calculations
  const totalIncome = ledger.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = ledger.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balance = totalIncome - totalExpense;

  // Group by Trip for the Pie Chart (Showing Total Data - Expenses per trip)
  const tripTotals = trips.map(trip => {
    const tripTxs = ledger.filter(t => t.trip_id === trip.id);
    const tIncome = tripTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const tExpense = tripTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
    return {
      name: trip.title || 'Unknown Trip',
      income: tIncome,
      expense: tExpense,
      totalActivity: tIncome + tExpense
    };
  }).filter(t => t.totalActivity > 0);

  const expensesByCategory = ledger.filter(t => t.type === 'expense').reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Number(curr.amount);
    return acc;
  }, {} as Record<string, number>);
  const barData = Object.keys(expensesByCategory).map(key => ({ category: key, amount: expensesByCategory[key] })).sort((a,b) => b.amount - a.amount);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h1 className="text-4xl font-bold text-emerald-400">Finance & Budget</h1>
            <p className="text-slate-400 mt-1">Club Treasury Management</p>
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <button onClick={() => setShowAddForm(!showAddForm)} className={`px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${showAddForm ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                {showAddForm ? 'Cancel' : <><Plus className="w-5 h-5" /> Add Transaction</>}
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Plus className="w-16 h-16" /></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Income</p>
            <p className="text-4xl font-black text-emerald-400 mt-2">₹{totalIncome.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Trash2 className="w-16 h-16" /></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Expense</p>
            <p className="text-4xl font-black text-rose-400 mt-2">₹{totalExpense.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><IndianRupee className="w-16 h-16" /></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Net Balance</p>
            <p className={`text-4xl font-black mt-2 ${balance >= 0 ? 'text-cyan-400' : 'text-rose-500'}`}>₹{balance.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && isAdmin && (
          <div className="bg-slate-900 p-8 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
              <Receipt className="text-emerald-400" /> Ledger Entry
            </h2>
            <form onSubmit={handleAddTx} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300">Transaction Type</label>
                  <select required value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value, category: e.target.value === 'income' ? 'Income' : ''})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300">Select Trip</label>
                  <select required value={newTx.trip_id} onChange={e => setNewTx({...newTx, trip_id: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="" disabled>Choose a trip...</option>
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.date})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300">Date</label>
                  <input required type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300">Amount (₹)</label>
                  <input required type="number" step="0.01" min="0" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} placeholder="0.00" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300">Parameter / Category</label>
                  <input required type="text" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} placeholder={newTx.type === 'income' ? 'e.g., Registrations, Sponsorship' : 'e.g., Transport, Food, Medkits'} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300">Description (Optional)</label>
                  <input type="text" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder="Optional details..." className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300 flex justify-between">
                    Upload Receipt <span className="text-emerald-500 text-xs">Optional Add-on</span>
                  </label>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 transition-all outline-none" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  Save to Ledger
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Charts Section */}
        {mounted && ledger.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
              <h3 className="text-lg font-bold mb-6 text-white text-center">Total Financial Activity by Trip</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tripTotals}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="totalActivity"
                    >
                      {tripTotals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number, name: string, props: any) => {
                        return [`₹${value.toLocaleString('en-IN')}`, "Total Cashflow (In + Out)"];
                      }}
                      labelFormatter={() => ''}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
              <h3 className="text-lg font-bold mb-6 text-white text-center">Expense Breakdown (All Trips)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="category" stroke="#64748b" tick={{fill: '#64748b'}} />
                    <YAxis stroke="#64748b" tick={{fill: '#64748b'}} tickFormatter={(value) => `₹${value}`} />
                    <RechartsTooltip 
                      cursor={{fill: '#1e293b'}}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-slate-900 rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-slate-900/50">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" /> Complete Ledger
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 text-sm uppercase tracking-widest">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Trip</th>
                  <th className="p-4 font-semibold">Parameter</th>
                  <th className="p-4 font-semibold">Details</th>
                  <th className="p-4 font-semibold">Receipt</th>
                  <th className="p-4 font-semibold text-right">Amount</th>
                  {isAdmin && <th className="p-4 font-semibold text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-slate-500 italic">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 whitespace-nowrap text-slate-300">{tx.date || new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-300">
                        {tx.trips ? <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-cyan-400" />{tx.trips.title}</span> : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider text-slate-300 border border-white/5">
                          {tx.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">{tx.description || '-'}</td>
                      <td className="p-4">
                        {tx.receipt_url ? (
                          <a href={tx.receipt_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center gap-1">
                            <Receipt className="w-4 h-4" /> View
                          </a>
                        ) : (
                          <span className="text-slate-600 text-sm">-</span>
                        )}
                      </td>
                      <td className={`p-4 text-right font-black whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-center">
                          <button onClick={() => handleDeleteTx(tx.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
