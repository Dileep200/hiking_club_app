"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation, MapPin } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

declare global {
  interface Window {
    L: any;
  }
}

export default function LiveTrekTracker({ 
  allowAdmin = false 
}: { 
  allowAdmin?: boolean 
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [destMarker, setDestMarker] = useState<any>(null);
  const participantMarkers = useRef<{ [key: string]: any }>({});
  
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        if (allowAdmin) {
          const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
          if (userData?.role === 'admin') setIsAdmin(true);
        }
      }

      const { data: trips } = await supabase.from('trips')
        .select('*')
        .eq('tracking_active', true)
        .order('date', { ascending: false })
        .limit(1);

      if (trips && trips.length > 0) {
        setActiveTrip(trips[0]);
      }
    }
    init();

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      setTimeout(initializeMap, 500);
    }

    return () => stopTracking();
  }, [allowAdmin]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;
    if ((mapRef.current as any)._leaflet_id) return;

    const newMap = window.L.map(mapRef.current, {
      zoomControl: true
    }).setView([17.3850, 78.4867], 12);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(newMap);
    
    setMap(newMap);
  };

  useEffect(() => {
    if (!map || !activeTrip) return;

    if (activeTrip.destination_lat && activeTrip.destination_lng) {
      updateDestMarker(activeTrip.destination_lat, activeTrip.destination_lng);
      map.setView([activeTrip.destination_lat, activeTrip.destination_lng], 14);
    }

    if (isAdmin) {
      map.on('click', async (e: any) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        await supabase.from('trips').update({ destination_lat: lat, destination_lng: lng }).eq('id', activeTrip.id);
        setActiveTrip({ ...activeTrip, destination_lat: lat, destination_lng: lng });
        updateDestMarker(lat, lng);
      });
    }

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 5000);
    return () => clearInterval(interval);
  }, [map, activeTrip, isAdmin]);

  const updateDestMarker = (lat: number, lng: number) => {
    if (!window.L) return;
    if (destMarker) {
      destMarker.setLatLng([lat, lng]);
    } else {
      const destIcon = window.L.divIcon({
        className: 'custom-dest-marker',
        html: `<div style="width: 20px; height: 20px; background-color: #ef4444; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(239,68,68,0.8); display: flex; align-items: center; justify-content: center;"><div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      const marker = window.L.marker([lat, lng], { icon: destIcon }).addTo(map);
      marker.bindPopup(`<div style="color:black; font-weight:bold;">Trek Destination</div>`);
      setDestMarker(marker);
    }
  };

  const fetchParticipants = async () => {
    if (!activeTrip || !window.L) return;
    
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const { data } = await supabase.from('trek_locations')
      .select('*, users(name)')
      .eq('trip_id', activeTrip.id)
      .gte('timestamp', oneHourAgo)
      .order('timestamp', { ascending: false });

    if (data) {
      const latestPerUser: { [key: string]: any } = {};
      for (const pt of data) {
        if (!latestPerUser[pt.user_id]) {
          latestPerUser[pt.user_id] = pt;
        }
      }
      
      Object.values(latestPerUser).forEach((pt: any) => {
        const userName = pt.users?.name || 'Hiker';
        if (participantMarkers.current[pt.user_id]) {
          participantMarkers.current[pt.user_id].setLatLng([pt.lat, pt.lng]);
          participantMarkers.current[pt.user_id].setPopupContent(`<div style="color:black; font-weight:bold; padding: 2px;">` + userName + `</div>`);
        } else {
          const userIcon = window.L.divIcon({
            className: 'custom-user-marker',
            html: `<div style="display:flex; flex-direction:column; align-items:center; gap:2px; transform:translateY(-100%);">
                     <div style="background:rgba(0,0,0,0.7); color:white; padding:2px 8px; border-radius:12px; font-size:11px; white-space:nowrap; border:1px solid rgba(255,255,255,0.2); font-weight:600;">` + userName + `</div>
                     <div style="width:14px; height:14px; background-color:#10b981; border-radius:50%; border:2px solid white; box-shadow:0 0 10px rgba(16,185,129,0.8);"></div>
                   </div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });

          const marker = window.L.marker([pt.lat, pt.lng], { icon: userIcon }).addTo(map);
          marker.bindPopup(`<div style="color:black; font-weight:bold;">` + userName + `</div>`);
          participantMarkers.current[pt.user_id] = marker;
        }
      });
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    if (!activeTrip) {
      alert("No active live trek found to join.");
      return;
    }

    if (!userId) {
      alert("Please login first to share your location!");
      return;
    }

    setIsTracking(true);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        pushLocation(pos.coords.latitude, pos.coords.longitude);
        if (map) map.setView([pos.coords.latitude, pos.coords.longitude], 15);
      },
      (err) => {
        alert("Failed to get location. Please allow GPS permissions.");
        setIsTracking(false);
      },
      { enableHighAccuracy: true }
    );

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        pushLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setWatchId(id);
  };

  const pushLocation = async (lat: number, lng: number) => {
    if (!activeTrip || !userId) return;
    await supabase.from('trek_locations').insert([
      { trip_id: activeTrip.id, user_id: userId, lat, lng }
    ]);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  if (!activeTrip) {
    return (
      <div className="w-full h-64 bg-slate-800/50 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <MapPin className="w-12 h-12 mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">No Active Live Trek</h3>
        <p>There are no ongoing treks right now. Check the Upcoming Trips section!</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
      <div ref={mapRef} className="w-full h-[500px] md:h-[600px] bg-slate-900 z-0 relative"></div>

      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg">
          <h3 className="text-white font-bold">{activeTrip.title}</h3>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Tracking Active
          </p>
        </div>
        
        {isAdmin && (
          <div className="bg-amber-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-amber-400 shadow-lg backdrop-blur-md">
            Admin: Click Map to Set Destination
          </div>
        )}
      </div>

      {userId && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <button 
            onClick={toggleTracking}
            className={`px-8 py-4 rounded-full font-black uppercase tracking-widest transition-all shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
              isTracking 
                ? 'bg-rose-500/90 text-white border-rose-400 hover:bg-rose-600' 
                : 'bg-emerald-500/90 text-white border-emerald-400 hover:bg-emerald-600'
            }`}
          >
            {isTracking ? (
              <>
                <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                Stop Sharing Location
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                Share My GPS Location
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
