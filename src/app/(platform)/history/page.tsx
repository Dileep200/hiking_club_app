"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import ImageUpload from '@/components/ImageUpload';

export default function HistoryPage() {
  const [hikes, setHikes] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newHike, setNewHike] = useState({ title: '', date: '', distance: '', difficulty: 'Moderate', image_url: '' });
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (userData?.role === 'admin') setIsAdmin(true);
    }
    const { data } = await supabase.from('trips').select('*').eq('status', 'completed').order('date', { ascending: false });
    if (data) setHikes(data);
    setLoading(false);
  };

  const handleAddHike = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('trips').insert([{
      ...newHike,
      status: 'completed'
    }]).select();

    if (!error && data) {
      const updated = [...hikes, data[0]].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHikes(updated);
      setNewHike({ title: '', date: '', distance: '', difficulty: 'Moderate', image_url: '' });
    } else {
      alert("Error saving past trip.");
    }
  };

  const handleDeleteHike = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip from history?')) return;
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (!error) {
      setHikes(hikes.filter(h => h.id !== id));
    } else {
      alert("Error deleting past trip.");
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 p-8 text-emerald-400">Loading history...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 py-16 px-4 sm:px-6 lg:px-8 text-white font-sans">
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight text-white">The Archives</h1>
          <p className="text-lg text-slate-400 font-light">A chronicled history of our past expeditions.</p>
        </div>

        {isAdmin && (
          <div className="mb-16 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-serif font-bold mb-6 text-emerald-400 flex items-center gap-2">
              Log a Past Expedition
            </h2>
            <form onSubmit={handleAddHike} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1 font-medium">Trip Title</label>
                  <input required value={newHike.title} onChange={e => setNewHike({...newHike, title: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1 font-medium">Date Completed</label>
                    <input required type="date" value={newHike.date} onChange={e => setNewHike({...newHike, date: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1 font-medium">Distance (km)</label>
                    <input required value={newHike.distance} onChange={e => setNewHike({...newHike, distance: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1 font-medium">Trip Image</label>
                  <ImageUpload onUploadSuccess={(url) => setNewHike({...newHike, image_url: url})} />
                  {newHike.image_url && <img src={newHike.image_url} className="h-16 mt-2 rounded border border-white/10 object-cover" />}
                </div>
                <button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg transition-all">
                  Archive Trip
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="relative border-l border-slate-700 ml-4 md:ml-0 md:pl-0 md:mx-auto md:w-full md:border-l-0">
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>

          {hikes.map((hike, index) => (
            <div key={hike.id || index} className={`mb-16 flex flex-col md:flex-row items-center w-full ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              
              <div className="absolute left-[-5px] md:left-1/2 md:-translate-x-1/2 w-3 h-3 rounded-full bg-emerald-500 z-10 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
              
              <div className={`w-full pl-8 md:pl-0 md:w-5/12 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                <div className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl shadow-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/20">
                  {(hike.image_url || hike.imageUrl) && (
                    <div className="h-48 w-full overflow-hidden">
                      <img src={hike.image_url || hike.imageUrl} alt={hike.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className={`text-emerald-500 font-mono text-sm tracking-widest uppercase mb-2 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'} text-left`}>
                      {hike.date ? new Date(hike.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-3 text-slate-100">
                      {hike.title}
                    </h3>
                    
                    <div className={`flex flex-wrap gap-3 mt-6 ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'} justify-start`}>
                      <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded text-xs font-medium text-slate-300">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        {hike.distance}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded text-xs font-medium text-slate-300">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {hike.difficulty}
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDeleteHike(hike.id)} className="flex items-center gap-1.5 bg-red-900/50 hover:bg-red-800 px-3 py-1 rounded text-xs font-medium text-red-200 transition-colors">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:block w-5/12"></div>
            </div>
          ))}
          
          {hikes.length === 0 && (
            <div className="text-center py-24">
              <p className="text-slate-500 italic">The archives are currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
