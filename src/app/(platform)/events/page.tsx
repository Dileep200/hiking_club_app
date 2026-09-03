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
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [newAnn, setNewAnn] = useState({ title: '', content: '' });
  
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
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

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAnnId) {
      const { data } = await supabase.from('announcements').update(newAnn).eq('id', editingAnnId).select();
      if (data) setAnnouncements(announcements.map(a => a.id === editingAnnId ? data[0] : a));
      setEditingAnnId(null);
    } else {
      const { data } = await supabase.from('announcements').insert([newAnn]).select();
      if (data) setAnnouncements([data[0], ...announcements]);
    }
    setNewAnn({ title: '', content: '' });
  };

  const handleEditAnn = (ann: any) => {
    setEditingAnnId(ann.id);
    setNewAnn({ title: ann.title, content: ann.content });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEventId) {
      const { data } = await supabase.from('events').update(newEvent).eq('id', editingEventId).select();
      if (data) {
        const updated = events.map(ev => ev.id === editingEventId ? data[0] : ev).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(updated);
      }
      setEditingEventId(null);
    } else {
      const { data } = await supabase.from('events').insert([newEvent]).select();
      if (data) {
        const updated = [...events, data[0]].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(updated);
      }
    }
    setNewEvent({ title: '', description: '', date: '', location: '', image_url: '' });
  };

  const handleEditEvent = (ev: any) => {
    setEditingEventId(ev.id);
    setNewEvent({ title: ev.title, description: ev.description, date: ev.date, location: ev.location, image_url: ev.image_url });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegister = async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert("Please log in");
    
    const { error } = await supabase.from('event_registrations').insert({ event_id: eventId, user_id: session.user.id });
    if (error) alert("You are already registered or an error occurred.");
    else alert("Successfully registered!");
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    } else {
      alert("Error deleting announcement");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
      setEvents(events.filter(e => e.id !== id));
    } else {
      alert("Error deleting event");
    }
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
                {editingAnnId ? 'Edit Announcement' : 'Post Announcement'}
              </h2>
              <form onSubmit={handleSubmitAnnouncement} className="space-y-4">
                <input required value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} placeholder="Announcement Title" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-400" />
                <textarea required value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} placeholder="What's the news?" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-400 h-32 resize-none"></textarea>
                <div className="flex gap-4">
                  {editingAnnId && (
                    <button type="button" onClick={() => { setEditingAnnId(null); setNewAnn({ title: '', content: '' }); }} className="flex-1 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-white font-bold py-4 px-6 rounded-xl">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="flex-[2] bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500 text-emerald-400 font-bold py-4 px-6 rounded-xl transition-all">
                    {editingAnnId ? 'Save Changes' : 'Post'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-cyan-500/30 p-6 md:p-8 rounded-3xl shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
                {editingEventId ? 'Edit Event' : 'Create Event'}
              </h2>
              <form onSubmit={handleSubmitEvent} className="space-y-4">
                <input required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Event Title" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400" />
                <input required value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="Short Description" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400" />
                  <input required value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} placeholder="Location" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Event Image (Optional)</label>
                  <ImageUpload onUploadSuccess={(url) => setNewEvent({...newEvent, image_url: url})} />
                  {newEvent.image_url && <img src={newEvent.image_url} className="h-12 mt-2 rounded" />}
                </div>
                <div className="flex gap-4">
                  {editingEventId && (
                    <button type="button" onClick={() => { setEditingEventId(null); setNewEvent({ title: '', description: '', date: '', location: '', image_url: '' }); }} className="flex-1 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-white font-bold py-4 px-6 rounded-xl">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="flex-[2] bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500 text-cyan-400 font-bold py-4 px-6 rounded-xl transition-all">
                    {editingEventId ? 'Save Changes' : 'Schedule Hike'}
                  </button>
                </div>
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
                  {!isAdmin ? (
                    <button onClick={() => handleRegister(event.id)} className="w-full md:w-auto px-8 py-4 font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors">
                      Register Now
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <button onClick={() => handleEditEvent(event)} className="w-full md:w-auto px-8 py-3 font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors text-sm">
                        Edit Event
                      </button>
                      <button onClick={() => handleDeleteEvent(event.id)} className="w-full md:w-auto px-8 py-3 font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors text-sm">
                        Delete Event
                      </button>
                    </div>
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
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-xs text-emerald-500/80">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEditAnn(ann)} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
                          Delete
                        </button>
                      </div>
                    )}
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
