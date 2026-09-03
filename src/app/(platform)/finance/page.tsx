"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinancePage() {
  const [mounted, setMounted] = useState(false);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newTx, setNewTx] = useState({ description: '', amount: '', type: 'expense', category: 'Food' });
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

    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (data) setLedger(data);
  }

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount);
    if (!newTx.description || isNaN(amount)) return;

    const { data, error } = await supabase.from('transactions').insert([{
      description: newTx.description,
      amount: amount,
      type: newTx.type,
      category: newTx.category
    }]).select();

    if (!error && data) {
      setLedger([data[0], ...ledger]);
      setNewTx({ description: '', amount: '', type: 'expense', category: 'Food' });
      setShowAddForm(false);
    } else {
      alert("Error adding transaction");
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear ALL transactions? This cannot be undone.')) {
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
      setLedger([]);
    }
  };

  // Calculations
  const totalIncome = ledger.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = ledger.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const expensesByCategory = ledger.filter(t => t.type === 'expense').reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Income', value: totalIncome || 1 }, // prevent empty chart
    { name: 'Expenses', value: totalExpense || 1 }
  ];
  const COLORS = ['#10b981', '#f43f5e'];

  const barData = Object.keys(expensesByCategory).map(key => ({ category: key, amount: expensesByCategory[key] }));

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h1 className="text-4xl font-bold text-emerald-400">Finance & Budget</h1>
            <p className="text-slate-400 mt-1">Club Treasury Management</p>
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <>
                <button onClick={() => setShowAddForm(!showAddForm)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  {showAddForm ? 'Cancel' : '+ Add Transaction'}
                </button>
                <button onClick={handleClearAll} className="bg-red-900/50 hover:bg-red-800 text-red-200 px-4 py-2 rounded-lg font-medium transition-colors">
                  Clear All
                </button>
              </>
            )}
          </div>
        </header>

        {showAddForm && isAdmin && (
          <div className="bg-white/5 p-6 rounded-2xl border border-emerald-500/30 mb-8">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">New Transaction</h2>
            <form onSubmit={handleAddTx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm mb-1 text-slate-300">Description</label>
                <input required type="text" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300">Amount (₹)</label>
                <input required type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300">Type</label>
                <select value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300">Category</label>
                <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="Transport">Transport</option>
                  <option value="Food">Food</option>
                  <option value="Safety">Safety</option>
                  <option value="Fees">Fees</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-emerald-500 text-slate-900 font-bold rounded-xl hover:bg-emerald-400">Save</button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <section className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                <h3 className="text-slate-400 font-medium">Total Income</h3>
                <p className="text-3xl font-bold text-emerald-400">₹{totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                <h3 className="text-slate-400 font-medium">Total Expense</h3>
                <p className="text-3xl font-bold text-rose-400">₹{totalExpense.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-xl border border-white/10 h-[400px] flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-white">Income vs Expenses</h2>
              <div className="flex-1 min-h-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white/5 rounded-xl shadow-2xl border border-white/10 flex flex-col h-[520px]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-semibold text-white">Detailed Ledger</h2>
            </div>
            <div className="overflow-auto flex-1 p-2">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="text-xs text-slate-300 uppercase sticky top-0 bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">
                        {entry.description}
                        <span className="block text-xs text-slate-500 mt-1">{entry.category}</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${entry.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {entry.type === 'income' ? '+' : '-'}₹{Number(entry.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center py-8 text-slate-500">No transactions</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
