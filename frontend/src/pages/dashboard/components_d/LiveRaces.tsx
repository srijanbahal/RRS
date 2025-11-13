// File: src/pages/dashboard/components_d/LiveRaces.tsx
import React, { useEffect, useState } from 'react';
import RaceCard from './RaceCard';
// import { MOCK_RACES } from '@/lib/mockData'; // <-- 1. Import
import type { RaceSummary } from '@/lib/mockData'; // <-- 1. Import
import { AlertCircle } from 'lucide-react'; // <-- 2. Import icon

const LiveRaces: React.FC = () => {
  const [races, setRaces] = useState<RaceSummary[]>([]);
  const [loading, setLoading] = useState(true); // <-- 3. Start in loading state
  const [error, setError] = useState<string | null>(null); // <-- 4. Add error state

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setLoading(true);
      setError(null); // <-- 5. Clear previous errors
      try {
        const res = await fetch('/api/races?status=ACTIVE');
        if (!res.ok) throw new Error('Failed to fetch from server');
        const data = await res.json();
        if (mounted) setRaces(data || []);
      } catch (e: any) { 
        console.error('Failed to fetch live races:', e.message);
        if (mounted) {
          // 6. Load MOCK data on failure
          setError('Server offline. Displaying mock data.');
          // setRaces(MOCK_RACES);
        }
      }
      finally { 
        if (mounted) setLoading(false); 
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="mt-4 grid md:grid-cols-2 gap-3">
      {/* 7. Show error message */}
      {error && (
        <div className="md:col-span-2 text-xs text-amber-300/80 p-2 bg-amber-900/30 rounded-lg flex gap-2 items-center">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* 8. Show loading/empty/data states */}
      {loading && <div className="text-sm text-white/60 md:col-span-2">Loading live races…</div>}
      
      {!loading && !error && races.length === 0 && (
        <div className="text-sm text-white/60 md:col-span-2">No live races found.</div>
      )}
      
      {!loading && races.length > 0 && (
        races.map(r => <RaceCard key={r.id} race={r} />)
      )}
    </div>
  );
};

export default LiveRaces;