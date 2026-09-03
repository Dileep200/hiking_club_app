import React, { useState, useEffect } from 'react';

export default function GPSBroadcaster() {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number;

    if (isBroadcasting) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            setPosition(pos);
            setError(null);
            // Mock Supabase Realtime push logic
            console.log('Pushing position to Supabase:', {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp,
            });
          },
          (err) => {
            setError(err.message);
            console.error('Geolocation error:', err);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        setError('Geolocation is not supported by your browser.');
      }
    } else {
      setPosition(null);
      setError(null);
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isBroadcasting]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-6">
      <div 
        className="w-full max-w-sm p-8 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6 relative overflow-hidden"
      >
        <h2 className="text-2xl font-semibold tracking-wide text-white/90">
          Trip Leader GPS
        </h2>

        {error && (
          <div className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {isBroadcasting && position ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="relative flex items-center justify-center w-24 h-24 mb-2">
              <div className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-12 h-12 bg-red-500 rounded-full border-4 border-white/20"></div>
            </div>
            
            <div className="w-full bg-black/20 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60 font-medium">Latitude</span>
                <span className="font-mono text-white/90">{position.coords.latitude.toFixed(6)}&deg;</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60 font-medium">Longitude</span>
                <span className="font-mono text-white/90">{position.coords.longitude.toFixed(6)}&deg;</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-white/10 mt-1">
                <span className="text-white/60 font-medium">Accuracy</span>
                <span className="font-mono text-white/90">&plusmn;{Math.round(position.coords.accuracy)}m</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsBroadcasting(false)}
              className="mt-4 w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            >
              Stop Broadcast
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsBroadcasting(true)}
            className="w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:-translate-y-1 mt-4"
          >
            Start Live Hike
          </button>
        )}
      </div>
    </div>
  );
}
