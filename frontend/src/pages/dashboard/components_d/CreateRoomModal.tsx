import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/store/authStore';

interface Props { open: boolean; onClose: () => void }

const CreateRoomModal: React.FC<Props> = ({ open, onClose }) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [circuit, setCircuit] = useState('Monaco');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!open) { setName(''); setCircuit('Monaco'); setMaxPlayers(4); } }, [open]);

  const create = async () => {
    if (!token) return alert('Not authenticated');
    setSubmitting(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, circuitId: circuit, maxPlayers })
      });
      if (!res.ok) throw new Error('create failed');
      const data = await res.json();
      onClose();
      window.location.href = `/rooms/${data.room_id || data.id}`;
    } catch (e) {
      console.error(e); alert('Failed to create room');
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-2xl bg-[#0b0f17] border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create room</h3>
          <button onClick={onClose} className="text-white/60">Close</button>
        </div>

        <div className="mt-4 grid gap-3">
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Room name" className="rounded-lg bg-white/5 p-3 outline-none" />
          <select value={circuit} onChange={(e)=>setCircuit(e.target.value)} className="rounded-lg bg-white/5 p-3">
            <option>Monaco</option>
            <option>Silverstone</option>
            <option>Monza</option>
          </select>
          <input type="number" value={maxPlayers} onChange={(e)=>setMaxPlayers(Number(e.target.value))} min={2} max={6} className="rounded-lg bg-white/5 p-3" />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={create} className="rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 font-semibold" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</button>
          <button onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateRoomModal;
