import React, { useEffect, useState } from 'react';

type Room = {
  id: string;
  name: string;
  circuitName: string;
  currentPlayers: number;
  maxPlayers: number;
};

const RoomsList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setRooms(data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="mt-4 grid gap-3">
      {loading && <div className="text-sm text-white/60">Loading rooms…</div>}
      {!loading && rooms.length === 0 && <div className="text-sm text-white/60">No rooms found.</div>}
      {rooms.map(r => (
        <div key={r.id} className="rounded-lg border border-white/8 bg-white/3 p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-white/60">{r.circuitName} • {r.currentPlayers}/{r.maxPlayers}</div>
          </div>
          <div className="flex items-center gap-2">
            <a className="text-sm underline" href={`/rooms/${r.id}`}>Open</a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomsList;
