// File: src/pages/dashboard/components_d/RoomsList.tsx
import React, { useEffect, useState } from 'react';
// import { MOCK_ROOMS } from '@/lib/mockData'; // <-- 1. Import
import type { Room } from '@/lib/mockData'; // <-- 1. Import
import { AlertCircle } from 'lucide-react'; // <-- 2. Import icon

const RoomsList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true); // <-- 3. Start in loading state
  const [error, setError] = useState<string | null>(null); // <-- 4. Add error state

  useEffect(() => {
    let isCancelled = false; // <-- 5. Add mount-check flag
    (async () => {
      setLoading(true);
      setError(null); // <-- 6. Clear previous errors
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) throw new Error('Failed to fetch from server');
        const data = await res.json();
        if (!isCancelled) setRooms(data || []);
      } catch (e: any) { 
        console.error('Failed to fetch rooms:', e.message);
        if (!isCancelled) {
          // 7. Load MOCK data on failure
          setError('Server offline. Displaying mock data.');
          // setRooms(MOCK_ROOMS);
        }
      }
      finally { 
        if (!isCancelled) setLoading(false); 
      }
    })();
    return () => { isCancelled = true; }; // <-- 8. Cleanup function
  }, []);

  return (
    <div className="mt-4 grid gap-3">
      {/* 9. Show error message */}
      {error && (
        <div className="text-xs text-amber-300/80 p-2 bg-amber-900/30 rounded-lg flex gap-2 items-center">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* 10. Show loading/empty/data states */}
      {loading && <div className="text-sm text-white/60">Loading rooms…</div>}
      
      {!loading && !error && rooms.length === 0 && (
        <div className="text-sm text-white/60">No rooms found.</div>
      )}
      
      {!loading && rooms.length > 0 && (
        rooms.map(r => (
          <div key={r.id} className="rounded-lg border border-white/8 bg-white/3 p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-white/60">{r.circuitName} • {r.currentPlayers}/{r.maxPlayers}</div>
            </div>
            <div className="flex items-center gap-2">
              <a className="text-sm underline" href={`/rooms/${r.id}`}>Open</a>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RoomsList;