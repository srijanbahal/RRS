import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/store/authStore';

type Agent = {
  id: string;
  name: string;
  type: string;
  provider?: string;
  personality?: string;
};

const AgentsList: React.FC = () => {
  const { token } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/agents?team_only=true', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setAgents(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    })();
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.06 }} className="rounded-2xl border border-white/8 bg-white/3 p-5 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Your agents</h4>
        <div className="text-sm text-white/60">Manage</div>
      </div>

      <div className="mt-3 space-y-2">
        {loading && <div className="text-sm text-white/60">Loading…</div>}
        {!loading && agents.length === 0 && <div className="text-sm text-white/60">No agents yet. Add one from the team page.</div>}
        {agents.slice(0,4).map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg bg-white/2 p-3">
            <div>
              <div className="text-sm font-medium">{a.name}</div>
              <div className="text-xs text-white/60">{a.type} • {a.provider || 'preset'}</div>
            </div>
            <div className="text-xs text-white/60">{a.personality || 'balanced'}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AgentsList;