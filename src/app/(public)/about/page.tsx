"use client";

import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function AboutPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [aboutSections, setAboutSections] = useState<any[]>([]);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [editingAboutId, setEditingAboutId] = useState<number | null>(null);
  const [newAboutTitle, setNewAboutTitle] = useState("");
  const [newAboutContent, setNewAboutContent] = useState("");
  const [newAboutImage, setNewAboutImage] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (userData?.role === 'admin') setIsAdmin(true);
      }
      
      const { data: aboutData } = await supabase.from('club_settings').select('value').eq('key', 'about_sections').single();
      if (aboutData && aboutData.value) {
        try {
          setAboutSections(JSON.parse(aboutData.value));
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

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
    <main className="min-h-screen bg-slate-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-emerald-500/20 rounded-full border border-emerald-500/30">
              <Info className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 tracking-tight">
            About Our Club
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Discover our story, mission, and the amazing community behind the SRU Hiking Club.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-16">
            {aboutSections.length === 0 && !isAdmin ? (
              <div className="bg-slate-800/50 rounded-3xl p-12 text-center border border-white/5">
                <p className="text-slate-400 italic">No about information is currently available.</p>
              </div>
            ) : (
              aboutSections.map((section, index) => (
                <div key={section.id} className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                  {section.image_url && (
                    <div className="w-full md:w-1/2">
                      <div className="relative h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                        <img src={section.image_url} alt={section.title || 'About Image'} className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                      </div>
                    </div>
                  )}
                  <div className={`w-full ${section.image_url ? 'md:w-1/2' : ''}`}>
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
        )}

        {isAdmin && (
          <div className="mt-16 text-center border-t border-white/10 pt-16">
            {!isEditingAbout ? (
              <button 
                onClick={() => setIsEditingAbout(true)}
                className="px-6 py-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-sm font-bold uppercase tracking-wider border border-emerald-500/50 flex items-center gap-2 mx-auto transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" /> Add About Section
              </button>
            ) : (
              <div id="about-form" className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-left max-w-3xl mx-auto shadow-2xl">
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
                      rows={6}
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
    </main>
  );
}
