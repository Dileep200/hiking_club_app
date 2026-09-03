"use client";

import { motion } from "framer-motion";
import { ArrowRight, Map, Calendar, Users, Activity, Plus, Trash2, Edit2, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import LiveTrekTracker from "@/components/LiveTrekTracker";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [contactUrl, setContactUrl] = useState("mailto:hikingclub@university.edu");
  const [nextTrip, setNextTrip] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });
  const [isRegOpen, setIsRegOpen] = useState(true);
  const [aboutSections, setAboutSections] = useState<any[]>([]);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [editingAboutId, setEditingAboutId] = useState<number | null>(null);
  const [newAboutTitle, setNewAboutTitle] = useState("");
  const [newAboutContent, setNewAboutContent] = useState("");
  const [newAboutImage, setNewAboutImage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (userData?.role === 'admin') setIsAdmin(true);
      }
      
      const { data: contactData } = await supabase.from('club_settings').select('value').eq('key', 'contact_url').single();
      if (contactData) setContactUrl(contactData.value);

      const { data: aboutData } = await supabase.from('club_settings').select('value').eq('key', 'about_sections').single();
      if (aboutData && aboutData.value) {
        try {
          setAboutSections(JSON.parse(aboutData.value));
        } catch (e) {
          console.error(e);
        }
      }

      // Fetch next adventure
      const today = new Date().toISOString().split('T')[0];
      const { data: tripData } = await supabase.from('trips')
        .select('*')
        .gte('date', today)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .limit(1)
        .single();

      if (tripData) {
        setNextTrip(tripData);
        updateTimeLeft(tripData.date);

        // Fetch reg status
        const { data: regData } = await supabase.from('club_settings').select('value').eq('key', \	rip_reg_\\).single();
        if (regData && regData.value === 'closed') {
          setIsRegOpen(false);
        }
      }
    }
    loadData();

    // Setup timer to update every hour
    const timer = setInterval(() => {
      if (nextTrip) updateTimeLeft(nextTrip.date);
    }, 1000 * 60 * 60);

    return () => clearInterval(timer);
  }, [nextTrip?.date]); // Include nextTrip.date in dependency to keep the interval fresh

  const updateTimeLeft = (dateString: string) => {
    const tripDate = new Date(dateString);
    const now = new Date();
    const diffTime = tripDate.getTime() - now.getTime();
    if (diffTime > 0) {
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft({ days: diffDays, hours: diffHours });
    }
  };

  const handleUpdateContact = async (newUrl: string) => {
    const { error } = await supabase.from('club_settings').upsert({ key: 'contact_url', value: newUrl });
    if (!error) setContactUrl(newUrl);
    else alert("Error updating contact URL");
  };

  const saveAboutSections = async (newSections: any[]) => {
    const { error } = await supabase.from('club_settings').upsert({ key: 'about_sections', value: JSON.stringify(newSections) });
    if (!error) setAboutSections(newSections);
    else alert("Error saving about sections");
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAboutTitle && !newAboutContent && !newAboutImage) return;

    let newSections = [...aboutSections];
    if (editingAboutId !== null) {
      newSections = newSections.map(s => s.id === editingAboutId ? { ...s, title: newAboutTitle, content: newAboutContent, image_url: newAboutImage } : s);
    } else {
      newSections.push({ id: Date.now(), title: newAboutTitle, content: newAboutContent, image_url: newAboutImage });
    }
    
    await saveAboutSections(newSections);
    setNewAboutTitle("");
    setNewAboutContent("");
    setNewAboutImage("");
    setEditingAboutId(null);
    setIsEditingAbout(false);
  };

  const handleDeleteAbout = async (id: number) => {
    if (!confirm("Delete this section?")) return;
    const newSections = aboutSections.filter(s => s.id !== id);
    await saveAboutSections(newSections);
  };

  const handleEditAbout = (section: any) => {
    setEditingAboutId(section.id);
    setNewAboutTitle(section.title || "");
    setNewAboutContent(section.content || "");
    setNewAboutImage(section.image_url || "");
    setIsEditingAbout(true);
    setTimeout(() => {
      document.getElementById('about-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=3540&auto=format&fit=crop"
          alt="Cinematic mountains"
          fill
          priority
          quality={85}
          className="object-cover object-center opacity-40 -z-10"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-dark-charcoal/80 to-dark-charcoal"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block py-1 px-3 rounded-full glass text-sunset-amber text-sm font-semibold tracking-wider mb-6">
              UNIVERSITY HIKING CLUB
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl"
          >
            CONQUER<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">THE PEAKS</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 font-medium tracking-wide drop-shadow-md"
          >
            Join a community of adventurers exploring the most breathtaking trails across the state.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/trips">
              <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold uppercase tracking-wider transition-all transform hover:-translate-y-1 shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] flex items-center gap-2 mx-auto">
                Discover Trips <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center"
        >
          <span className="text-xs uppercase tracking-widest mb-2 font-semibold">Scroll to explore</span>
          <div className="w-0.5 h-12 bg-gradient-to-b from-white/50 to-transparent rounded-full"></div>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-24 relative bg-dark-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 tracking-tight">About Our Club</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Discover our story, mission, and the amazing people behind the University Hiking Club.</p>
          </div>

          <div className="space-y-16">
            {aboutSections.length === 0 && !isAdmin ? (
              <p className="text-center text-slate-500 italic">No about information available.</p>
            ) : (
              aboutSections.map((section, index) => (
                <div key={section.id} className={\lex flex-col md:flex-row gap-8 items-center \\}>
                  {section.image_url && (
                    <div className="w-full md:w-1/2">
                      <div className="relative h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                        <img src={section.image_url} alt={section.title || 'About Image'} className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                      </div>
                    </div>
                  )}
                  <div className={\w-full \\}>
                    {section.title && <h3 className="text-3xl font-bold text-white mb-4">{section.title}</h3>}
                    {section.content && <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">{section.content}</p>}
                    
                    {isAdmin && (
                      <div className="mt-6 flex gap-3">
                        <button onClick={() => handleEditAbout(section)} className="px-4 py-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-lg text-sm font-bold uppercase border border-cyan-500/50 flex items-center gap-2 transition-colors">
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleDeleteAbout(section.id)} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold uppercase border border-red-500/50 flex items-center gap-2 transition-colors">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {isAdmin && (
            <div className="mt-16 text-center">
              {!isEditingAbout ? (
                <button 
                  onClick={() => setIsEditingAbout(true)}
                  className="px-6 py-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-sm font-bold uppercase tracking-wider border border-emerald-500/50 flex items-center gap-2 mx-auto transition-colors shadow-lg"
                >
                  <Plus className="w-5 h-5" /> Add About Section
                </button>
              ) : (
                <div id="about-form" className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-left max-w-3xl mx-auto shadow-2xl mt-8">
                  <h3 className="text-2xl font-bold text-white mb-6">{editingAboutId ? 'Edit About Section' : 'Add New About Section'}</h3>
                  <form onSubmit={handleSaveAbout} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Section Title (Optional)</label>
                      <input 
                        type="text" 
                        value={newAboutTitle} 
                        onChange={e => setNewAboutTitle(e.target.value)} 
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        placeholder="e.g. Our Mission"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Content (Optional)</label>
                      <textarea 
                        value={newAboutContent} 
                        onChange={e => setNewAboutContent(e.target.value)} 
                        rows={4}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        placeholder="Enter the text content here..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Image URL (Optional)</label>
                      <input 
                        type="text" 
                        value={newAboutImage} 
                        onChange={e => setNewAboutImage(e.target.value)} 
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        placeholder="e.g. https://images.unsplash.com/photo-..."
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => { setIsEditingAbout(false); setEditingAboutId(null); setNewAboutTitle(""); setNewAboutContent(""); setNewAboutImage(""); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-colors">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-colors">
                        Save Section
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Live Trek Tracking Section */}
      <section className="py-24 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-slate-900 to-slate-900 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight flex items-center justify-center gap-4">
              <MapPin className="w-10 h-10 text-emerald-400 animate-bounce" />
              Live Trek Tracking
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Follow our active expeditions in real-time. Parents and members can view the live progress of current treks.</p>
          </div>
          
          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-slate-800">
            <LiveTrekTracker allowAdmin={true} />
          </div>
        </div>
      </section>

      {/* Next Adventure Showcase */}
      <section className="py-32 relative bg-dark-charcoal">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                The Next Adventure
              </h2>
              <p className="text-slate-400 mt-2 text-lg">Prepare yourself for our upcoming major expedition.</p>
            </div>
            
            <Link href="/trips">
              <button className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                View All Trips <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {nextTrip ? (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full rounded-[2.5rem] overflow-hidden min-h-[650px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] group isolate"
            >
              {/* Background Cinematic Image with Parallax & Zoom */}
              <div className="absolute inset-0 z-0">
                <Image 
                  src={nextTrip.image_url || "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=3540&auto=format&fit=crop"} 
                  alt={nextTrip.title}
                  fill
                  sizes="100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
                  priority
                />
                {/* Multi-layered gradient overlays for cinematic depth and readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent z-10 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/40 to-transparent z-10"></div>
              </div>

              {/* Top Floating Badges */}
              <div className="absolute top-6 left-6 right-6 md:top-10 md:left-10 md:right-10 z-30 flex flex-wrap justify-between items-start gap-4">
                {isRegOpen ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }}
                    className="px-5 py-2.5 rounded-full bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/50 text-emerald-300 font-black tracking-widest uppercase text-xs flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                  >
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Registrations Live
                  </motion.div>
                ) : (
                  <div className="px-5 py-2.5 rounded-full bg-red-500/20 backdrop-blur-xl border border-red-500/50 text-red-300 font-black tracking-widest uppercase text-xs flex items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                    Registrations Closed
                  </div>
                )}
                
                <div className="px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white font-bold tracking-widest uppercase text-xs flex items-center gap-2 shadow-lg">
                  <Activity className={\w-4 h-4 \\} />
                  {nextTrip.difficulty}
                </div>
              </div>

              {/* Main Content Dashboard */}
              <div className="absolute inset-0 z-20 p-6 md:p-10 flex flex-col justify-end">
                <div className="max-w-5xl w-full">
                  <motion.h3 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-tight leading-tight capitalize"
                  >
                    {nextTrip.title}
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl font-medium leading-relaxed drop-shadow-md border-l-4 border-sunset-orange pl-6"
                  >
                    {nextTrip.details || 'Join us for an unforgettable experience in the wild. Push your limits and discover breathtaking landscapes.'}
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="flex flex-col lg:flex-row gap-6 lg:items-end justify-between"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      {/* Interactive Stat Cards */}
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group/stat">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="p-3 bg-emerald-500/20 rounded-xl group-hover/stat:scale-110 transition-transform">
                            <Calendar className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Date</p>
                            <p className="text-lg font-bold text-white">{nextTrip.date}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group/stat">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="p-3 bg-cyan-500/20 rounded-xl group-hover/stat:scale-110 transition-transform">
                            <Map className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Distance</p>
                            <p className="text-lg font-bold text-white">{nextTrip.distance}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="w-full lg:w-72 bg-black/40 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shrink-0">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          Spot Availability
                        </span>
                        <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          {Math.max(0, (nextTrip.spots || 40) - (nextTrip.spots_filled || 0))} Spots Left
                        </span>
                      </div>
                      <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] relative">
                        {/* Glowing progress track */}
                        <div 
                          className={\h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden \\} 
                          style={{ width: \\%\ }}
                        >
                          {/* Shimmer effect inside the bar */}
                          {isRegOpen && (
                            <div className="absolute top-0 left-0 bottom-0 right-0 w-[200%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between mt-3 text-xs text-slate-400 font-bold uppercase tracking-widest">
                        <span>{nextTrip.spots_filled || 0} Members Filled</span>
                        <span>{nextTrip.spots || 40} Total Capacity</span>
                      </div>
                    </div>

                    {/* Magnetic Action Button */}
                    <Link href={\/trips/\\} className="w-full lg:w-auto shrink-0">
                      <button className="w-full lg:w-auto px-10 py-6 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)] hover:-translate-y-1 flex items-center justify-center gap-4 group/btn">
                        View Full Details
                        <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                      </button>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-dark rounded-3xl p-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">More Adventures Coming Soon</h3>
              <p className="text-gray-400">We are currently planning our next exciting trips. Check back later!</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
