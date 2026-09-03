import { createClient } from "./supabase/client";

export class OfflineTracker {
  static watchId: number | null = null;
  static tripId: string | null = null;
  static syncInterval: any = null;

  static start(tripId: string) {
    if (typeof window === 'undefined') return;
    
    this.tripId = tripId;
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          trip_id: tripId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date(pos.timestamp).toISOString(),
        };
        this.savePoint(point);
      },
      (err) => console.error("GPS error", err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    window.addEventListener('online', this.sync.bind(this));
    this.syncInterval = setInterval(() => this.sync(), 10000); // Try syncing every 10s
    this.sync();
  }

  static stop() {
    if (typeof window === 'undefined') return;
    
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    window.removeEventListener('online', this.sync.bind(this));
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.sync();
  }

  static savePoint(point: any) {
    if (typeof window === 'undefined') return;
    
    const points = JSON.parse(localStorage.getItem('offline_gps_points') || '[]');
    points.push(point);
    localStorage.setItem('offline_gps_points', JSON.stringify(points));
    
    if (navigator.onLine) {
      this.sync();
    }
  }

  static async sync() {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    const points = JSON.parse(localStorage.getItem('offline_gps_points') || '[]');
    if (points.length === 0) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const pointsToInsert = points.map((p: any) => ({
      trip_id: p.trip_id,
      user_id: session.user.id,
      lat: p.lat,
      lng: p.lng,
      timestamp: p.timestamp
    }));

    const { error } = await supabase.from('trek_locations').insert(pointsToInsert);
    if (!error) {
      localStorage.setItem('offline_gps_points', '[]');
      console.log(`Synced ${pointsToInsert.length} points to cloud.`);
    } else {
      console.error("Failed to sync points", error);
    }
  }
}
