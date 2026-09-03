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
  spots: number;
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
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    title: '', date: '', distance: '', difficulty: 'Easy', imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=800&auto=format&fit=crop',
    spots: 40, budget: '', details: ''
  });

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.title || !newTrip.date || !newTrip.distance) return;
    
    const tripToInsert = {
      title: newTrip.title,
      date: newTrip.date,
      distance: newTrip.distance,
      difficulty: newTrip.difficulty,
      image_url: newTrip.imageUrl,
      spots: newTrip.spots,
      budget: newTrip.budget,
      details: newTrip.details
    };

    const { data, error } = await supabase.from('trips').insert([tripToInsert]).select();
    if (data && data.length > 0) {
      setTrips([...trips, data[0] as Trip]);
    }
    setNewTrip({ title: '', date: '', distance: '', difficulty: 'Easy', imageUrl: '' });
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
              <div key={trip.id} onClick={() => router.push(`/trips/${trip.id}`)} className="cursor-pointer group relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-emerald-500/20 hover:border-emerald-500/30">
                <div className="relative h-64 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10"></div>
                  <img src={(trip as any).image_url || trip.imageUrl || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=800&auto=format&fit=crop'} alt={trip.title} className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                  
                  <div className="absolute top-4 right-4 z-20">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-lg ${
                      trip.difficulty === 'Easy' ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50' :
                      trip.difficulty === 'Moderate' ? 'bg-amber-500/30 text-amber-200 border-amber-500/50' :
                      'bg-rose-500/30 text-rose-200 border-rose-500/50'
                    }`}>
                      {trip.difficulty}
                    </span>
                    {isAdmin && (
                      <>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleToggleRegistration(trip.id, regStatuses[`trip_reg_${trip.id}`] || 'open'); 
                          }}
                          className={`ml-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-lg transition-colors ${
                            regStatuses[`trip_reg_${trip.id}`] === 'closed'
                              ? 'bg-amber-500/80 text-white border-amber-500 hover:bg-amber-600'
                              : 'bg-green-500/80 text-white border-green-500 hover:bg-green-600'
                          }`}
                        >
                          {regStatuses[`trip_reg_${trip.id}`] === 'closed' ? 'Reg Closed' : 'Reg Open'}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }}
                          className="ml-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-lg bg-red-500/80 text-white border-red-500 hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="p-6 relative z-20 -mt-16 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-12">
                  <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-md">{trip.title}</h3>
                  
                  {/* Non-admins see reg status here */}
                  {!isAdmin && (
                    <div className="mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        regStatuses[`trip_reg_${trip.id}`] === 'closed'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-green-500/20 text-green-300 border-green-500/30'
                      }`}>
                        {regStatuses[`trip_reg_${trip.id}`] === 'closed' ? 'Registration Closed' : 'Registration Open'}
                      </span>
                    </div>
                  )}
                  
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
                            <span className="font-semibold text-white">{trip.spots} Total</span>
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
                </div>
              </div>
            ))}
          </div>

          {/* Admin Create Form */}
          {isAdmin && (
            <div className="lg:col-span-4 transition-all duration-500 ease-in-out">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
                
                <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
                  <span className="p-2 bg-emerald-500/20 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Create New Trip
                </h2>
                
                <form onSubmit={handleCreateTrip} className="space-y-6 relative z-10">
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
                      type="text" 
                      required
                      value={newTrip.date}
                      onChange={e => setNewTrip({...newTrip, date: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                      placeholder="e.g. Jan 15, 2027"
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

                  <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Difficulty</label>
                    <div className="relative">
                      <select 
                        value={newTrip.difficulty}
                        onChange={e => setNewTrip({...newTrip, difficulty: e.target.value as any})}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none shadow-inner cursor-pointer"
                      >
                        <option className="bg-slate-800 text-white" value="Easy">Easy</option>
                        <option className="bg-slate-800 text-white" value="Moderate">Moderate</option>
                        <option className="bg-slate-800 text-white" value="Hard">Hard</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
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

                  <button 
                    type="submit"
                    className="w-full mt-8 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/25 transform transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 active:translate-y-0"
                  >
                    Add Trip
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
