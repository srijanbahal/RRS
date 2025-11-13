// File: src/pages/dashboard/components_d/AgentsList.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/store/authStore';
// import { MOCK_AGENTS } from '@/lib/mockData'; // <-- 1. Import
import type { Agent } from '@/lib/mockData'; // <-- 1. Import
import { AlertCircle } from 'lucide-react'; // <-- 2. Import icon

const AgentsList: React.FC = () => {
  const { token } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true); // <-- 3. Start in loading state
  const [error, setError] = useState<string | null>(null); // <-- 4. Add error state

  useEffect(() => {
    if (!token) {
      // If no token, just load mock data immediately
      setLoading(false);
      setError('Not logged in. Displaying mock data.');
      // setAgents(MOCK_AGENTS);
      return;
    }

    let isCancelled = false; // <-- 5. Add mount-check flag
    (async () => {
      setLoading(true);
      setError(null); // <-- 6. Clear previous errors
      try {
        const res = await fetch('/api/agents?team_only=true', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) setAgents(data || []);
        } else {
          throw new Error('Failed to fetch from server');
        }
      } catch (e: any) {
        console.error('Failed to fetch agents:', e.message);
        if (!isCancelled) {
          // 7. Load MOCK data on failure
          setError('Server offline. Displaying mock data.');
          // setAgents(MOCK_AGENTS);
        }
      } finally { 
        if (!isCancelled) setLoading(false); 
      }
    })();
    return () => { isCancelled = true; }; // <-- 8. Cleanup function
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.06 }} className="rounded-2xl border border-white/8 bg-white/3 p-5 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Your agents</h4>
        <div className="text-sm text-white/60">Manage</div>
      </div>

      {/* 9. Show error message */}
      {error && (
        <div className="mt-3 text-xs text-amber-300/80 p-2 bg-amber-900/30 rounded-lg flex gap-2 items-center">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {/* 10. Show loading/empty/data states */}
        {loading && <div className="text-sm text-white/60">Loading…</div>}
        
        {!loading && !error && agents.length === 0 && (
          <div className="text-sm text-white/60">No agents yet. Add one from the team page.</div>
        )}
        
        {!loading && agents.length > 0 && (
          agents.slice(0,4).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg bg-white/2 p-3">
              <div>
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs text-white/60">{a.type} • {a.provider || 'preset'}</div>
              </div>
              <div className="text-xs text-white/60">{a.personality || 'balanced'}</div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default AgentsList;