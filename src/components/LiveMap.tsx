"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation, Battery, Activity, ShieldAlert, Mountain } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

declare global {
  interface Window {
    google: any;
  }
}

// Using Maps Demo Key as per google-maps-platform skill for prototyping
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSy_demo_key_replace_me";

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

    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;
    
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: location,
      zoom: 14,
      mapTypeId: 'terrain',
      disableDefaultUI: true,
      zoomControl: true,
    });
    setMap(newMap);

    // Initial marker (could use AdvancedMarkerElement but sticking to basic for standard key support)
    const newMarker = new window.google.maps.Marker({
      position: location,
      map: newMap,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#F26D21",
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: "#FFFFFF",
      },
    });
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
    if (map && marker) {
      const pos = new window.google.maps.LatLng(lat, lng);
      marker.setPosition(pos);
      map.panTo(pos);
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
      <div className="absolute top-6 left-6 z-10 bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center border border-white/10 shadow-xl">
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
          <p className="text-sm text-gray-400">Google Maps Platform</p>
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
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
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

      {/* Auth Error Overlay if Demo Key is invalid */}
      {!window.google && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-900 text-slate-500">
          <p>Initializing Google Maps...</p>
        </div>
      )}
    </div>
  );
}
