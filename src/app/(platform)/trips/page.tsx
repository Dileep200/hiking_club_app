"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

interface Trip {
  id: string;
  title: string;
  date: string;
  distance: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  imageUrl: string;
  image_url?: string;
  spots: number;
  spots_filled: number;
  budget: string;
  details: string;
}

export default function TripsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [regStatuses, setRegStatuses] = useState<Record<string, string>>({});
  const supabase = createClient();
  
  useEffect(() => {
    const fetchTripsAndRole = async () => {
      // Check role
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (userData && userData.role === 'admin') setIsAdmin(true);
      }

      // Fetch trips
      const { data } = await supabase.from('trips').select('*').neq('status', 'completed');
      if (data) setTrips(data as Trip[]);

      // Fetch reg statuses
      const { data: regData } = await supabase.from('club_settings').select('*').like('key', 'trip_reg_%');
      if (regData) {
        const statuses: Record<string, string> = {};
        regData.forEach(r => { statuses[r.key] = r.value; });
        setRegStatuses(statuses);
      }
    };
    fetchTripsAndRole();
  }, []);

  const handleToggleRegistration = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'closed' ? 'open' : 'closed';
    const key = `trip_reg_${id}`;
    await supabase.from('club_settings').upsert({ key, value: newStatus });
    setRegStatuses({ ...regStatuses, [key]: newStatus });
  };
  
  // form state
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [newTrip, setNewTrip] = useState<Partial<Trip> & { reg_status?: string }>({
    title: '', date: '', distance: '', difficulty: 'Easy', imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=800&auto=format&fit=crop',
    spots: 40, spots_filled: 0, budget: '', details: '', reg_status: 'open'
  });

  const handleSubmitTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.title || !newTrip.date || !newTrip.distance) return;
    
    const tripData = {
      title: newTrip.title,
      date: newTrip.date,
      distance: newTrip.distance,
      difficulty: newTrip.difficulty,
      image_url: newTrip.imageUrl,
      spots: newTrip.spots,
      spots_filled: newTrip.spots_filled,
      budget: newTrip.budget,
      details: newTrip.details
    };

    if (editingTripId) {
      // Update existing trip
      const { data, error } = await supabase.from('trips').update(tripData).eq('id', editingTripId).select();
      if (data && data.length > 0) {
        const updatedTrip = data[0] as Trip;
        setTrips(trips.map(t => t.id === editingTripId ? updatedTrip : t));
        
        // Update reg status if it changed
        const updatedStatus = newTrip.reg_status || 'open';
        await supabase.from('club_settings').upsert({ key: `trip_reg_${updatedTrip.id}`, value: updatedStatus });
        setRegStatuses(prev => ({ ...prev, [`trip_reg_${updatedTrip.id}`]: updatedStatus }));
      }
      setEditingTripId(null);
    } else {
      // Insert new trip
      const { data, error } = await supabase.from('trips').insert([tripData]).select();
      if (data && data.length > 0) {
        const createdTrip = data[0] as Trip;
        setTrips([...trips, createdTrip]);
        
        // Save initial registration status
        const initialStatus = newTrip.reg_status || 'open';
        await supabase.from('club_settings').upsert({ key: `trip_reg_${createdTrip.id}`, value: initialStatus });
        setRegStatuses(prev => ({ ...prev, [`trip_reg_${createdTrip.id}`]: initialStatus }));
      }
    }
    
    setNewTrip({ title: '', date: '', distance: '', difficulty: 'Easy', imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=800&auto=format&fit=crop', spots: 40, spots_filled: 0, budget: '', details: '', reg_status: 'open' });
  };

  const handleEditClick = (trip: Trip) => {
    setEditingTripId(trip.id);
    setNewTrip({
      title: trip.title,
      date: trip.date,
      distance: trip.distance,
      difficulty: trip.difficulty,
      imageUrl: trip.imageUrl || trip.image_url || '',
      spots: trip.spots,
      spots_filled: trip.spots_filled,
      budget: trip.budget,
      details: trip.details,
      reg_status: regStatuses[`trip_reg_${trip.id}`] || 'open'
    });
    setTimeout(() => {
      document.getElementById('admin-trip-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteTrip = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (!error) {
      setTrips(trips.filter(t => t.id !== id));
    } else {
      alert('Error deleting trip: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Upcoming Trips
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Explore the wild with our exclusive guided hikes.</p>
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-3 bg-emerald-500/10 p-3 rounded-full border border-emerald-500/20 backdrop-blur-md">
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider px-2">Admin Mode Active</span>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Trip Cards */}
          <div className={`grid gap-6 ${isAdmin ? 'lg:col-span-8 grid-cols-1 md:grid-cols-2' : 'lg:col-span-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {trips.map((trip) => (
              <div key={trip.id} onClick={() => router.push(`/trips/${trip.id}`)} className="cursor-pointer group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-emerald-500/20 hover:border-emerald-500/30 flex flex-col">
                <div className="relative h-56 w-full shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/60 z-10 pointer-events-none"></div>
                  <img src={trip.image_url || trip.imageUrl || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=800&auto=format&fit=crop'} alt={trip.title} className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                  
                  <div className="absolute top-4 right-4 z-20">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-lg ${
                      trip.difficulty === 'Easy' ? 'bg-emerald-500/90 text-white border-emerald-400' :
                      trip.difficulty === 'Moderate' ? 'bg-amber-500/90 text-white border-amber-400' :
                      'bg-rose-500/90 text-white border-rose-400'
                    }`}>
                      {trip.difficulty}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 relative z-20 flex-1 flex flex-col bg-slate-900">
                  <h3 className="text-2xl font-bold text-white mb-4 tracking-tight capitalize">{trip.title}</h3>
                  
                  <div className="mb-4 flex items-center">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${
                      regStatuses[`trip_reg_${trip.id}`] === 'closed'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    }`}>
                      {regStatuses[`trip_reg_${trip.id}`] !== 'closed' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                      {regStatuses[`trip_reg_${trip.id}`] === 'closed' && (
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      )}
                      {regStatuses[`trip_reg_${trip.id}`] === 'closed' ? 'Registration Closed' : 'Registration Live'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-3 text-slate-300 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-[15px]">{trip.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <span className="font-medium text-[15px]">{trip.distance}</span>
                    </div>
                    {(trip.spots || trip.budget) && (
                      <div className="flex items-center gap-4 mt-1 pt-3 border-t border-white/10">
                        {trip.spots && (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Spots</span>
                            <span className="font-semibold text-white">{trip.spots_filled || 0} / {trip.spots} Filled</span>
                          </div>
                        )}
                        {trip.budget && (
                          <div className="flex flex-col border-l border-white/10 pl-4">
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Budget</span>
                            <span className="font-semibold text-white">{trip.budget}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {trip.details && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-slate-400 line-clamp-2">{trip.details}</p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Admin Controls</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            handleToggleRegistration(trip.id, regStatuses[`trip_reg_${trip.id}`] || 'open'); 
                          }}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-lg ${
                            regStatuses[`trip_reg_${trip.id}`] === 'closed'
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                          }`}
                        >
                          {regStatuses[`trip_reg_${trip.id}`] === 'closed' ? 'Make Registration Live' : 'Close Registration'}
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            handleEditClick(trip); 
                          }}
                          className="px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/50"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            handleDeleteTrip(trip.id); 
                          }}
                          className="px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Admin Create / Edit Form */}
          {isAdmin && (
            <div id="admin-trip-form" className="lg:col-span-4 h-fit sticky top-8">
              <div className="relative overflow-hidden rounded-3xl bg-slate-800 border border-slate-700 shadow-2xl p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white relative z-10">
                  <span className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  {editingTripId ? 'Edit Trip' : 'Create New Trip'}
                </h2>
                
                <form onSubmit={handleSubmitTrip} className="space-y-6 relative z-10">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Trip Title</label>
                    <input 
                      type="text" 
                      required
                      value={newTrip.title}
                      onChange={e => setNewTrip({...newTrip, title: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                      placeholder="e.g. Everest Base Camp"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Date</label>
                    <input 
                      type="date" 
                      required
                      value={newTrip.date}
                      onChange={e => setNewTrip({...newTrip, date: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Distance</label>
                    <input 
                      type="text" 
                      required
                      value={newTrip.distance}
                      onChange={e => setNewTrip({...newTrip, distance: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                      placeholder="e.g. 12 km"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Total Spots</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={newTrip.spots}
                        onChange={e => setNewTrip({...newTrip, spots: parseInt(e.target.value)})}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                        placeholder="e.g. 40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Spots Filled</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={newTrip.spots_filled}
                        onChange={e => setNewTrip({...newTrip, spots_filled: parseInt(e.target.value)})}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                        placeholder="e.g. 15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Est. Budget / Person</label>
                      <input 
                        type="text" 
                        required
                        value={newTrip.budget}
                        onChange={e => setNewTrip({...newTrip, budget: e.target.value})}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                        placeholder="e.g. ₹1500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Difficulty</label>
                      <div className="relative">
                        <select 
                          value={newTrip.difficulty}
                          onChange={e => setNewTrip({...newTrip, difficulty: e.target.value as any})}
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner appearance-none"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Hard">Hard</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Registration Status</label>
                      <div className="relative">
                        <select 
                          value={newTrip.reg_status || 'open'}
                          onChange={e => setNewTrip({...newTrip, reg_status: e.target.value})}
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner appearance-none"
                        >
                          <option value="open">Live (Open)</option>
                          <option value="closed">Closed</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Further Details</label>
                    <textarea 
                      required
                      value={newTrip.details}
                      onChange={e => setNewTrip({...newTrip, details: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                      placeholder="Enter the itinerary, required gear, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Trip Image</label>
                    <ImageUpload onUploadSuccess={(url) => setNewTrip({...newTrip, imageUrl: url})} />
                    {newTrip.imageUrl && <img src={newTrip.imageUrl} alt="Preview" className="mt-2 h-16 w-16 object-cover rounded-xl" />}
                  </div>

                  <div className="flex gap-4 mt-8">
                    {editingTripId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTripId(null);
                          setNewTrip({ title: '', date: '', distance: '', difficulty: 'Easy', imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=800&auto=format&fit=crop', spots: 40, spots_filled: 0, budget: '', details: '', reg_status: 'open' });
                        }}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transform transition hover:-translate-y-1 focus:outline-none"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      type="submit"
                      className="flex-[2] bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/25 transform transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 active:translate-y-0"
                    >
                      {editingTripId ? 'Save Changes' : 'Add Trip'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
