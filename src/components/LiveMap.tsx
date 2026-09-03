"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation, Activity } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

declare global {
  interface Window {
    L: any;
  }
}

export default function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [location, setLocation] = useState({ lat: 17.3850, lng: 78.4867 });
  const [watchId, setWatchId] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Fetch if user is admin
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (userData?.role === 'admin') setIsAdmin(true);
      }
    }
    init();

    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else if (window.L) {
      initializeMap();
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;
    
    if ((mapRef.current as any)._leaflet_id) return;

    const newMap = window.L.map(mapRef.current, {
      zoomControl: false
    }).setView([location.lat, location.lng], 14);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(newMap);

    setMap(newMap);

    const destIcon = window.L.divIcon({
      className: 'custom-live-marker',
      html: `<div style="width: 20px; height: 20px; background-color: #F26D21; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(242,109,33,0.8);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const newMarker = window.L.marker([location.lat, location.lng], { icon: destIcon }).addTo(newMap);
    setMarker(newMarker);
  };

  // Poll for location updates if NOT admin (i.e. just watching)
  useEffect(() => {
    if (isAdmin) return; // Admin pushes, doesn't poll

    const fetchLocation = async () => {
      const [latRes, lngRes, liveRes] = await Promise.all([
        supabase.from('club_settings').select('value').eq('key', 'live_lat').single(),
        supabase.from('club_settings').select('value').eq('key', 'live_lng').single(),
        supabase.from('club_settings').select('value').eq('key', 'is_live').single(),
      ]);

      if (liveRes.data?.value === 'true') {
        setIsLive(true);
        if (latRes.data && lngRes.data) {
          const lat = parseFloat(latRes.data.value);
          const lng = parseFloat(lngRes.data.value);
          updateMapPosition(lat, lng);
        }
      } else {
        setIsLive(false);
      }
    };

    const interval = setInterval(fetchLocation, 5000); // poll every 5s
    fetchLocation();
    return () => clearInterval(interval);
  }, [isAdmin]);

  const updateMapPosition = (lat: number, lng: number) => {
    setLocation({ lat, lng });
    if (map && marker && window.L) {
      marker.setLatLng([lat, lng]);
      map.panTo(new window.L.LatLng(lat, lng));
    }
  };

  const startGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLive(true);
    supabase.from('club_settings').upsert({ key: 'is_live', value: 'true' }).then();

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMapPosition(latitude, longitude);
        // Push to DB so viewers can see it
        supabase.from('club_settings').upsert([
          { key: 'live_lat', value: latitude.toString() },
          { key: 'live_lng', value: longitude.toString() }
        ]).then();
      },
      (error) => alert("GPS Error: " + error.message),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    setWatchId(id);
  };

  const stopGPS = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    setIsLive(false);
    supabase.from('club_settings').upsert({ key: 'is_live', value: 'false' }).then();
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800">
      
      {/* Map Container */}
      <div ref={mapRef} className="absolute inset-0 z-0"></div>
      
      {/* Map Header Overlay */}
      <div className="absolute top-6 left-6 z-[400] bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center border border-white/10 shadow-xl pointer-events-auto">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="relative flex h-3 w-3">
              {isLive ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
              )}
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {isLive ? "LIVE: Active Expedition" : "Standby Mode"}
            </h2>
          </div>
          <p className="text-sm text-gray-400">OpenStreetMap Live Broadcast</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 md:border-l border-white/20 md:pl-6">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 flex items-center gap-1"><Navigation className="h-3 w-3"/> Lat</span>
            <span className="font-mono text-white text-sm">{location.lat.toFixed(4)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 flex items-center gap-1"><Navigation className="h-3 w-3"/> Lng</span>
            <span className="font-mono text-white text-sm">{location.lng.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[400] pointer-events-auto">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-full flex items-center gap-2 border border-white/10 shadow-xl">
            {!isLive ? (
              <button onClick={startGPS} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-colors flex items-center gap-2">
                Turn On GPS Broadcast
              </button>
            ) : (
              <button onClick={stopGPS} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-colors flex items-center gap-2">
                Stop Broadcast
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {!window.L && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900 text-slate-500">
          <Activity className="w-8 h-8 animate-spin mr-3" />
          <p>Initializing OpenStreetMap...</p>
        </div>
      )}
    </div>
  );
}
