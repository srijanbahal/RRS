// File: src/pages/auth/CreateTeamPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/store/authStore';
import { Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar'; // <-- 1. Import Navbar

export default function CreateTeamPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { fetchProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (form submission logic remains the same)
    e.preventDefault();
    if (!name || !slug) {
      setError('Please fill out both fields.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.teams.create({ name, slug });
      await fetchProfile();
      navigate('/app/create-agents', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create team. Is the slug unique?');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071018] to-[#05060a] text-white flex flex-col">
      <Navbar /> {/* <-- 2. Add Navbar */}
      
      <div className="flex-1 grid place-items-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-2xl font-semibold">Step 1: Create Your Team</h2>
              <p className="text-white/70">
                Welcome, Participant. You need a team to start racing.
                This will be your permanent team.
              </p>
              
              {error && (
                <div className="text-red-300 bg-red-900/40 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* ... (form inputs remain the same) ... */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Team Name
                </label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aperture Racing"
                  className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Team Slug (Unique URL)
                </label>
                <input 
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. aperture-racing"
                  className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10"
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-2xl 
                           bg-gradient-to-r from-sky-500 to-violet-500 px-5 font-medium 
                           shadow-lg shadow-sky-500/20 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    Next: Create Agents <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}