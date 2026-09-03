"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation, Users, MapPin, Power, Activity } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    L: any; // Leaflet
  }
}

export default function AdminTracking() {
  const router = useRouter();
  const supabase = createClient();
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [map, setMap] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  
  const [participantMarkers, setParticipantMarkers] = useState<{ [id: string]: any }>({});
  const [destMarker, setDestMarker] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/');
        return;
      }
      const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (userData?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setIsAdmin(true);
      fetchTrips();
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
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;
    
    // Prevent re-initialization if map already exists on the container
    if ((mapRef.current as any)._leaflet_id) return;

    const newMap = window.L.map(mapRef.current, {
      zoomControl: false // We'll rely on default or add custom if needed
    }).setView([17.3850, 78.4867], 12);
    
    // Add OpenStreetMap tiles (Free, no API key required!)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(newMap);
    
    // Allow admin to click to set destination
    newMap.on('click', (e: any) => {
      handleMapClick(e.latlng.lat, e.latlng.lng);
    });
    
    setMap(newMap);
  };

  const fetchTrips = async () => {
    const { data } = await supabase.from('trips').select('*').order('date', { ascending: false }).limit(20);
    if (data) setTrips(data);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!selectedTrip) {
      alert("Please select a trip first before setting a destination.");
      return;
    }
    
    // Save destination to trip
    await supabase.from('trips').update({ destination_lat: lat, destination_lng: lng }).eq('id', selectedTrip.id);
    setSelectedTrip({ ...selectedTrip, destination_lat: lat, destination_lng: lng });
    
    updateDestMarker(lat, lng);
  };

  // Keep track of the active selected trip in a ref so event listeners access the latest state
  const selectedTripRef = useRef(selectedTrip);
  useEffect(() => {
    selectedTripRef.current = selectedTrip;
  }, [selectedTrip]);

  const updateDestMarker = (lat: number, lng: number) => {
    if (!map || !window.L) return;
    
    if (destMarker) {
      destMarker.setLatLng([lat, lng]);
    } else {
      // Create a custom pulsing destination marker using HTML
      const destIcon = window.L.divIcon({
        className: 'custom-dest-marker',
        html: `<div style="width: 24px; height: 24px; background-color: #F26D21; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(242,109,33,0.8); display: flex; align-items: center; justify-content: center;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = window.L.marker([lat, lng], { icon: destIcon }).addTo(map);
      marker.bindPopup("<b>Trek Destination</b>");
      setDestMarker(marker);
    }
  };

  // Poll participant locations
  useEffect(() => {
    if (!selectedTrip || !map || !window.L) return;

    if (selectedTrip.destination_lat && selectedTrip.destination_lng) {
      updateDestMarker(selectedTrip.destination_lat, selectedTrip.destination_lng);
    }

    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('trek_locations')
        .select('*, users(name)')
        .eq('trip_id', selectedTrip.id)
        .order('timestamp', { ascending: false });

      if (data) {
        // Group by user_id to get only the latest point
        const latestPerUser: { [key: string]: any } = {};
        for (const pt of data) {
          if (!latestPerUser[pt.user_id]) {
            latestPerUser[pt.user_id] = pt;
          }
        }
        
        // Update markers
        const newMarkers = { ...participantMarkers };
        Object.values(latestPerUser).forEach((pt: any) => {
          if (newMarkers[pt.user_id]) {
            newMarkers[pt.user_id].setLatLng([pt.lat, pt.lng]);
          } else {
            const userIcon = window.L.divIcon({
              className: 'custom-user-marker',
              html: `<div style="width: 16px; height: 16px; background-color: #10b981; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(16,185,129,0.8);"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });

            const marker = window.L.marker([pt.lat, pt.lng], { icon: userIcon }).addTo(map);
            
            const lastSeen = new Date(pt.timestamp).toLocaleTimeString();
            marker.bindPopup(`<div style="color:black; font-weight:bold;">${pt.users?.name || 'User'}</div><div style="color:#666; font-size:12px;">Last seen: ${lastSeen}</div>`);
            
            newMarkers[pt.user_id] = marker;
          }
        });
        setParticipantMarkers(newMarkers);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, [selectedTrip, map]);

  const toggleTracking = async () => {
    if (!selectedTrip) return;
    const newState = !selectedTrip.tracking_active;
    await supabase.from('trips').update({ tracking_active: newState }).eq('id', selectedTrip.id);
    setSelectedTrip({ ...selectedTrip, tracking_active: newState });
    setTrips(trips.map(t => t.id === selectedTrip.id ? { ...t, tracking_active: newState } : t));
  };

  if (!isAdmin) return null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Navigation className="text-emerald-400 h-8 w-8" />
            Live Trek Tracking
          </h1>
          <p className="text-slate-400 mt-1">Admin control center for participant GPS monitoring</p>
        </div>
        
        <div className="flex gap-4">
          <select 
            className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner min-w-[200px]"
            onChange={(e) => {
              const trip = trips.find(t => t.id === e.target.value);
              setSelectedTrip(trip || null);
            }}
            value={selectedTrip?.id || ""}
          >
            <option value="">Select a Trip to Track...</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>{trip.title} ({new Date(trip.date).toLocaleDateString()})</option>
            ))}
          </select>
          
          {selectedTrip && (
            <button
              onClick={toggleTracking}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                selectedTrip.tracking_active 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
              }`}
            >
              <Power className="w-5 h-5" />
              {selectedTrip.tracking_active ? 'End Tracking' : 'Start Tracking'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[70vh]">
        
        {/* Map Area */}
        <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl bg-slate-900">
          {/* We must render Leaflet in a stable DOM element */}
          <div ref={mapRef} className="absolute inset-0 z-0"></div>
          
          {/* Map Overlay info */}
          {selectedTrip && (
            <div className="absolute top-4 left-4 z-[400] bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 flex items-center gap-4 shadow-xl pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {selectedTrip.tracking_active ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
                  )}
                </span>
                <span className="text-white font-bold text-sm">
                  {selectedTrip.tracking_active ? 'TRACKING LIVE' : 'OFFLINE'}
                </span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="text-slate-300 text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4 text-sunset-orange" />
                Click map to set destination
              </div>
            </div>
          )}

          {!window.L && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900 text-slate-500">
              <Activity className="w-8 h-8 animate-spin mr-3" />
              Initializing Free OpenStreetMap...
            </div>
          )}
        </div>

        {/* Dashboard Stats */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white border-b border-white/10 pb-4">Trek Status</h3>
          
          {selectedTrip ? (
            <>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Participants Online</div>
                <div className="text-3xl font-black text-white flex items-center gap-3">
                  <Users className="text-cyan-400 w-8 h-8" />
                  {Object.keys(participantMarkers).length}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Destination Coords</div>
                <div className="font-mono text-sm text-white">
                  {selectedTrip.destination_lat 
                    ? `${selectedTrip.destination_lat.toFixed(5)}, ${selectedTrip.destination_lng.toFixed(5)}` 
                    : 'Not set yet'}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-3">
                 <div className="text-sm text-slate-400 italic">
                   Active points will stream automatically when participants share location. OpenStreetMap is providing the live map tiles for free.
                 </div>
              </div>
            </>
          ) : (
            <div className="text-slate-400 text-center mt-10">
              Select a trip to view live status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
