"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import ImageUpload from '@/components/ImageUpload';

interface CoreMember {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  year: string;
  photo_url: string;
}

export default function TeamPage() {
  const [team, setTeam] = useState<CoreMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  
  // New member form state
  const [showForm, setShowForm] = useState(false);
  const [newMember, setNewMember] = useState<Partial<CoreMember>>({
    name: '', position: '', email: '', phone: '', year: '', photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop'
  });

  useEffect(() => {
    const fetchTeamAndRole = async () => {
      // 1. Get user role
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (userData && userData.role === 'admin') {
          setIsAdmin(true);
        }
      }

      // 2. Fetch team
      const { data } = await supabase.from('core_team').select('*');
      if (data) setTeam(data as CoreMember[]);
      
      setLoading(false);
    };
    
    fetchTeamAndRole();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.position) return;
    
    const { data, error } = await supabase.from('core_team').insert([newMember]).select();
    if (data && data.length > 0) {
      setTeam([...team, data[0] as CoreMember]);
      setShowForm(false);
      setNewMember({ name: '', position: '', email: '', phone: '', year: '', photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop' });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('core_team').delete().eq('id', id);
    if (!error) {
      setTeam(team.filter(m => m.id !== id));
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-pulse text-emerald-400">Loading Team...</div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12 pt-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Core Team
            </h1>
            <p className="text-slate-400 mt-2 text-lg">The leaders behind the adventure.</p>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-6 py-2 rounded-full font-medium hover:bg-emerald-500/30 transition"
            >
              {showForm ? 'Cancel' : '+ Add Core Member'}
            </button>
          )}
        </div>

        {/* Admin Form */}
        {isAdmin && showForm && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-emerald-400">Add New Team Member</h2>
            <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                <input required type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="e.g. Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Position</label>
                <input required type="text" value={newMember.position} onChange={e => setNewMember({...newMember, position: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="e.g. President" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="e.g. jane@university.edu" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number</label>
                <input type="tel" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="e.g. +1 234 567 8900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Year of Study</label>
                <input type="text" value={newMember.year} onChange={e => setNewMember({...newMember, year: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="e.g. Senior" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Photo</label>
                <ImageUpload onUploadSuccess={(url) => setNewMember({...newMember, photo_url: url})} />
                {newMember.photo_url && <img src={newMember.photo_url} alt="Preview" className="mt-2 h-16 w-16 object-cover rounded-xl" />}
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition w-full md:w-auto">
                  Save Member
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">No core team members found.</div>
          ) : (
            team.map((member) => (
              <div key={member.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition duration-300 group relative">
                
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(member.id)}
                    className="absolute top-4 right-4 z-10 bg-red-500/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-md hover:bg-red-500"
                    title="Delete Member"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}

                <div className="h-64 w-full overflow-hidden">
                  <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-6 relative">
                  <div className="absolute -top-6 left-6 bg-emerald-500 text-slate-900 font-bold px-4 py-1 rounded-full text-sm shadow-lg">
                    {member.position}
                  </div>
                  <h3 className="text-2xl font-bold mt-2 text-white">{member.name}</h3>
                  <div className="mt-4 space-y-2 text-slate-400 text-sm">
                    {member.year && <p className="flex items-center gap-2">🎓 {member.year}</p>}
                    {member.email && <p className="flex items-center gap-2">✉️ {member.email}</p>}
                    {member.phone && <p className="flex items-center gap-2">📱 {member.phone}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
