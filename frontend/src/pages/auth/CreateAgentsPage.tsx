// File: src/pages/auth/CreateAgentsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/store/authStore';
import { Loader2, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar'; // <-- 1. Import Navbar

export default function CreateAgentsPage() {
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('balanced');
  const [agents, setAgents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { fetchProfile } = useAuth();
  const navigate = useNavigate();

  // ... (useEffect and handleAddAgent logic remains the same) ...
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await api.agents.getMyAgents();
        setAgents(data.agents || []);
      } catch (err) {
        console.error("Failed to fetch agents", err);
      }
    };
    loadAgents();
  }, []);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Please give your agent a name.');
      return;
    }
    if (agents.length >= 2) {
      setError('You can create a maximum of 2 agents for now.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const newAgent = await api.agents.create({
        name,
        type: "LLM", 
        provider: "mock",
        personality,
      });
      setAgents([...agents, newAgent.agent]);
      setName('');
      setPersonality('balanced');
      await fetchProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to create agent.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const onFinish = () => {
    if (agents.length === 0) {
      setError("Please create at least one agent to continue.");
      return;
    }
    navigate('/app/team', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071018] to-[#05060a] text-white flex flex-col">
      <Navbar /> {/* <-- 2. Add Navbar */}

      <div className="flex-1 grid place-items-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
            
            <h2 className="text-2xl font-semibold">Step 2: Create Your Agents</h2>
            <p className="text-white/70 mb-4">
              Your team needs AI drivers. Create up to 2 agents to start.
            </p>
            {/* ... (rest of the form remains the same) ... */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {agents.map(agent => (
                <div key={agent.id} className="bg-white/10 p-3 rounded-lg border border-white/20 flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-white/60">{agent.personality}</div>
                  </div>
                </div>
              ))}
              {agents.length < 1 && <div className="bg-white/5 p-3 rounded-lg text-center text-white/60">Agent 1 slot</div>}
              {agents.length < 2 && <div className="bg-white/5 p-3 rounded-lg text-center text-white/60">Agent 2 slot</div>}
            </div>

            {agents.length < 2 && (
              <form onSubmit={handleAddAgent} className="space-y-4 border-t border-white/10 pt-6">
                <h3 className="text-lg font-medium">Add New Agent ({agents.length + 1} of 2)</h3>
                {error && (
                  <div className="text-red-300 bg-red-900/40 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Agent Name</label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. AlphaBot"
                      className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Personality</label>
                    <select
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10"
                      disabled={submitting}
                    >
                      <option value="balanced">Balanced</option>
                      <option value="aggressive">Aggressive</option>
                      <option value="defensive">Defensive</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 h-10 w-full rounded-lg
                             bg-sky-500/50 px-5 font-medium 
                             hover:bg-sky-500/70 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" /> 
                  ) : (
                    <>Add Agent</>
                  )}
                </button>
              </form>
            )}

            {agents.length > 0 && (
              <div className="border-t border-white/10 mt-6 pt-6">
                <button
                  onClick={onFinish}
                  className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-2xl 
                             bg-linear-to-r from-emerald-500 to-cyan-500 px-5 font-medium 
                             shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                >
                  Finish Onboarding <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </div>
  );
}