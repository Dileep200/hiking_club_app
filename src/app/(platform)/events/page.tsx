"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import ImageUpload from '@/components/ImageUpload';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Form states
  const [newAnn, setNewAnn] = useState({ title: '', content: '' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '', image_url: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (userData?.role === 'admin') setIsAdmin(true);
    }

    const [eventsRes, annRes] = await Promise.all([
      supabase.from('events').select('*').order('date', { ascending: true }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false })
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (annRes.data) setAnnouncements(annRes.data);
    setLoading(false);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('announcements').insert([newAnn]).select();
    if (data) setAnnouncements([data[0], ...announcements]);
    setNewAnn({ title: '', content: '' });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('events').insert([newEvent]).select();
    if (data) {
      // sort events by date
      const updated = [...events, data[0]].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(updated);
    }
    setNewEvent({ title: '', description: '', date: '', location: '', image_url: '' });
  };

  const handleRegister = async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert("Please log in");
    
    const { error } = await supabase.from('event_registrations').insert({ event_id: eventId, user_id: session.user.id });
    if (error) alert("You are already registered or an error occurred.");
    else alert("Successfully registered!");
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-cyan-400 p-8">Loading events...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        <div className="backdrop-blur-xl bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
            Events & Announcements
          </h1>
          <p className="text-gray-400 text-lg">Stay updated with the latest hikes and club news.</p>
        </div>

        {isAdmin && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-xl border border-emerald-500/30 p-6 md:p-8 rounded-3xl shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
                Post Announcement
              </h2>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <input required value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} placeholder="Announcement Title" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-400" />
                <textarea required value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} placeholder="What's the news?" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-400 h-32 resize-none"></textarea>
                <button type="submit" className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500 text-emerald-400 font-bold py-4 px-6 rounded-xl">
                  Publish
                </button>
              </form>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-cyan-500/30 p-6 md:p-8 rounded-3xl shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
                Create Event
              </h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <input required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Event Title" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400" />
                <input required value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="Short Description" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required type="datetime-local" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400" />
                  <input required value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} placeholder="Location" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Event Image (Optional)</label>
                  <ImageUpload onUploadSuccess={(url) => setNewEvent({...newEvent, image_url: url})} />
                  {newEvent.image_url && <img src={newEvent.image_url} className="h-12 mt-2 rounded" />}
                </div>
                <button type="submit" className="w-full bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500 text-cyan-400 font-bold py-4 px-6 rounded-xl">
                  Schedule Hike
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="bg-gradient-to-b from-cyan-400 to-cyan-600 w-2 h-8 rounded-full"></span>
              Upcoming Hikes
            </h2>
            {events.map((event) => (
              <div key={event.id} className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden transition-all hover:bg-white/10">
                {event.image_url && (
                  <div className="absolute inset-0 z-0 opacity-20">
                    <img src={event.image_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/80"></div>
                  </div>
                )}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{event.title}</h3>
                    <p className="text-gray-300 mb-5 text-lg">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                      <div className="bg-black/30 px-4 py-2 rounded-lg text-cyan-300 border border-white/5">
                        {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="bg-black/30 px-4 py-2 rounded-lg text-emerald-300 border border-white/5">
                        {event.location}
                      </div>
                    </div>
                  </div>
                  {!isAdmin && (
                    <button onClick={() => handleRegister(event.id)} className="w-full md:w-auto px-8 py-4 font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl">
                      Register Now
                    </button>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="bg-white/5 rounded-3xl p-12 text-center text-gray-400">No upcoming events.</div>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="bg-gradient-to-b from-emerald-400 to-emerald-600 w-2 h-8 rounded-full"></span>
              Announcements
            </h2>
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-gradient-to-br from-emerald-900/30 to-slate-900/40 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-emerald-300 mb-2">{ann.title}</h3>
                  <p className="text-gray-300 text-sm mb-4">{ann.content}</p>
                  <div className="text-xs text-emerald-500/80">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="bg-white/5 rounded-2xl p-8 text-center text-gray-400">No announcements.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
