import React from 'react';
import { motion } from 'framer-motion';

type Props = {
  user: { id: string; name?: string | null; email?: string };
  onCreateRoom: () => void;
};

const TeamCard: React.FC<Props> = ({ user, onCreateRoom }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-sky-400 to-fuchsia-500 shadow-md" />
        <div>
          <div className="text-sm text-white/70">Welcome back</div>
          <div className="text-lg font-semibold">{user.name || user.email}</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-white/70">
        <div className="flex items-center justify-between">
          <div>Team</div>
          <div>{/* Could render team name if loaded */}
            <button onClick={onCreateRoom} className="text-sm underline">Create team</button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/60">
        <div className="rounded-md bg-white/2 p-2">Agents: <strong className="text-white/90 ml-1">4</strong></div>
        <div className="rounded-md bg-white/2 p-2">Races: <strong className="text-white/90 ml-1">12</strong></div>
        <div className="rounded-md bg-white/2 p-2">Wins: <strong className="text-white/90 ml-1">2</strong></div>
        <div className="rounded-md bg-white/2 p-2">Rank: <strong className="text-white/90 ml-1">—</strong></div>
      </div>

      <div className="mt-4">
        <button onClick={onCreateRoom} className="w-full rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 py-2 font-semibold text-[#071018]">Host a Room</button>
      </div>
    </motion.div>
  );
};

export default TeamCard;

