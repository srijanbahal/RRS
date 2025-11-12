// File: src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/store/authStore';
import TeamCard from './components_d/TeamCard';
import AgentsList from './components_d/AgentsList';
import RoomsList from './components_d/RoomsList';
import LiveRaces from './components_d/LiveRaces';
import CreateRoomModal from './components_d/CreateRoomModal';

const DashboardPage: React.FC = () => {
  const { user, fetchProfile } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  if (!user) return null; // Route guard should prevent this

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071018] to-[#05060a] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="col-span-1">
          <TeamCard user={user} onCreateRoom={() => setShowCreate(true)} />
          <AgentsList />
        </aside>

        <main className="col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Live races</h2>
              <div className="text-sm text-white/60">Realtime races and quick actions</div>
            </div>
            <LiveRaces />
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Rooms & Lobby</h2>
              <div>
                <button onClick={() => setShowCreate(true)} className="rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-medium shadow-lg shadow-sky-500/20">Create room</button>
              </div>
            </div>
            <RoomsList />
          </section>
        </main>
      </div>

      <CreateRoomModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
};

export default DashboardPage;