"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation, Users, MapPin, Power, Activity } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSy_demo_key_replace_me";

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
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 17.3850, lng: 78.4867 },
      zoom: 12,
      mapTypeId: 'terrain',
      disableDefaultUI: false,
    });
    
    // Allow admin to click to set destination
    newMap.addListener('click', (e: any) => {
      handleMapClick(e.latLng.lat(), e.latLng.lng());
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

  const updateDestMarker = (lat: number, lng: number) => {
    if (!map || !window.google) return;
    
    if (destMarker) {
      destMarker.setPosition({ lat, lng });
    } else {
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#F26D21",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFF"
        },
        title: "Trek Destination"
      });
      setDestMarker(marker);
    }
  };

  // Poll participant locations
  useEffect(() => {
    if (!selectedTrip || !map || !window.google) return;

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
          const latLng = new window.google.maps.LatLng(pt.lat, pt.lng);
          if (newMarkers[pt.user_id]) {
            newMarkers[pt.user_id].setPosition(latLng);
          } else {
            const marker = new window.google.maps.Marker({
              position: latLng,
              map,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#10b981", // emerald-500
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFF",
              },
              title: pt.users?.name || 'Participant'
            });
            
            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div style="color:black; font-weight:bold;">${pt.users?.name || 'User'}</div>
                        <div style="color:#666; font-size:12px;">Last seen: ${new Date(pt.timestamp).toLocaleTimeString()}</div>`
            });
            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
            
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
          <div ref={mapRef} className="absolute inset-0 z-0"></div>
          
          {/* Map Overlay info */}
          {selectedTrip && (
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex items-center gap-4">
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

          {!window.google && (
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-900 text-slate-500">
              <Activity className="w-8 h-8 animate-spin mr-3" />
              Initializing Map...
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
                   Active points will stream automatically when participants share location.
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
