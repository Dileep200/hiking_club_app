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
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (userData?.role === 'admin') setIsAdmin(true);
      }
      
      const { data } = await supabase.from('club_settings').select('value').eq('key', 'contact_url').single();
      if (data) setContactUrl(data.value);
    }
    loadData();
  }, []);

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
              UNIVERSITY HIKING CLUB
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

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-dark rounded-3xl p-1 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-forest-green/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="flex flex-col lg:flex-row relative z-10">
              <div className="lg:w-2/5 relative min-h-[300px] lg:min-h-[400px] rounded-2xl overflow-hidden m-2">
                <Image 
                  src="https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=3540&auto=format&fit=crop" 
                  alt="Trek destination"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Registration Open</span>
                </div>
              </div>
              
              <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Maredumilli Monsoon Trek</h3>
                  <p className="text-gray-300 mb-8 max-w-xl">
                    Experience the dense forests, waterfalls, and pristine nature of the Eastern Ghats. This moderate trek is perfect for all skill levels and includes overnight camping.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1 flex items-center gap-1"><Calendar className="h-4 w-4"/> Date</span>
                      <span className="text-white font-semibold">Oct 12 - 14</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1 flex items-center gap-1"><Map className="h-4 w-4"/> Distance</span>
                      <span className="text-white font-semibold">18 km</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1 flex items-center gap-1"><Activity className="h-4 w-4"/> Difficulty</span>
                      <span className="text-sunset-amber font-semibold">Moderate</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1 flex items-center gap-1"><Users className="h-4 w-4"/> Spots</span>
                      <span className="text-white font-semibold">12 / 40 Left</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
                  <div className="glass px-6 py-3 rounded-xl flex items-center gap-4 w-full sm:w-auto">
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-white">14</span>
                      <span className="text-xs text-gray-400 uppercase">Days</span>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-white">08</span>
                      <span className="text-xs text-gray-400 uppercase">Hrs</span>
                    </div>
                  </div>
                  <Link href="/trips/maredumilli" className="w-full sm:w-auto px-8 py-4 bg-white text-dark-charcoal hover:bg-gray-200 rounded-xl font-bold transition-colors text-center">
                    View Trip Details
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
