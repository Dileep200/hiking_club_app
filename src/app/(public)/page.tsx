"use client";

import { motion } from "framer-motion";
import { ArrowRight, Map, Calendar, Users, Activity } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [contactUrl, setContactUrl] = useState("mailto:hikingclub@university.edu");
  const [nextTrip, setNextTrip] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });
  const [isRegOpen, setIsRegOpen] = useState(true);
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
        const { data: regData } = await supabase.from('club_settings').select('value').eq('key', `trip_reg_${tripData.id}`).single();
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
              SRU HIKING CLUB
            </span>
          </motion.div>
          
          <motion.h1 
            className="heading-xl mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Explore Beyond <br /> Boundaries.
          </motion.h1>
          
          <motion.p 
            className="mt-4 text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Discover trails. Build memories. Conquer heights. <br className="hidden md:block"/>
            Join the most adventurous community on campus.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-sunset-orange hover:bg-sunset-amber text-white rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-sunset-orange/20 hover:scale-105">
              Join the Adventure <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/live" className="w-full sm:w-auto px-8 py-4 glass hover:bg-white/10 text-white rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105">
              <Activity className="h-5 w-5 text-green-400" /> Track Live Hike
            </Link>
            <div className="relative group w-full sm:w-auto">
              <a href={contactUrl || '#'} className="w-full sm:w-auto px-8 py-4 glass hover:bg-white/10 text-white rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105">
                Contact Us
              </a>
              {isAdmin && (
                <button onClick={() => {
                  const newUrl = prompt("Enter new Contact URL:", contactUrl);
                  if (newUrl !== null) handleUpdateContact(newUrl);
                }} className="absolute -top-3 -right-3 bg-slate-800 text-white text-xs px-2 py-1 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  Edit
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <span className="text-xs tracking-widest text-gray-400 uppercase mb-2">Scroll</span>
          <motion.div 
            className="w-1 h-12 bg-white/20 rounded-full overflow-hidden"
          >
            <motion.div 
              className="w-full bg-sunset-orange"
              initial={{ height: "0%" }}
              animate={{ height: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "circInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Next Hike Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="heading-lg mb-2">Next Adventure</h2>
              <p className="text-gray-400 text-lg">Don&apos;t miss out on our upcoming expedition.</p>
            </div>
            <Link href="/trips" className="mt-4 md:mt-0 flex items-center gap-2 text-sunset-amber hover:text-sunset-orange transition-colors">
              View All Trips <ArrowRight className="h-5 w-5" />
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
                  <Activity className={`w-4 h-4 ${
                    nextTrip.difficulty === 'Easy' ? 'text-emerald-400' : 
                    nextTrip.difficulty === 'Moderate' ? 'text-sunset-amber' : 
                    'text-rose-500'
                  }`} />
                  {nextTrip.difficulty}
                </div>
              </div>

              {/* Main Content Dashboard */}
              <div className="absolute inset-0 z-20 p-6 md:p-10 flex flex-col justify-end">
                <div className="max-w-5xl w-full">
                  <motion.h3 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-tight leading-tight"
                  >
                    {nextTrip.title}
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl font-medium leading-relaxed drop-shadow-md border-l-4 border-sunset-orange pl-6"
                  >
                    {nextTrip.details || `Get ready for our next adventure! Explore nature, conquer new heights, and build unforgettable memories with the club.`}
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                  >
                    {/* Stat Cards with Hover effects */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col group/stat hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                      <span className="text-emerald-400 mb-3 group-hover/stat:scale-110 group-hover/stat:-translate-y-1 transition-transform"><Calendar className="w-6 h-6"/></span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Date</span>
                      <span className="text-white font-black text-lg md:text-xl">{new Date(nextTrip.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col group/stat hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                      <span className="text-cyan-400 mb-3 group-hover/stat:scale-110 group-hover/stat:-translate-y-1 transition-transform"><Map className="w-6 h-6"/></span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Distance</span>
                      <span className="text-white font-black text-lg md:text-xl">{nextTrip.distance}</span>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col group/stat hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                      <span className="text-sunset-amber mb-3 group-hover/stat:scale-110 group-hover/stat:-translate-y-1 transition-transform"><Users className="w-6 h-6"/></span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Est. Budget</span>
                      <span className="text-white font-black text-lg md:text-xl">{nextTrip.budget || 'TBA'}</span>
                    </div>
                    
                    {/* Countdown Glass Element */}
                    <div className="bg-gradient-to-br from-sunset-orange/20 to-slate-900/50 backdrop-blur-md border border-sunset-orange/30 p-5 rounded-2xl flex flex-col justify-center relative overflow-hidden group/time">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-sunset-orange/30 blur-3xl rounded-full group-hover/time:bg-sunset-orange/50 transition-colors"></div>
                      <span className="text-xs text-sunset-orange uppercase tracking-wider font-bold mb-2">Launching In</span>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-black text-white leading-none drop-shadow-md">{timeLeft.days}</span>
                          <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mt-1">Days</span>
                        </div>
                        <span className="text-3xl font-black text-white/30 mb-4">:</span>
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-black text-white leading-none drop-shadow-md">{timeLeft.hours}</span>
                          <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mt-1">Hrs</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="flex flex-col lg:flex-row items-center gap-6"
                  >
                    {/* High-Tech Progress Bar */}
                    <div className="flex-1 w-full bg-black/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
                      <div className="flex justify-between items-end mb-4">
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
                          className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${isRegOpen ? 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400' : 'bg-slate-600'}`} 
                          style={{ width: `${Math.min(100, ((nextTrip.spots_filled || 0) / (nextTrip.spots || 40)) * 100)}%` }}
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
                    <Link href={`/trips/${nextTrip.id}`} className="w-full lg:w-auto shrink-0">
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
