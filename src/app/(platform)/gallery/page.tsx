"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import ImageUpload from '@/components/ImageUpload';

interface Photo {
  id: string;
  image_url: string;
  caption: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  // New Photo Form
  const [newCaption, setNewCaption] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (userData && userData.role === 'admin') setIsAdmin(true);
    }
    const { data } = await supabase.from('gallery_photos').select('*').order('created_at', { ascending: false });
    if (data) setPhotos(data);
    setLoading(false);
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl) return alert('Please upload a photo first.');
    const { data, error } = await supabase.from('gallery_photos').insert([{ image_url: newImageUrl, caption: newCaption }]).select();
    if (!error && data) {
      setPhotos([data[0], ...photos]);
      setNewCaption('');
      setNewImageUrl('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo?')) return;
    await supabase.from('gallery_photos').delete().eq('id', id);
    setPhotos(photos.filter(p => p.id !== id));
  };

  if (loading) return <div className="p-8 text-emerald-400">Loading gallery...</div>;

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2">Photo Gallery</h1>
            <p className="text-slate-400 text-lg">Memories from our adventures.</p>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white/5 p-6 rounded-2xl border border-emerald-500/30">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">Add New Photo</h2>
            <form onSubmit={handleAddPhoto} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-slate-300">Upload Image</label>
                <ImageUpload onUploadSuccess={setNewImageUrl} />
                {newImageUrl && <img src={newImageUrl} className="h-24 mt-2 rounded-lg object-cover" />}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300">Caption (Optional)</label>
                <input 
                  type="text" 
                  value={newCaption} 
                  onChange={e => setNewCaption(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <button type="submit" className="px-6 py-2 bg-emerald-500 text-slate-900 font-bold rounded-xl hover:bg-emerald-400">Add to Gallery</button>
            </form>
          </div>
        )}

        {photos.length === 0 ? (
          <p className="text-slate-500 italic">No photos in the gallery yet.</p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {photos.map((photo) => (
              <div key={photo.id} className="break-inside-avoid group relative overflow-hidden rounded-2xl shadow-lg">
                <img src={photo.image_url} alt={photo.caption} className="w-full h-auto object-cover" loading="lazy" />
                
                {(photo.caption || isAdmin) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white font-semibold text-lg">{photo.caption}</span>
                    {isAdmin && (
                      <button onClick={() => handleDelete(photo.id)} className="mt-2 text-sm text-red-400 hover:text-red-300 w-fit">
                        Delete Photo
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
