import React, { useEffect, useState } from 'react';
import RaceCard from './RaceCard';

type RaceSummary = {
  id: string;
  name?: string;
  status?: string;
  circuit?: { name?: string };
  currentLap?: number;
  maxLaps?: number;
  cars?: Record<string, any>;
};

const LiveRaces: React.FC = () => {
  const [races, setRaces] = useState<RaceSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/races?status=ACTIVE');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (mounted) setRaces(data || []);
      } catch (e) { console.error(e); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="mt-4 grid md:grid-cols-2 gap-3">
      {loading && <div className="text-sm text-white/60">Loading live races…</div>}
      {races.map(r => <RaceCard key={r.id} race={r} />)}
    </div>
  );
};

export default LiveRaces;